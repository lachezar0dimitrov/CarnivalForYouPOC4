import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type Route =
  | 'home'
  | 'products'
  | 'product-detail'
  | 'about'
  | 'services'
  | 'news'
  | 'contacts'
  | 'terms'
  | 'admin';

// The page a product-detail view was opened from — its route, the exact
// filters/category that were active at that moment (e.g. /products with
// category=3 for "Мъжки", or category=10 for "Хелоуин"), and how far down
// that page was scrolled. Captured once on entering the product-detail flow
// and carried unchanged through any number of Prev/Next or "similar
// suggestions" hops, so "Back" always returns to that same filtered view (at
// the same scroll position) — not just the last product that happened to be
// visited before it.
type Origin = {
  route: Route;
  queryParams: Record<string, string>;
  scrollY: number;
};

type RouterContextType = {
  route: Route;
  productId: string | null;
  queryParams: Record<string, string>;
  navigate: (route: Route, idOrParams?: string | Record<string, string>, params?: Record<string, string>) => void;
  // Updates the current page's query string in place (history.replaceState,
  // no new entry) — used by pages whose filters live in local state to keep
  // the URL mirroring them, so it's accurate whenever a product-detail
  // origin is captured from it.
  updateQuery: (params: Record<string, string>) => void;
  // Returns to the tracked origin (see Origin above) when one exists;
  // otherwise falls back to an explicit route/params, for entry points with
  // no origin (a direct link, a page refresh).
  goBack: (fallbackRoute: Route, fallbackIdOrParams?: string | Record<string, string>) => void;
  // Set to the origin's saved scrollY right after a goBack() that used a
  // tracked origin, so the destination page can restore it once its content
  // has loaded (rather than the default reset-to-top). The destination page
  // must call clearScrollRestore() once it has consumed it.
  pendingScrollRestore: number | null;
  clearScrollRestore: () => void;
};

const RouterContext = createContext<RouterContextType | null>(null);

const validRoutes: Route[] = [
  'home', 'products', 'product-detail', 'about', 'services', 'news', 'contacts', 'terms', 'admin',
];

// Parse a real path like "/products?category=2" or "/product-detail/123".
// Real (non-hash) paths so crawlers and Cloudflare Pages Functions can see
// which page is being requested — a hash fragment never reaches the server,
// which made per-product OpenGraph previews impossible under the old
// hash-routing scheme.
function parseLocation(): { route: Route; productId: string | null; queryParams: Record<string, string> } {
  const pathPart = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');

  const queryParams: Record<string, string> = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    queryParams[key] = value;
  });

  if (pathPart.startsWith('product-detail/')) {
    return { route: 'product-detail', productId: pathPart.split('/')[1] ?? null, queryParams };
  }
  const r = validRoutes.includes(pathPart as Route) ? (pathPart as Route) : 'home';
  return { route: r, productId: null, queryParams };
}

type State = {
  route: Route;
  productId: string | null;
  queryParams: Record<string, string>;
  origin: Origin | null;
  pendingScrollRestore: number | null;
};

function buildPath(route: Route, params?: Record<string, string> | null): string {
  let path = route === 'home' ? '/' : `/${route}`;
  if (params && Object.keys(params).length > 0) {
    path += `?${new URLSearchParams(params).toString()}`;
  }
  return path;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() =>
    typeof window !== 'undefined'
      ? { ...parseLocation(), origin: null, pendingScrollRestore: null }
      : { route: 'home', productId: null, queryParams: {}, origin: null, pendingScrollRestore: null }
  );

  useEffect(() => {
    // A real browser back/forward can land anywhere — the tracked origin
    // was only ever valid for the in-app navigation chain that built it, so
    // it's dropped here rather than carried into a history state we don't
    // control. goBack() falls back to the current product's own category in
    // that case (see ProductDetailPage).
    const onPopState = () =>
      setState({ ...parseLocation(), origin: null, pendingScrollRestore: null });
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (
    next: Route,
    idOrParams?: string | Record<string, string>,
    params?: Record<string, string>
  ) => {
    let path = '';

    if (next === 'product-detail' && typeof idOrParams === 'string') {
      path = `/product-detail/${idOrParams}`;
    } else {
      path = next === 'home' ? '/' : `/${next}`;
    }

    const query = params ?? (idOrParams && typeof idOrParams === 'object' ? idOrParams : null);
    if (query && Object.keys(query).length > 0) {
      const searchParams = new URLSearchParams(query);
      path += `?${searchParams.toString()}`;
    }

    window.history.pushState({}, '', path);
    setState((prev) => {
      // Entering the product-detail flow from elsewhere records that page
      // (and its exact filters + scroll position) as the origin. Moving
      // between products while already inside the flow keeps the existing
      // origin instead of overwriting it with the product just left.
      const origin: Origin | null =
        next === 'product-detail'
          ? prev.route === 'product-detail'
            ? prev.origin
            : { route: prev.route, queryParams: prev.queryParams, scrollY: window.scrollY }
          : null;

      return {
        route: next,
        productId: typeof idOrParams === 'string' ? idOrParams : null,
        queryParams: query ?? {},
        origin,
        pendingScrollRestore: null,
      };
    });
    // Scroll reset happens in a useLayoutEffect keyed to the actual rendered
    // route (see App.tsx), not here. Firing window.scrollTo() at this point
    // scrolls whatever DOM currently exists — still the page we're leaving,
    // since React hasn't committed the new route yet — and hoping that
    // sticks is exactly the kind of timing-fragile pattern that breaks
    // differently across browser engines (this was tried and didn't hold on
    // real mobile Safari).
  };

  const updateQuery = (params: Record<string, string>) => {
    const path = window.location.pathname;
    const search = Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : '';
    window.history.replaceState({}, '', path + search);
    setState((prev) => ({ ...prev, queryParams: params }));
  };

  const goBack = (
    fallbackRoute: Route,
    fallbackIdOrParams?: string | Record<string, string>
  ) => {
    if (state.origin) {
      const { route, queryParams, scrollY } = state.origin;
      window.history.pushState({}, '', buildPath(route, queryParams));
      setState({
        route,
        productId: null,
        queryParams,
        origin: null,
        pendingScrollRestore: scrollY,
      });
    } else {
      navigate(fallbackRoute, fallbackIdOrParams);
    }
  };

  const clearScrollRestore = () => {
    setState((prev) => (prev.pendingScrollRestore == null ? prev : { ...prev, pendingScrollRestore: null }));
  };

  return (
    <RouterContext.Provider
      value={{
        route: state.route,
        productId: state.productId,
        queryParams: state.queryParams,
        navigate,
        updateQuery,
        goBack,
        pendingScrollRestore: state.pendingScrollRestore,
        clearScrollRestore,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
