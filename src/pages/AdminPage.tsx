import { useEffect, useState, type ReactNode } from 'react';
import {
  LogOut,
  ArrowLeft,
  Image as ImageIcon,
  Package,
  Search,
  Plus,
  Edit3,
  Trash2,
  X,
  Check,
  AlertCircle,
  Loader2,
  Upload,
  Phone,
  Tag,
} from 'lucide-react';
import { useRouter } from '@/lib/router';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';
import {
  fetchAllBanners,
  saveBanner,
  deleteBanner,
  type Banner,
} from '@/lib/banners';
import { categoryMeta, type Product } from '@/lib/products';
import { type ImageBucket } from '@/lib/storage';
import {
  fetchAllCategoriesAdmin,
  saveCategory,
  deleteCategory,
  type Category,
} from '@/lib/categories';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';

type Tab = 'banners' | 'products' | 'contacts' | 'categories';

export default function AdminPage() {
  const { navigate } = useRouter();
  const { lang } = useI18n();
  const { isAdmin, loading: authLoading, signIn, signOut } = useAuth();
  const [tab, setTab] = useState<Tab>('banners');

  const handleSignOut = async () => {
    await signOut();
    navigate('home');
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={32} className="animate-spin text-gold-300" />
      </div>
    );
  }

  if (!isAdmin) {
    return <LoginForm onSignIn={signIn} />;
  }

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gold-100">
            {lang === 'bg' ? 'Админ панел' : 'Admin Panel'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('home')}
            className="flex items-center gap-2 rounded-lg border border-gold-400/25 px-4 py-2.5 text-sm text-gold-200 transition hover:bg-gold-400/10"
          >
            <ArrowLeft size={16} />
            {lang === 'bg' ? 'Към сайта' : 'Back to site'}
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg border border-gold-400/25 px-4 py-2.5 text-sm text-gold-200 transition hover:bg-gold-400/10"
          >
            <LogOut size={16} />
            {lang === 'bg' ? 'Изход' : 'Sign out'}
          </button>
        </div>
      </div>

      <div className="mb-8 flex gap-2 border-b border-gold-400/15">
        <TabButton active={tab === 'banners'} onClick={() => setTab('banners')} icon={ImageIcon}>
          {lang === 'bg' ? 'Банери' : 'Banners'}
        </TabButton>
        <TabButton active={tab === 'products'} onClick={() => setTab('products')} icon={Package}>
          {lang === 'bg' ? 'Продукти' : 'Products'}
        </TabButton>
        <TabButton active={tab === 'categories'} onClick={() => setTab('categories')} icon={Tag}>
          {lang === 'bg' ? 'Категории' : 'Categories'}
        </TabButton>
        <TabButton active={tab === 'contacts'} onClick={() => setTab('contacts')} icon={Phone}>
          {lang === 'bg' ? 'Контакти' : 'Contacts'}
        </TabButton>
      </div>

      {tab === 'banners' && <BannerManager />}
      {tab === 'products' && <ProductManager />}
      {tab === 'categories' && <CategoryManager />}
      {tab === 'contacts' && <ContactsManager />}
    </div>
  );

  function TabButton({
    active,
    onClick,
    icon: Icon,
    children,
  }: {
    active: boolean;
    onClick: () => void;
    icon: typeof ImageIcon;
    children: ReactNode;
  }) {
    return (
      <button
        onClick={onClick}
        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
          active
            ? 'border-gold-400 text-gold-100'
            : 'border-transparent text-gray-400 hover:text-gold-200'
        }`}
      >
        <Icon size={16} />
        {children}
      </button>
    );
  }
}

// ============================================================
// LOGIN FORM
// ============================================================
function LoginForm({ onSignIn }: { onSignIn: (u: string, p: string) => Promise<{ error: string | null }> }) {
  const { lang } = useI18n();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: signInError } = await onSignIn(username, password);
    if (signInError) {
      setError(signInError);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gold-400/20 bg-[#0f1110] p-8">
        <h1 className="mb-1 text-center font-display text-2xl font-bold text-gold-100">
          {lang === 'bg' ? 'Вход в админ' : 'Admin Login'}
        </h1>
        <p className="mb-6 text-center text-sm text-gray-400">
          {lang === 'bg' ? 'Въведете вашите данни' : 'Enter your credentials'}
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={lang === 'bg' ? 'Потребител' : 'Username'}
            className="form-input"
            required
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={lang === 'bg' ? 'Парола' : 'Password'}
            className="form-input"
            required
          />
          {error && <ErrorBox>{error}</ErrorBox>}
          <button
            type="submit"
            disabled={loading}
            className="btn-gold flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : null}
            {lang === 'bg' ? 'Вход' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// IMAGE UPLOAD BUTTON
// ============================================================
function ImageUploadButton({
  bucket,
  onUploaded,
  label,
}: {
  bucket: ImageBucket;
  onUploaded: (url: string) => void;
  label: string;
}) {
  const { lang } = useI18n();
  const { notify } = useToast();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(bucket, file);
      onUploaded(url);
      notify('success', lang === 'bg' ? 'Снимката е качена.' : 'Image uploaded.');
    } catch {
      setError('Грешка при качване / Upload failed');
      notify('error', lang === 'bg' ? 'Грешка при качване.' : 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-gold-400/25 bg-gold-400/5 px-4 py-2.5 text-sm text-gold-200 transition hover:bg-gold-400/10">
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {uploading ? 'Качване…' : label}
        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
          disabled={uploading}
        />
      </label>
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}

// ============================================================
// BANNER MANAGER
// ============================================================
function BannerManager() {
  const { lang } = useI18n();
  const { notify } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    fetchAllBanners()
      .then(setBanners)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'bg' ? 'Изтрий този банер?' : 'Delete this banner?')) return;
    try {
      await deleteBanner(id);
      notify('success', lang === 'bg' ? 'Банерът е изтрит.' : 'Banner deleted.');
      load();
    } catch {
      notify('error', lang === 'bg' ? 'Грешка при изтриване.' : 'Error deleting.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gold-300" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-400">
          {banners.length} {lang === 'bg' ? 'банера' : 'banners'}
        </p>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-gold flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
        >
          <Plus size={16} />
          {lang === 'bg' ? 'Нов банер' : 'New banner'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((b) => (
          <div key={b.id} className="glass overflow-hidden rounded-xl border border-gold-400/15">
            <div className="relative aspect-video">
              <AdminImage src={b.imageUrl} alt="" className="h-full w-full object-cover" />
              <span
                className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                  b.isActive ? 'bg-moss-500/80 text-white' : 'bg-ink-900/80 text-gray-400'
                }`}
              >
                {b.isActive ? (lang === 'bg' ? 'Активен' : 'Active') : (lang === 'bg' ? 'Изкл.' : 'Off')}
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-100">
                {lang === 'bg' ? b.titleBg : b.titleEn}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {lang === 'bg' ? b.subtitleBg : b.subtitleEn}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { setEditing(b); setShowForm(true); }}
                  className="flex items-center gap-1 rounded-lg border border-gold-400/25 px-3 py-1.5 text-xs text-gold-200 transition hover:bg-gold-400/10"
                >
                  <Edit3 size={14} />
                  {lang === 'bg' ? 'Редактирай' : 'Edit'}
                </button>
                <button
                  onClick={() => handleDelete(b.id)}
                  className="flex items-center gap-1 rounded-lg border border-error/25 px-3 py-1.5 text-xs text-error transition hover:bg-error/10"
                >
                  <Trash2 size={14} />
                  {lang === 'bg' ? 'Изтрий' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <BannerForm
          banner={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function BannerForm({
  banner,
  onClose,
  onSaved,
}: {
  banner: Banner | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang } = useI18n();
  const { notify } = useToast();
  const [form, setForm] = useState({
    imageUrl: banner?.imageUrl ?? '',
    titleBg: banner?.titleBg ?? '',
    titleEn: banner?.titleEn ?? '',
    subtitleBg: banner?.subtitleBg ?? '',
    subtitleEn: banner?.subtitleEn ?? '',
    linkUrl: banner?.linkUrl ?? 'products',
    isActive: banner?.isActive ?? true,
    sortOrder: banner?.sortOrder ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveBanner({ ...form, id: banner?.id });
      notify('success', lang === 'bg' ? 'Банерът е запазен.' : 'Banner saved.');
      onSaved();
    } catch {
      setError(lang === 'bg' ? 'Грешка при запазване.' : 'Error saving.');
      notify('error', lang === 'bg' ? 'Грешка при запазване.' : 'Error saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={banner ? (lang === 'bg' ? 'Редакция банер' : 'Edit banner') : (lang === 'bg' ? 'Нов банер' : 'New banner')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <FormField label={lang === 'bg' ? 'Снимка' : 'Image'}>
          <div className="flex flex-col gap-2">
            <ImageUploadButton
              bucket="banner-images"
              onUploaded={(url) => setForm({ ...form, imageUrl: url })}
              label={lang === 'bg' ? 'Качи снимка от файла' : 'Upload from file'}
            />
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="form-input"
              placeholder="https://... или качете файл"
            />
          </div>
        </FormField>

        <AdminImage
          src={form.imageUrl}
          alt=""
          className="w-full max-h-[300px] rounded-xl border border-gold-400/15 object-cover"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={lang === 'bg' ? 'Заглавие (БГ)' : 'Title (BG)'}>
            <input type="text" value={form.titleBg} onChange={(e) => setForm({ ...form, titleBg: e.target.value })} className="form-input" />
          </FormField>
          <FormField label={lang === 'bg' ? 'Заглавие (EN)' : 'Title (EN)'}>
            <input type="text" value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} className="form-input" />
          </FormField>
          <FormField label={lang === 'bg' ? 'Подзаглавие (БГ)' : 'Subtitle (BG)'}>
            <input type="text" value={form.subtitleBg} onChange={(e) => setForm({ ...form, subtitleBg: e.target.value })} className="form-input" />
          </FormField>
          <FormField label={lang === 'bg' ? 'Подзаглавие (EN)' : 'Subtitle (EN)'}>
            <input type="text" value={form.subtitleEn} onChange={(e) => setForm({ ...form, subtitleEn: e.target.value })} className="form-input" />
          </FormField>
        </div>

        <FormField label={lang === 'bg' ? 'Линк' : 'Link'}>
          <input type="text" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className="form-input" />
        </FormField>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-gold-400/30 bg-ink-700" />
            {lang === 'bg' ? 'Активен' : 'Active'}
          </label>
          <FormField label={lang === 'bg' ? 'Ред' : 'Sort order'} inline>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="form-input w-24" />
          </FormField>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <FormActions saving={saving} onCancel={onClose} label={lang === 'bg' ? 'Запази' : 'Save'} />
      </form>
    </Modal>
  );
}

// ============================================================
// PRODUCT MANAGER & FORM (С поддръжка на categoryIds)
// ============================================================
type AdminProduct = Product & { isActive: boolean; categoryIds: number[] };

function mapAdminRow(r: any): AdminProduct {
  let categoryIds = r.category_ids ?? [];
  if (categoryIds.length === 0 && r.category_id != null) {
    categoryIds = [r.category_id];
  }

  const rawPrice = Number(r.price) || 0;
  const rawOldPrice = r.old_price != null ? Number(r.old_price) || null : null;

  return {
    id: r.id,
    oldId: r.old_id ?? null,
    categoryId: r.category_id ?? categoryIds[0] ?? 2,
    categoryIds,
    nameBg: r.name_bg ?? '',
    nameEn: r.name_en ?? '',
    descriptionBg: r.description_bg ?? '',
    descriptionEn: r.description_en ?? '',
    sizes: r.sizes ?? '',
    price: rawPrice,
    rawPrice,
    oldPrice: rawOldPrice,
    rawOldPrice,
    imageUrl: r.image_url ?? '',
    priority: r.priority ?? 0,
    tags: r.tags ?? [],
    isActive: r.is_active ?? true,
  };
}

function checkImageOk(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!url || !/^https?:\/\//.test(url)) {
      resolve(false);
      return;
    }
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
    setTimeout(() => resolve(false), 8000);
  });
}

function useBrokenImages(products: AdminProduct[]) {
  const [broken, setBroken] = useState<Set<number>>(new Set());
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const candidates = products.filter(
      (p) => p.imageUrl && /^https?:\/\//.test(p.imageUrl)
    );
    if (candidates.length === 0) {
      setBroken(new Set());
      return;
    }
    setChecking(true);
    Promise.all(
      candidates.map(async (p) => {
        const ok = await checkImageOk(p.imageUrl!);
        return { id: p.id, ok };
      })
    ).then((results) => {
      if (cancelled) return;
      const bad = new Set<number>();
      results.forEach((r) => {
        if (!r.ok) bad.add(r.id);
      });
      products.forEach((p) => {
        if (!p.imageUrl || !/^https?:\/\//.test(p.imageUrl)) bad.add(p.id);
      });
      setBroken(bad);
      setChecking(false);
    });
    return () => { cancelled = true; };
  }, [products]);

  return { broken, checking };
}

function ProductManager() {
  const { lang } = useI18n();
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const pageSize = 20;
  const { broken, checking } = useBrokenImages(products);
  const brokenProducts = products.filter((p) => broken.has(p.id));

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(0); }, [debouncedSearch]);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    const term = debouncedSearch.trim();
    const filter = term ? `name_bg.ilike.%${term}%,name_en.ilike.%${term}%` : undefined;

    const countQuery = supabase.from('products').select('*', { count: 'exact', head: true });
    if (filter) countQuery.or(filter);
    countQuery.then(({ count }) => { if (!cancelled) setTotal(count ?? 0); });

    const query = supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (filter) query.or(filter);

    query.then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setLoading(false); return; }
      setProducts((data ?? []).map((r) => mapAdminRow(r)));
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [debouncedSearch, page, reloadKey]);

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'bg' ? 'Сигурни ли сте?' : 'Are you sure?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      notify('success', lang === 'bg' ? 'Продуктът е изтрит.' : 'Product deleted.');
      setReloadKey((k) => k + 1);
    } catch {
      notify('error', lang === 'bg' ? 'Грешка при изтриване.' : 'Error deleting.');
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-300/60" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'bg' ? 'Търси продукт…' : 'Search product…'}
            className="w-full rounded-lg border border-gold-400/20 bg-ink-700 py-2.5 pl-10 pr-4 text-sm text-gray-200 transition placeholder:text-gray-500 focus:border-gold-400/60 focus:outline-none"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-gold flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
        >
          <Plus size={16} />
          {lang === 'bg' ? 'Нов продукт' : 'New product'}
        </button>
      </div>

      <p className="mb-4 text-sm text-gray-500">
        {total} {lang === 'bg' ? 'продукта' : 'products'}
      </p>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gold-300" />
        </div>
      ) : (
        <>
          {brokenProducts.length > 0 && (
            <div className="mb-4 rounded-xl border border-warning/30 bg-warning/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-warning">
                <AlertCircle size={18} />
                {checking
                  ? (lang === 'bg' ? 'Проверка на снимките…' : 'Checking images…')
                  : (lang === 'bg'
                      ? `${brokenProducts.length} продукта с липсваща/невалидна снимка`
                      : `${brokenProducts.length} products with missing/invalid image`)}
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-gold-400/15">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-ink-800/95 text-gray-400 backdrop-blur">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Снимка' : 'Image'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Име' : 'Name'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Категории' : 'Categories'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Цена' : 'Price'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Активен' : 'Active'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const catNames = p.categoryIds
                    ?.map((id) => categoryMeta.find((c) => c.id === id))
                    .filter(Boolean)
                    .map((cat) => (lang === 'bg' ? cat?.nameBg : cat?.nameEn))
                    .join(', ');

                  return (
                    <tr key={p.id} className="border-t border-gold-400/10 transition hover:bg-gold-400/5">
                      <td className="px-4 py-4 text-gray-500">{p.id}</td>
                      <td className="px-4 py-4">
                        <div className="relative">
                          <AdminImage src={p.imageUrl} alt="" className="h-[100px] w-[100px] rounded-lg object-cover border border-gold-400/10" />
                          {broken.has(p.id) && (
                            <span
                              className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-ink-800 bg-warning text-ink-900"
                              title={lang === 'bg' ? 'Липсваща снимка' : 'Missing image'}
                            >
                              <AlertCircle size={12} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-200">
                        {lang === 'bg' ? p.nameBg : p.nameEn}
                        {p.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="rounded bg-gold-400/10 px-1.5 py-0.5 text-xs text-gold-300/80">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-400">
                        {catNames || '—'}
                      </td>
                      <td className="px-4 py-4 text-gold-200">{p.price.toFixed(2)} €</td>
                      <td className="px-4 py-4">
                        {p.isActive ? <Check size={18} className="text-moss-400" /> : <X size={18} className="text-gray-600" />}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditing(p); setShowForm(true); }} className="rounded-lg p-2 text-gold-200 transition hover:bg-gold-400/10" aria-label="Edit">
                            <Edit3 size={18} />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="rounded-lg p-2 text-error transition hover:bg-error/10" aria-label="Delete">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-lg border border-gold-400/25 px-3 py-2 text-sm text-gold-200 disabled:opacity-30"
              >
                {lang === 'bg' ? 'Предишна' : 'Prev'}
              </button>
              <span className="text-sm text-gray-400">{page + 1} / {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="rounded-lg border border-gold-400/25 px-3 py-2 text-sm text-gold-200 disabled:opacity-30"
              >
                {lang === 'bg' ? 'Следваща' : 'Next'}
              </button>
            </div>
          )}
        </>
      )}

      {showForm && (
        <ProductForm
          product={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); setReloadKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}

function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang } = useI18n();
  const { notify } = useToast();
  const [form, setForm] = useState({
    name_bg: product?.nameBg ?? '',
    name_en: product?.nameEn ?? '',
    description_bg: product?.descriptionBg ?? '',
    description_en: product?.descriptionEn ?? '',
    category_ids: product?.categoryIds?.length ? product.categoryIds : (product?.categoryId ? [product.categoryId] : [2]),
    price: product?.rawPrice ?? 0,
    old_price: product?.rawOldPrice ?? null,
    image_url: product?.imageUrl ?? '',
    sizes: product?.sizes ?? '',
    is_active: product?.isActive ?? true,
    priority: product?.priority ?? 0,
    old_id: product?.oldId ?? null,
    tags: product?.tags?.join(', ') ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (catId: number) => {
    setForm((prev) => {
      const exists = prev.category_ids.includes(catId);
      const updated = exists
        ? prev.category_ids.filter((id) => id !== catId)
        : [...prev.category_ids, catId];
      return { ...prev, category_ids: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const tagsArray = form.tags.split(',').map((t) => t.trim()).filter(Boolean);

    const payload = {
      name_bg: form.name_bg || null,
      name_en: form.name_en || null,
      description_bg: form.description_bg || null,
      description_en: form.description_en || null,
      category_id: form.category_ids[0] ?? 2, // Основна категория за съвместимост
      category_ids: form.category_ids,         // Масив от избрани категории
      price: Number(form.price),
      old_price: form.old_price ? Number(form.old_price) : null,
      image_url: form.image_url || null,
      sizes: form.sizes || null,
      is_active: form.is_active,
      priority: Number(form.priority),
      old_id: form.old_id ? Number(form.old_id) : null,
      tags: tagsArray,
    };

    try {
      if (product) {
        const { error: err } = await supabase.from('products').update(payload).eq('id', product.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('products').insert(payload);
        if (err) throw err;
      }
      notify('success', lang === 'bg' ? 'Продуктът е запазен.' : 'Product saved.');
      onSaved();
    } catch {
      setError(lang === 'bg' ? 'Грешка при запазване.' : 'Error saving.');
      notify('error', lang === 'bg' ? 'Грешка при запазване.' : 'Error saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={product ? (lang === 'bg' ? 'Редакция продукт' : 'Edit product') : (lang === 'bg' ? 'Нов продукт' : 'New product')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={lang === 'bg' ? 'Име (БГ)' : 'Name (BG)'}>
            <input type="text" value={form.name_bg} onChange={(e) => setForm({ ...form, name_bg: e.target.value })} className="form-input" />
          </FormField>
          <FormField label={lang === 'bg' ? 'Име (EN)' : 'Name (EN)'}>
            <input type="text" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} className="form-input" />
          </FormField>
        </div>

        {/* Избор на категории чрез чекбоксове */}
        <FormField label={lang === 'bg' ? 'Категории (изберете една или повече)' : 'Categories (select one or more)'}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-48 overflow-y-auto p-3 rounded-lg border border-gold-400/20 bg-ink-900">
            {categoryMeta.map((cat) => {
              const checked = form.category_ids.includes(cat.id);
              return (
                <label key={cat.id} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer p-1 hover:bg-gold-400/5 rounded">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCategory(cat.id)}
                    className="h-4 w-4 rounded border-gold-400/30 bg-ink-700 text-gold-400"
                  />
                  <span>{lang === 'bg' ? cat.nameBg : cat.nameEn}</span>
                </label>
              );
            })}
          </div>
        </FormField>

        {/* Останалата част от формата остава непроменена */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={lang === 'bg' ? 'Цена (€)' : 'Price (€)'}>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="form-input" required />
          </FormField>
          <FormField label={lang === 'bg' ? 'Стара цена (€)' : 'Old price (€)'}>
            <input type="number" step="0.01" value={form.old_price ?? ''} onChange={(e) => setForm({ ...form, old_price: e.target.value ? Number(e.target.value) : null })} className="form-input" />
          </FormField>
        </div>

        <FormField label={lang === 'bg' ? 'Снимка' : 'Image'}>
          <div className="flex flex-col gap-2">
            <ImageUploadButton
              bucket="product-images"
              onUploaded={(url) => setForm({ ...form, image_url: url })}
              label={lang === 'bg' ? 'Качи снимка от файла' : 'Upload from file'}
            />
            <input
              type="text"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              className="form-input"
              placeholder="https://..."
            />
          </div>
        </FormField>

        <AdminImage
          src={form.image_url}
          alt=""
          className="w-32 h-32 rounded-xl border border-gold-400/15 object-cover"
        />

        <FormField label={lang === 'bg' ? 'Размери' : 'Sizes'}>
          <input type="text" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className="form-input" placeholder="S, M, L, XL" />
        </FormField>

        <FormField label={lang === 'bg' ? 'Тагове (разделени със запетая)' : 'Tags (comma separated)'}>
          <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="form-input" placeholder="нов, промоция" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label={lang === 'bg' ? 'Приоритет' : 'Priority'}>
            <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="form-input" />
          </FormField>
          <div className="flex items-center pt-6">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded border-gold-400/30 bg-ink-700" />
              {lang === 'bg' ? 'Активен продукт' : 'Active product'}
            </label>
          </div>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <FormActions saving={saving} onCancel={onClose} label={lang === 'bg' ? 'Запази' : 'Save'} />
      </form>
    </Modal>
  );
}