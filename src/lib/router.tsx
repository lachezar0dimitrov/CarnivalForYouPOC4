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

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() =>
    typeof window !== 'undefined'
      ? parseLocation()
      : { route: 'home' as Route, productId: null, queryParams: {} }
  );

  useEffect(() => {
    const onPopState = () => setState(parseLocation());
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
    setState({
      route: next,
      productId: typeof idOrParams === 'string' ? idOrParams : null,
      queryParams: query ?? {},
    });
    // Scroll reset happens in a useLayoutEffect keyed to the actual rendered
    // route (see App.tsx), not here. Firing window.scrollTo() at this point
    // scrolls whatever DOM currently exists — still the page we're leaving,
    // since React hasn't committed the new route yet — and hoping that
    // sticks is exactly the kind of timing-fragile pattern that breaks
    // differently across browser engines (this was tried and didn't hold on
    // real mobile Safari).
  };

  return (
    <RouterContext.Provider
      value={{ route: state.route, productId: state.productId, queryParams: state.queryParams, navigate }}
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
