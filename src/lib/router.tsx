import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Lang } from '@/lib/i18n';

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
  // Content language, derived from a leading /en path segment — the single
  // source of truth for language on public routes (see src/lib/i18n.tsx,
  // which reads this instead of localStorage now). Always 'bg' on /admin,
  // which has no /en equivalent and keeps its own separate UI-language
  // toggle untouched.
  lang: Lang;
  navigate: (route: Route, idOrParams?: string | Record<string, string>, params?: Record<string, string>) => void;
  // Rebuilds the *current* route (same page, same params/productId) under
  // the other language's URL prefix and navigates there — what the header's
  // language toggle needs ("this page, other language"), not a plain
  // navigate() to some fixed route.
  switchLanguage: (next: Lang) => void;
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

// Parse a real path like "/products?category=2" or "/product-detail/123",
// optionally prefixed with /en for the English version of the same page
// (/en/products?category=2, /en/product-detail/123). Real (non-hash) paths
// so crawlers and Cloudflare Pages Functions can see which page is being
// requested — a hash fragment never reaches the server, which made
// per-product OpenGraph previews impossible under the old hash-routing
// scheme.
function parseLocation(): {
  route: Route;
  productId: string | null;
  queryParams: Record<string, string>;
  lang: Lang;
} {
  const rawPath = window.location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');

  let lang: Lang = 'bg';
  let pathPart = rawPath;
  if (pathPart === 'en' || pathPart.startsWith('en/')) {
    lang = 'en';
    pathPart = pathPart.slice(2).replace(/^\/+/, '');
  }

  const queryParams: Record<string, string> = {};
  new URLSearchParams(window.location.search).forEach((value, key) => {
    queryParams[key] = value;
  });

  if (pathPart.startsWith('product-detail/')) {
    return { route: 'product-detail', productId: pathPart.split('/')[1] ?? null, queryParams, lang };
  }
  const r = validRoutes.includes(pathPart as Route) ? (pathPart as Route) : 'home';
  // /admin has no /en equivalent — never let a stray /en/admin visit report
  // an English content language, since the admin UI has its own unrelated
  // BG/EN toggle that must keep working exactly as it does today.
  return { route: r, productId: null, queryParams, lang: r === 'admin' ? 'bg' : lang };
}

type State = {
  route: Route;
  productId: string | null;
  queryParams: Record<string, string>;
  lang: Lang;
  origin: Origin | null;
  pendingScrollRestore: number | null;
};

function buildPath(route: Route, params: Record<string, string> | null | undefined, lang: Lang): string {
  const prefix = lang === 'en' ? '/en' : '';
  let path = route === 'home' ? prefix || '/' : `${prefix}/${route}`;
  if (params && Object.keys(params).length > 0) {
    path += `?${new URLSearchParams(params).toString()}`;
  }
  return path;
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(() =>
    typeof window !== 'undefined'
      ? { ...parseLocation(), origin: null, pendingScrollRestore: null }
      : { route: 'home', productId: null, queryParams: {}, lang: 'bg', origin: null, pendingScrollRestore: null }
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
    // In-app navigation stays within whatever language the user is
    // currently browsing in — only switchLanguage() below changes it.
    const prefix = state.lang === 'en' ? '/en' : '';
    let path = '';

    if (next === 'product-detail' && typeof idOrParams === 'string') {
      path = `${prefix}/product-detail/${idOrParams}`;
    } else {
      path = next === 'home' ? prefix || '/' : `${prefix}/${next}`;
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
        ...prev,
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
      // The origin was captured from the current session, so it's always in
      // whatever language the user is browsing in right now.
      window.history.pushState({}, '', buildPath(route, queryParams, state.lang));
      setState((prev) => ({
        ...prev,
        route,
        productId: null,
        queryParams,
        origin: null,
        pendingScrollRestore: scrollY,
      }));
    } else {
      navigate(fallbackRoute, fallbackIdOrParams);
    }
  };

  const clearScrollRestore = () => {
    setState((prev) => (prev.pendingScrollRestore == null ? prev : { ...prev, pendingScrollRestore: null }));
  };

  const switchLanguage = (next: Lang) => {
    // /admin has no /en equivalent — the toggle is never rendered there
    // (see Header.tsx), but guard anyway rather than ever producing a stray
    // /en/admin URL.
    if (state.route === 'admin') return;

    const prefix = next === 'en' ? '/en' : '';
    const basePath =
      state.route === 'product-detail' && state.productId
        ? `${prefix}/product-detail/${state.productId}`
        : buildPath(state.route, null, next);
    const query =
      Object.keys(state.queryParams).length > 0
        ? `?${new URLSearchParams(state.queryParams).toString()}`
        : '';

    window.history.pushState({}, '', basePath + query);
    setState((prev) => ({ ...prev, lang: next, origin: null, pendingScrollRestore: null }));
  };

  return (
    <RouterContext.Provider
      value={{
        route: state.route,
        productId: state.productId,
        queryParams: state.queryParams,
        lang: state.lang,
        navigate,
        switchLanguage,
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
