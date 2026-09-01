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

type RouterContextType = {
  route: Route;
  productId: string | null;
  queryParams: Record<string, string>;
  navigate: (route: Route, idOrParams?: string | Record<string, string>, params?: Record<string, string>) => void;
  // True once at least one in-app navigation has happened, i.e. there is a
  // page in *our* history (not the outside site the user arrived from) that
  // window.history.back() would land on.
  canGoBack: boolean;
  // Returns to the page the user actually came from (via browser history)
  // when one exists; otherwise falls back to an explicit route/params, for
  // entry points with no in-app history (a direct link, a page refresh).
  goBack: (fallbackRoute: Route, fallbackIdOrParams?: string | Record<string, string>) => void;
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

// Depth of in-app navigation, persisted on each history entry's state so it
// survives back/forward. The entry the user landed on from outside the app
// (a fresh load, a shared link) has no depth of ours, hence 0 — that's what
// tells goBack() there's nothing of ours left to pop to.
function readDepth(historyState: unknown): number {
  const depth = (historyState as { depth?: number } | null)?.depth;
  return typeof depth === 'number' ? depth : 0;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() => {
    if (typeof window === 'undefined') {
      return { route: 'home' as Route, productId: null, queryParams: {}, depth: 0 };
    }
    if (window.history.state == null) {
      // Stamp the entry page too, so a same-page reload after some in-app
      // navigation doesn't lose its place in the depth count.
      window.history.replaceState({ depth: 0 }, '', window.location.href);
    }
    return { ...parseLocation(), depth: readDepth(window.history.state) };
  });

  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      setState({ ...parseLocation(), depth: readDepth(e.state) });
    };
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

    const depth = state.depth + 1;
    window.history.pushState({ depth }, '', path);
    setState({
      route: next,
      productId: typeof idOrParams === 'string' ? idOrParams : null,
      queryParams: query ?? {},
      depth,
    });
    // Scroll reset happens in a useLayoutEffect keyed to the actual rendered
    // route (see App.tsx), not here. Firing window.scrollTo() at this point
    // scrolls whatever DOM currently exists — still the page we're leaving,
    // since React hasn't committed the new route yet — and hoping that
    // sticks is exactly the kind of timing-fragile pattern that breaks
    // differently across browser engines (this was tried and didn't hold on
    // real mobile Safari).
  };

  const goBack = (
    fallbackRoute: Route,
    fallbackIdOrParams?: string | Record<string, string>
  ) => {
    if (state.depth > 0) {
      window.history.back();
    } else {
      navigate(fallbackRoute, fallbackIdOrParams);
    }
  };

  return (
    <RouterContext.Provider
      value={{
        route: state.route,
        productId: state.productId,
        queryParams: state.queryParams,
        navigate,
        canGoBack: state.depth > 0,
        goBack,
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
