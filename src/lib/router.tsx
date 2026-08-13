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

// Parse hash like "#/products?category=2" or "#/product-detail/123"
function parseHash(): { route: Route; productId: string | null; queryParams: Record<string, string> } {
  const raw = window.location.hash.replace('#/', '').replace('#', '');
  const [pathPart, queryPart] = raw.split('?');

  const queryParams: Record<string, string> = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((value, key) => {
      queryParams[key] = value;
    });
  }

  if (pathPart.startsWith('product-detail/')) {
    return { route: 'product-detail', productId: pathPart.split('/')[1] ?? null, queryParams };
  }
  const r = validRoutes.includes(pathPart as Route) ? (pathPart as Route) : 'home';
  return { route: r, productId: null, queryParams };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(() =>
    typeof window !== 'undefined'
      ? parseHash()
      : { route: 'home' as Route, productId: null, queryParams: {} }
  );

  useEffect(() => {
    const onHashChange = () => setState(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (
    next: Route,
    idOrParams?: string | Record<string, string>,
    params?: Record<string, string>
  ) => {
    let hash = '';

    if (next === 'product-detail' && typeof idOrParams === 'string') {
      hash = `/product-detail/${idOrParams}`;
    } else {
      hash = `/${next}`;
    }

    const query = params ?? (idOrParams && typeof idOrParams === 'object' ? idOrParams : null);
    if (query && Object.keys(query).length > 0) {
      const searchParams = new URLSearchParams(query);
      hash += `?${searchParams.toString()}`;
    }

    window.location.hash = hash;
    setState({
      route: next,
      productId: typeof idOrParams === 'string' ? idOrParams : null,
      queryParams: query ?? {},
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
