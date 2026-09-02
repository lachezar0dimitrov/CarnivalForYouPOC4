import { Fragment, useEffect, useState, type ReactNode } from 'react';
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
  Save,
  Upload,
  Phone,
  Mail,
  MapPin,
  Clock,
  Tag,
  Palette,
  SlidersHorizontal,
  ChevronDown,
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
import { bgnToEur, eurToBgn, type Product } from '@/lib/products';
import { uploadImage, type ImageBucket } from '@/lib/r2';
import {
  fetchSiteSettings,
  saveSiteSettings,
  type SiteSettings,
} from '@/lib/siteSettings';
import { setThemeOverrideCache, type ThemeOverride } from '@/lib/season';
import {
  fetchAllCategoriesAdmin,
  saveCategory,
  deleteCategory,
  type Category,
} from '@/lib/categories';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/components/Toast';
import carouselImages from 'virtual:carousel-images';

type Tab = 'banners' | 'products' | 'contacts' | 'categories' | 'theme';

const NO_IMAGE = '/no-image.svg';

function AdminImage({
  src,
  alt = '',
  className,
}: {
  src: string | null | undefined;
  alt?: string;
  className: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = src && !failed ? src : NO_IMAGE;
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      loading="lazy"
    />
  );
}

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
    <div className="mx-auto min-h-screen max-w-[1900px] px-4 pb-20 pt-8 sm:px-6 sm:pt-10">
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

      <div className="mb-8 flex gap-2 border-b border-gold-400/15 overflow-x-auto">
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
        <TabButton active={tab === 'theme'} onClick={() => setTab('theme')} icon={Palette}>
          {lang === 'bg' ? 'Тема' : 'Theme'}
        </TabButton>
      </div>

      {tab === 'banners' && <BannerManager />}
      {tab === 'products' && <ProductManager />}
      {tab === 'categories' && <CategoryManager />}
      {tab === 'contacts' && <ContactsManager />}
      {tab === 'theme' && <ThemeManager />}
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
        className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition whitespace-nowrap ${
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
  onUploaded: (url: string, mobileUrl?: string) => void;
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
      const { url, mobileUrl } = await uploadImage(bucket, file);
      onUploaded(url, mobileUrl);
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

// Lets the admin pick one of the source photos already sitting in
// public/images/carousel/ (see vite.config.ts's carouselImagesPlugin)
// instead of only uploading a new file. The picked file still goes through
// the normal upload pipeline (fetched client-side, then re-posted to
// r2-media) so it ends up on R2 with an auto-generated mobile crop, exactly
// like a manual upload — no separate, degraded code path.
function CarouselPicker({
  onUploaded,
}: {
  onUploaded: (url: string, mobileUrl?: string) => void;
}) {
  const { lang } = useI18n();
  const { notify } = useToast();
  const [open, setOpen] = useState(false);
  const [busyPath, setBusyPath] = useState<string | null>(null);

  if (carouselImages.length === 0) return null;

  const handlePick = async (path: string) => {
    setBusyPath(path);
    try {
      const res = await fetch(path);
      const blob = await res.blob();
      const filename = path.split('/').pop() || 'image.jpg';
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      const { url, mobileUrl } = await uploadImage('banner-images', file);
      onUploaded(url, mobileUrl);
      notify('success', lang === 'bg' ? 'Снимката е избрана.' : 'Image selected.');
      setOpen(false);
    } catch {
      notify('error', lang === 'bg' ? 'Грешка при избора.' : 'Failed to select image.');
    } finally {
      setBusyPath(null);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-gold-400/25 px-4 py-2.5 text-sm text-gold-200 transition hover:bg-gold-400/10"
      >
        <ImageIcon size={16} />
        {lang === 'bg' ? 'Избери от карусела' : 'Choose from carousel'}
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg border border-gold-400/15 bg-ink-800 p-2 sm:grid-cols-4">
          {carouselImages.map((path) => (
            <button
              key={path}
              type="button"
              onClick={() => handlePick(path)}
              disabled={busyPath !== null}
              className="relative aspect-video overflow-hidden rounded-lg border border-gold-400/15 transition hover:border-gold-400/50 disabled:opacity-50"
            >
              <img src={path} alt="" className="h-full w-full object-cover" />
              {busyPath === path && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <Loader2 size={18} className="animate-spin text-gold-300" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
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
    mobileImageUrl: banner?.mobileImageUrl ?? '',
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
            <div className="flex flex-wrap gap-2">
              <ImageUploadButton
                bucket="banner-images"
                onUploaded={(url, mobileUrl) =>
                  setForm({ ...form, imageUrl: url, mobileImageUrl: mobileUrl ?? '' })
                }
                label={lang === 'bg' ? 'Качи снимка от файла' : 'Upload from file'}
              />
              <CarouselPicker
                onUploaded={(url, mobileUrl) =>
                  setForm({ ...form, imageUrl: url, mobileImageUrl: mobileUrl ?? '' })
                }
              />
            </div>
            <input
              type="text"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              className="form-input"
              placeholder="https://... или качете файл"
            />
            <p className="text-xs text-gray-500">
              {lang === 'bg'
                ? 'Версията за телефони се изрязва автоматично при качване.'
                : 'The mobile version is auto-cropped from this on upload.'}
              {form.mobileImageUrl && (
                <span className="ml-1 text-moss-400">
                  {lang === 'bg' ? '✓ готова' : '✓ ready'}
                </span>
              )}
            </p>
          </div>
        </FormField>

        {/* aspect-video matches the live .banner-box's 16:9 ratio on desktop
            (BannerCarousel.tsx), so this preview shows the same crop viewers
            actually get instead of an arbitrary, much-wider strip that hid
            most of the photo behind a misleadingly tight crop. */}
        <AdminImage
          src={form.imageUrl}
          alt=""
          className="aspect-video w-full rounded-xl border border-gold-400/15 object-cover"
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
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
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
  let rawCatIds = r.category_ids;
  let categoryIds: number[] = [];

  if (Array.isArray(rawCatIds)) {
    categoryIds = rawCatIds.map(Number).filter(Boolean);
  } else if (typeof rawCatIds === 'string') {
    try {
      const parsed = JSON.parse(rawCatIds);
      if (Array.isArray(parsed)) {
        categoryIds = parsed.map(Number).filter(Boolean);
      }
    } catch {
      // Ако е във формат {2,12} или друг текстов вариант
      if (rawCatIds.startsWith('{') && rawCatIds.endsWith('}')) {
        categoryIds = rawCatIds.slice(1, -1).split(',').map(Number).filter(Boolean);
      } else {
        categoryIds = [Number(rawCatIds)].filter(Boolean);
      }
    }
  } else if (rawCatIds != null) {
    categoryIds = [Number(rawCatIds)].filter(Boolean);
  }

  if (categoryIds.length === 0 && r.category_id != null) {
    categoryIds = [Number(r.category_id)].filter(Boolean);
  }

  const rawPrice = Number(r.price) || 0;
  // old_price = 0 is a legacy import placeholder meaning "never set", not a
  // real price — treated as null so the admin field shows blank instead of
  // a misleading "0", matching how the public site's own discount-badge
  // check (oldPrice > price) already treats 0 as no discount.
  const rawOldPrice = r.old_price != null && Number(r.old_price) !== 0 ? Number(r.old_price) : null;

  return {
    id: r.id,
    oldId: r.old_id ?? null,
    oldCatalogNumber: r.old_catalog_number ?? null,
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
    isNew: r.is_new ?? false,
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

// A product has exactly one primary "type" (demographic — Women/Men/Boys/…
// — or, for accessory-only items, one of the hidden Masks/Hats/Wigs/
// Accessories categories) plus any number of theme/subcategory tags
// (Halloween, Pirates, Professions, …). `group === 'main'` and `!isActive`
// together cover every primary id; every other active category is a theme.
function classifyCategories(categories: Category[]) {
  return {
    primaryCategories: categories.filter((c) => c.group === 'main' || !c.isActive),
    themeCategories: categories.filter((c) => c.group === 'other' && c.isActive),
  };
}

function categoryOrClause(ids: number[]): string {
  return ids.map((id) => `category_ids.cs.{${id}},category_id.eq.${id}`).join(',');
}

function ProductManager() {
  const { lang } = useI18n();
  const { notify } = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [filterPrimary, setFilterPrimary] = useState<number[]>([]);
  const [filterTheme, setFilterTheme] = useState<number[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dirtyIds, setDirtyIds] = useState<Set<number>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set());
  const [expandedCategoryRow, setExpandedCategoryRow] = useState<number | null>(null);
  const pageSize = 20;
  const { broken, checking } = useBrokenImages(products);
  const brokenProducts = products.filter((p) => broken.has(p.id));
  const { primaryCategories: filterPrimaryOptions, themeCategories: filterThemeOptions } =
    classifyCategories(categories);
  const primaryIdSet = new Set(filterPrimaryOptions.map((c) => c.id));
  const activeFilterCount = filterPrimary.length + filterTheme.length;

  const markDirty = (id: number) => {
    setDirtyIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const updateProductField = (id: number, patch: Partial<AdminProduct>) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    markDirty(id);
  };

  const setRowPriceEur = (id: number, eur: number) => {
    const bgn = eurToBgn(eur);
    updateProductField(id, { price: bgn, rawPrice: bgn });
  };

  const setRowPrimaryCategory = (id: number, catId: number) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const themeIds = p.categoryIds.filter((cid) => !primaryIdSet.has(cid));
      return { ...p, categoryId: catId, categoryIds: [catId, ...themeIds] };
    }));
    markDirty(id);
  };

  const toggleRowTheme = (id: number, catId: number) => {
    setProducts((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const exists = p.categoryIds.includes(catId);
      const categoryIds = exists ? p.categoryIds.filter((c) => c !== catId) : [...p.categoryIds, catId];
      return { ...p, categoryIds };
    }));
    markDirty(id);
  };

  const handleRowSave = async (p: AdminProduct) => {
    setSavingIds((prev) => new Set(prev).add(p.id));
    try {
      const payload = {
        name_bg: p.nameBg || null,
        name_en: p.nameEn || null,
        description_bg: p.descriptionBg || null,
        description_en: p.descriptionEn || null,
        category_id: p.categoryId,
        category_ids: p.categoryIds,
        price: p.price,
      };
      const { error } = await supabase.from('products').update(payload).eq('id', p.id);
      if (error) throw error;
      notify('success', lang === 'bg' ? 'Промените са запазени.' : 'Changes saved.');
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
      setExpandedCategoryRow((cur) => (cur === p.id ? null : cur));
    } catch {
      notify('error', lang === 'bg' ? 'Грешка при запазване.' : 'Error saving.');
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(p.id);
        return next;
      });
    }
  };

  const toggleFilterPrimary = (id: number) => {
    setFilterPrimary((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleFilterTheme = (id: number) => {
    setFilterTheme((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const clearCategoryFilters = () => {
    setFilterPrimary([]);
    setFilterTheme([]);
  };

  useEffect(() => {
    fetchAllCategoriesAdmin().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(0); }, [debouncedSearch, filterPrimary, filterTheme]);

  useEffect(() => {
    setLoading(true);
    let cancelled = false;
    const term = debouncedSearch.trim();
    // Admins look up products by the number printed on the old paper tag
    // ("Каталожен №"), which is old_catalog_number — a distinct, arbitrary
    // per-product number scraped from the legacy site, NOT old_id (which is
    // just that site's internal obid URL param and was the field this
    // search used to match, hence never finding anything). Matched with
    // ilike since catalog numbers can have leading zeros. old_id kept as a
    // fallback for internal reference lookups. Deliberately NOT matching the
    // new internal id here too: id and old_id are unrelated sequences, so
    // e.g. searching "100" could otherwise also surface whichever unrelated
    // product happens to have internal id 100.
    const isNumeric = /^\d+$/.test(term);
    const searchParts: string[] = [];
    if (term) {
      searchParts.push(`name_bg.ilike.%${term}%`, `name_en.ilike.%${term}%`, `old_catalog_number.ilike.%${term}%`);
      if (isNumeric) searchParts.push(`old_id.eq.${term}`);
    }
    const searchFilter = searchParts.length > 0 ? searchParts.join(',') : undefined;
    const primaryClause = filterPrimary.length > 0 ? categoryOrClause(filterPrimary) : undefined;
    const themeClause = filterTheme.length > 0 ? categoryOrClause(filterTheme) : undefined;

    const countQuery = supabase.from('products').select('*', { count: 'exact', head: true });
    if (searchFilter) countQuery.or(searchFilter);
    if (primaryClause) countQuery.or(primaryClause);
    if (themeClause) countQuery.or(themeClause);
    countQuery.then(({ count }) => { if (!cancelled) setTotal(count ?? 0); });

    const query = supabase
      .from('products')
      .select('*')
      .order('id', { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    if (searchFilter) query.or(searchFilter);
    if (primaryClause) query.or(primaryClause);
    if (themeClause) query.or(themeClause);

    query.then(({ data, error }) => {
      if (cancelled) return;
      if (error) { setLoading(false); return; }
      setProducts((data ?? []).map((r) => mapAdminRow(r)));
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [debouncedSearch, page, reloadKey, filterPrimary, filterTheme]);

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
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-xs">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-300/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={lang === 'bg' ? 'Търси продукт или стар №…' : 'Search product or old #…'}
              className="w-full rounded-lg border border-gold-400/20 bg-ink-700 py-2.5 pl-10 pr-4 text-sm text-gray-200 transition placeholder:text-gray-500 focus:border-gold-400/60 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            aria-expanded={filtersOpen}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
              filtersOpen
                ? 'btn-gold'
                : 'border border-gold-400/25 text-gold-200 hover:border-gold-400/50 hover:bg-gold-400/10'
            }`}
          >
            <SlidersHorizontal size={16} />
            {lang === 'bg' ? 'Категории' : 'Categories'}
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-ink-900/30 px-1.5 text-xs font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-gold flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
        >
          <Plus size={16} />
          {lang === 'bg' ? 'Нов продукт' : 'New product'}
        </button>
      </div>

      {filtersOpen && (
        <div className="mb-4 flex flex-col gap-4 rounded-xl border border-gold-400/20 bg-ink-900 p-4">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {lang === 'bg' ? 'Основна категория (включително скрити)' : 'Primary category (including hidden)'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearCategoryFilters}
                  className="flex items-center gap-1 text-xs text-gray-400 transition hover:text-gold-200"
                >
                  <X size={12} />
                  {lang === 'bg' ? 'Изчисти' : 'Clear'}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {filterPrimaryOptions.map((cat) => {
                const isSelected = filterPrimary.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleFilterPrimary(cat.id)}
                    aria-pressed={isSelected}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
                      isSelected
                        ? 'btn-gold'
                        : 'border border-gold-400/25 text-gray-300 hover:border-gold-400/50 hover:text-gold-200'
                    }`}
                  >
                    {lang === 'bg' ? cat.nameBg : cat.nameEn}
                    {!cat.isActive && (lang === 'bg' ? ' (скрита)' : ' (hidden)')}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              {lang === 'bg' ? 'Подкатегория' : 'Subcategory'}
            </p>
            <div className="flex flex-wrap gap-2">
              {filterThemeOptions.map((cat) => {
                const isSelected = filterTheme.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleFilterTheme(cat.id)}
                    aria-pressed={isSelected}
                    className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm transition ${
                      isSelected
                        ? 'btn-gold'
                        : 'border border-gold-400/25 text-gray-300 hover:border-gold-400/50 hover:text-gold-200'
                    }`}
                  >
                    {lang === 'bg' ? cat.nameBg : cat.nameEn}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
            <table className="w-full table-fixed text-left text-sm">
              <colgroup>
                <col style={{ width: '7%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '13%' }} />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-ink-800/95 text-gray-400 backdrop-blur">
                <tr>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Каталожен №' : 'Catalog №'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Снимка' : 'Image'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Име' : 'Name'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Описание (БГ)' : 'Description (BG)'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Описание (EN)' : 'Description (EN)'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Категории' : 'Categories'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Цена' : 'Price'}</th>
                  <th className="px-4 py-3 font-medium">{lang === 'bg' ? 'Действия' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const catNames = p.categoryIds
                    ?.map((id) => categories.find((c) => c.id === id))
                    .filter(Boolean)
                    .map((cat) => (lang === 'bg' ? cat?.nameBg : cat?.nameEn))
                    .join(', ');
                  const isDirty = dirtyIds.has(p.id);
                  const isSaving = savingIds.has(p.id);
                  const isCategoryOpen = expandedCategoryRow === p.id;

                  return (
                    <Fragment key={p.id}>
                      <tr className="border-t border-gold-400/10 transition hover:bg-gold-400/5">
                        <td className="px-4 py-4 text-gray-500 align-top">{p.oldCatalogNumber || '—'}</td>
                        <td className="px-4 py-4 align-top">
                          <div className="relative">
                            <AdminImage src={p.imageUrl} alt="" className="h-[80px] w-[80px] rounded-lg object-cover border border-gold-400/10" />
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
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="text"
                              value={p.nameBg ?? ''}
                              onChange={(e) => updateProductField(p.id, { nameBg: e.target.value })}
                              placeholder={lang === 'bg' ? 'Име (БГ)' : 'Name (BG)'}
                              className="form-input !py-1.5 !text-xs"
                            />
                            <input
                              type="text"
                              value={p.nameEn ?? ''}
                              onChange={(e) => updateProductField(p.id, { nameEn: e.target.value })}
                              placeholder={lang === 'bg' ? 'Име (EN)' : 'Name (EN)'}
                              className="form-input !py-1.5 !text-xs"
                            />
                            {p.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {p.tags.slice(0, 3).map((tag) => (
                                  <span key={tag} className="rounded bg-gold-400/10 px-1.5 py-0.5 text-xs text-gold-300/80">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <textarea
                            value={p.descriptionBg ?? ''}
                            onChange={(e) => updateProductField(p.id, { descriptionBg: e.target.value })}
                            placeholder={lang === 'bg' ? 'Описание (БГ)' : 'Description (BG)'}
                            rows={4}
                            className="form-input !py-1.5 !text-xs resize-y"
                          />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <textarea
                            value={p.descriptionEn ?? ''}
                            onChange={(e) => updateProductField(p.id, { descriptionEn: e.target.value })}
                            placeholder={lang === 'bg' ? 'Описание (EN)' : 'Description (EN)'}
                            rows={4}
                            className="form-input !py-1.5 !text-xs resize-y"
                          />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <button
                            type="button"
                            onClick={() => setExpandedCategoryRow((cur) => (cur === p.id ? null : p.id))}
                            className={`flex w-full items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-left text-xs transition ${
                              isCategoryOpen
                                ? 'border-gold-400/60 text-gold-200'
                                : 'border-gold-400/20 text-gray-400 hover:border-gold-400/40 hover:text-gold-200'
                            }`}
                          >
                            <span className="min-w-0 truncate">{catNames || '—'}</span>
                            <ChevronDown size={14} className={`shrink-0 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                          </button>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="1"
                              value={bgnToEur(p.price)}
                              onChange={(e) => setRowPriceEur(p.id, Number(e.target.value))}
                              className="form-input min-w-0 !py-1.5 !text-xs [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <span className="text-gold-200">€</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleRowSave(p)}
                              disabled={!isDirty || isSaving}
                              className={`rounded-lg p-2 transition ${
                                isDirty
                                  ? 'bg-gold-400/20 text-gold-200 hover:bg-gold-400/30'
                                  : 'text-gray-600 cursor-not-allowed'
                              }`}
                              aria-label={lang === 'bg' ? 'Потвърди промените' : 'Confirm changes'}
                              title={lang === 'bg' ? 'Потвърди промените' : 'Confirm changes'}
                            >
                              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            </button>
                            <button onClick={() => { setEditing(p); setShowForm(true); }} className="rounded-lg p-2 text-gold-200 transition hover:bg-gold-400/10" aria-label="Edit">
                              <Edit3 size={18} />
                            </button>
                            <button onClick={() => handleDelete(p.id)} className="rounded-lg p-2 text-error transition hover:bg-error/10" aria-label="Delete">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isCategoryOpen && (
                        <tr className="border-t border-gold-400/10 bg-ink-900">
                          <td colSpan={8} className="px-4 py-4">
                            <div className="flex flex-col gap-4">
                              <div>
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                                  {lang === 'bg' ? 'Основна категория' : 'Primary category'}
                                </p>
                                <select
                                  value={p.categoryId ?? ''}
                                  onChange={(e) => setRowPrimaryCategory(p.id, Number(e.target.value))}
                                  className="form-input max-w-xs"
                                >
                                  <optgroup label={lang === 'bg' ? 'Пол/възраст' : 'Demographic'}>
                                    {filterPrimaryOptions.filter((c) => c.group === 'main').map((cat) => (
                                      <option key={cat.id} value={cat.id}>{lang === 'bg' ? cat.nameBg : cat.nameEn}</option>
                                    ))}
                                  </optgroup>
                                  <optgroup label={lang === 'bg' ? 'Аксесоари' : 'Accessories'}>
                                    {filterPrimaryOptions.filter((c) => !c.isActive).map((cat) => (
                                      <option key={cat.id} value={cat.id}>{lang === 'bg' ? cat.nameBg : cat.nameEn}</option>
                                    ))}
                                  </optgroup>
                                </select>
                              </div>
                              <div>
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                                  {lang === 'bg' ? 'Подкатегории' : 'Subcategories'}
                                </p>
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
                                  {filterThemeOptions.map((cat) => {
                                    const checked = p.categoryIds.includes(cat.id);
                                    return (
                                      <label key={cat.id} className="flex items-center gap-2 rounded p-1 text-sm text-gray-300 hover:bg-gold-400/5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => toggleRowTheme(p.id, cat.id)}
                                          className="h-4 w-4 rounded border-gold-400/30 bg-ink-700 text-gold-400"
                                        />
                                        <span>{lang === 'bg' ? cat.nameBg : cat.nameEn}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
          categories={categories}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); setReloadKey((k) => k + 1); }}
        />
      )}
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang } = useI18n();
  const { notify } = useToast();

  const { primaryCategories, themeCategories } = classifyCategories(categories);
  const primaryIdSet = new Set(primaryCategories.map((c) => c.id));
  const themeIdSet = new Set(themeCategories.map((c) => c.id));

  const initialCategoryIds = product?.categoryIds?.length
    ? product.categoryIds
    : product?.categoryId
      ? [product.categoryId]
      : [];

  const [form, setForm] = useState({
    name_bg: product?.nameBg ?? '',
    name_en: product?.nameEn ?? '',
    description_bg: product?.descriptionBg ?? '',
    description_en: product?.descriptionEn ?? '',
    primary_category_id: initialCategoryIds.find((id) => primaryIdSet.has(id)) ?? primaryCategories[0]?.id ?? 2,
    theme_category_ids: initialCategoryIds.filter((id) => themeIdSet.has(id)),
    price: product ? bgnToEur(product.rawPrice) : 0,
    image_url: product?.imageUrl ?? '',
    sizes: product?.sizes ?? '',
    is_active: product?.isActive ?? true,
    is_new: product?.isNew ?? false,
    priority: product?.priority ?? 0,
    old_id: product?.oldId ?? null,
    old_catalog_number: product?.oldCatalogNumber ?? '',
    tags: product?.tags?.join(', ') ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleTheme = (catId: number) => {
    setForm((prev) => {
      const exists = prev.theme_category_ids.includes(catId);
      const updated = exists
        ? prev.theme_category_ids.filter((id) => id !== catId)
        : [...prev.theme_category_ids, catId];
      return { ...prev, theme_category_ids: updated };
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
      category_id: form.primary_category_id,
      category_ids: [form.primary_category_id, ...form.theme_category_ids],
      price: eurToBgn(Number(form.price)),
      image_url: form.image_url || null,
      sizes: form.sizes || null,
      is_active: form.is_active,
      is_new: form.is_new,
      priority: Number(form.priority),
      old_id: form.old_id ? Number(form.old_id) : null,
      old_catalog_number: form.old_catalog_number.trim() || null,
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={lang === 'bg' ? 'Описание (БГ)' : 'Description (BG)'}>
            <textarea value={form.description_bg} onChange={(e) => setForm({ ...form, description_bg: e.target.value })} className="form-input min-h-20" />
          </FormField>
          <FormField label={lang === 'bg' ? 'Описание (EN)' : 'Description (EN)'}>
            <textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} className="form-input min-h-20" />
          </FormField>
        </div>

        <FormField label={lang === 'bg' ? 'Основна категория' : 'Primary category'}>
          <select
            value={form.primary_category_id}
            onChange={(e) => setForm({ ...form, primary_category_id: Number(e.target.value) })}
            className="form-input"
          >
            <optgroup label={lang === 'bg' ? 'Пол/възраст' : 'Demographic'}>
              {primaryCategories.filter((c) => c.group === 'main').map((cat) => (
                <option key={cat.id} value={cat.id}>{lang === 'bg' ? cat.nameBg : cat.nameEn}</option>
              ))}
            </optgroup>
            <optgroup label={lang === 'bg' ? 'Аксесоари' : 'Accessories'}>
              {primaryCategories.filter((c) => !c.isActive).map((cat) => (
                <option key={cat.id} value={cat.id}>{lang === 'bg' ? cat.nameBg : cat.nameEn}</option>
              ))}
            </optgroup>
          </select>
        </FormField>

        <FormField label={lang === 'bg' ? 'Подкатегории (изберете нула или повече)' : 'Subcategories (select zero or more)'}>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 max-h-48 overflow-y-auto p-3 rounded-lg border border-gold-400/20 bg-ink-900">
            {themeCategories.map((cat) => {
              const checked = form.theme_category_ids.includes(cat.id);
              return (
                <label key={cat.id} className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer p-1 hover:bg-gold-400/5 rounded">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleTheme(cat.id)}
                    className="h-4 w-4 rounded border-gold-400/30 bg-ink-700 text-gold-400"
                  />
                  <span>{lang === 'bg' ? cat.nameBg : cat.nameEn}</span>
                </label>
              );
            })}
          </div>
        </FormField>

        <FormField label={lang === 'bg' ? 'Цена (€)' : 'Price (€)'}>
          <input type="number" step="1" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="form-input" required />
        </FormField>

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
          className="w-full max-h-[300px] rounded-xl border border-gold-400/15 object-cover"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label={lang === 'bg' ? 'Размери' : 'Sizes'}>
            <input type="text" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className="form-input" placeholder="S, M, L" />
          </FormField>
          <FormField label={lang === 'bg' ? 'Каталожен №' : 'Catalog №'}>
            <input type="text" value={form.old_catalog_number} onChange={(e) => setForm({ ...form, old_catalog_number: e.target.value })} className="form-input" placeholder="напр. 20423" />
          </FormField>
          <FormField label={lang === 'bg' ? 'Приоритет' : 'Priority'}>
            <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} className="form-input" />
          </FormField>
        </div>
        <FormField label={lang === 'bg' ? 'Стар ID (obid от стария сайт)' : 'Legacy ID (old site obid)'}>
          <input type="number" value={form.old_id ?? ''} onChange={(e) => setForm({ ...form, old_id: e.target.value ? Number(e.target.value) : null })} className="form-input" />
        </FormField>

        <FormField label={lang === 'bg' ? 'Тагове (разделени със запетая)' : 'Tags (comma-separated)'}>
          <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="form-input" placeholder="венец, маска, хелоуин" />
        </FormField>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 rounded border-gold-400/30 bg-ink-700" />
            {lang === 'bg' ? 'Активен (видим в каталога)' : 'Active (visible in catalog)'}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.is_new} onChange={(e) => setForm({ ...form, is_new: e.target.checked })} className="h-4 w-4 rounded border-gold-400/30 bg-ink-700" />
            {lang === 'bg' ? 'Нов продукт (лента на началната страница)' : 'New product (home page ribbon)'}
          </label>
        </div>

        {error && <ErrorBox>{error}</ErrorBox>}

        <FormActions saving={saving} onCancel={onClose} label={lang === 'bg' ? 'Запази' : 'Save'} />
      </form>
    </Modal>
  );
}

// ============================================================
// CATEGORY MANAGER
// ============================================================
function CategoryManager() {
  const { lang } = useI18n();
  const { notify } = useToast();
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    fetchAllCategoriesAdmin()
      .then(setCats)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: number) => {
    if (!confirm(lang === 'bg' ? 'Изтрий тази категория?' : 'Delete this category?')) return;
    try {
      await deleteCategory(id);
      notify('success', lang === 'bg' ? 'Категорията е изтрита.' : 'Category deleted.');
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
          {cats.length} {lang === 'bg' ? 'категории' : 'categories'}
        </p>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="btn-gold flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
        >
          <Plus size={16} />
          {lang === 'bg' ? 'Нова категория' : 'New category'}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c) => (
          <div key={c.id} className="glass overflow-hidden rounded-xl border border-gold-400/15">
            <div className="relative aspect-video">
              <AdminImage src={c.imageUrl} alt="" className="h-full w-full object-cover" />
              <span
                className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                  c.isActive ? 'bg-moss-500/80 text-white' : 'bg-ink-900/80 text-gray-400'
                }`}
              >
                {c.group === 'main' ? (lang === 'bg' ? 'Основна' : 'Main') : (lang === 'bg' ? 'Други' : 'Other')}
              </span>
            </div>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-100">
                {lang === 'bg' ? c.nameBg : c.nameEn}
              </h3>
              <p className="mt-1 text-xs text-gray-500">ID: {c.id} · {lang === 'bg' ? 'Ред' : 'Order'}: {c.sortOrder}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => { setEditing(c); setShowForm(true); }}
                  className="flex items-center gap-1.5 rounded-lg border border-gold-400/25 px-3.5 py-2 text-sm text-gold-200 transition hover:bg-gold-400/10"
                >
                  <Edit3 size={16} />
                  {lang === 'bg' ? 'Редактирай' : 'Edit'}
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="flex items-center gap-1.5 rounded-lg border border-error/25 px-3.5 py-2 text-sm text-error transition hover:bg-error/10"
                >
                  <Trash2 size={16} />
                  {lang === 'bg' ? 'Изтрий' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <CategoryForm
          cat={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </div>
  );
}

function CategoryForm({
  cat,
  onClose,
  onSaved,
}: {
  cat: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { lang } = useI18n();
  const { notify } = useToast();
  const [form, setForm] = useState({
    id: cat?.id ?? 0,
    nameBg: cat?.nameBg ?? '',
    nameEn: cat?.nameEn ?? '',
    imageUrl: cat?.imageUrl ?? '',
    group: cat?.group ?? 'main',
    sortOrder: cat?.sortOrder ?? 0,
    isActive: cat?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await saveCategory({
        ...form,
        id: cat?.id,
        group: form.group as 'main' | 'other',
      });
      notify('success', lang === 'bg' ? 'Категорията е запазена.' : 'Category saved.');
      onSaved();
    } catch {
      setError(lang === 'bg' ? 'Грешка при запазване.' : 'Error saving.');
      notify('error', lang === 'bg' ? 'Грешка при запазване.' : 'Error saving.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose} title={cat ? (lang === 'bg' ? 'Редакция категория' : 'Edit category') : (lang === 'bg' ? 'Нова категория' : 'New category')}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
        <FormField label={lang === 'bg' ? 'Снимка на категорията' : 'Category image'}>
          <div className="flex flex-col gap-2">
            <ImageUploadButton
              bucket="category-images"
              onUploaded={(url) => setForm({ ...form, imageUrl: url })}
              label={lang === 'bg' ? 'Качи снимка от файла' : 'Upload from file'}
            />
            <input type="text" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="form-input" placeholder="https://... или качете файл" />
          </div>
        </FormField>

        <AdminImage
          src={form.imageUrl}
          alt=""
          className="w-full max-h-[300px] rounded-xl border border-gold-400/15 object-cover"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label={lang === 'bg' ? 'Име (БГ)' : 'Name (BG)'}>
            <input type="text" value={form.nameBg} onChange={(e) => setForm({ ...form, nameBg: e.target.value })} className="form-input" required />
          </FormField>
          <FormField label={lang === 'bg' ? 'Име (EN)' : 'Name (EN)'}>
            <input type="text" value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} className="form-input" required />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="ID">
            <input type="number" value={form.id} onChange={(e) => setForm({ ...form, id: Number(e.target.value) })} className="form-input" disabled={!!cat} required />
          </FormField>
          <FormField label={lang === 'bg' ? 'Група' : 'Group'}>
            <select value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value as 'main' | 'other' })} className="form-input">
              <option value="main">{lang === 'bg' ? 'Основна' : 'Main'}</option>
              <option value="other">{lang === 'bg' ? 'Други' : 'Other'}</option>
            </select>
          </FormField>
          <FormField label={lang === 'bg' ? 'Ред' : 'Sort order'}>
            <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} className="form-input" />
          </FormField>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4 rounded border-gold-400/30 bg-ink-700" />
          {lang === 'bg' ? 'Активна' : 'Active'}
        </label>

        {error && <ErrorBox>{error}</ErrorBox>}

        <FormActions saving={saving} onCancel={onClose} label={lang === 'bg' ? 'Запази' : 'Save'} />
      </form>
    </Modal>
  );
}

// ============================================================
// CONTACTS MANAGER
// ============================================================
function ContactsManager() {
  const { lang } = useI18n();
  const { notify } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSiteSettings()
      .then((s) => {
        setSettings(s ?? {
          address: '',
          phone: '',
          email: '',
          themeOverride: 'auto',
          splashVideoEnabled: true,
          hoursBg: [],
          hoursEn: [],
          mapsQuery: '',
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const updateHour = (
    langKey: 'hoursBg' | 'hoursEn',
    idx: number,
    field: 'day' | 'time',
    value: string
  ) => {
    setSettings((prev) => {
      if (!prev) return prev;
      const hours = [...prev[langKey]];
      hours[idx] = { ...hours[idx], [field]: value };
      return { ...prev, [langKey]: hours };
    });
  };

  const addHour = () => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hoursBg: [...prev.hoursBg, { day: '', time: '' }],
        hoursEn: [...prev.hoursEn, { day: '', time: '' }],
      };
    });
  };

  const removeHour = (idx: number) => {
    setSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        hoursBg: prev.hoursBg.filter((_, i) => i !== idx),
        hoursEn: prev.hoursEn.filter((_, i) => i !== idx),
      };
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await saveSiteSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      notify('success', lang === 'bg' ? 'Настройките са запазени.' : 'Settings saved.');
    } catch {
      setError(lang === 'bg' ? 'Грешка при запазване.' : 'Error saving.');
      notify('error', lang === 'bg' ? 'Грешка при запазване.' : 'Error saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gold-300" />
      </div>
    );
  }

  if (!settings) {
    return <p className="text-center text-gray-500">Error loading settings.</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass rounded-2xl p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-gold-100">
          {lang === 'bg' ? 'Контактна информация' : 'Contact Information'}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label={lang === 'bg' ? 'Адрес' : 'Address'}>
            <div className="relative">
              <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-300/50" />
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="form-input pl-9"
              />
            </div>
          </FormField>
          <FormField label={lang === 'bg' ? 'Телефон' : 'Phone'}>
            <div className="relative">
              <Phone size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-300/50" />
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="form-input pl-9"
              />
            </div>
          </FormField>
          <FormField label={lang === 'bg' ? 'Имейл' : 'Email'}>
            <div className="relative">
              <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gold-300/50" />
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="form-input pl-9"
              />
            </div>
          </FormField>
        </div>

        <FormField label={lang === 'bg' ? 'Google Maps заявка' : 'Google Maps query'}>
          <input
            type="text"
            value={settings.mapsQuery}
            onChange={(e) => setSettings({ ...settings, mapsQuery: e.target.value })}
            className="form-input"
            placeholder="Carnival for You, София"
          />
        </FormField>
      </div>

      <div className="glass rounded-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock size={22} className="text-gold-300" />
            <h2 className="font-display text-lg font-semibold text-gold-100">
              {lang === 'bg' ? 'Работно време' : 'Working Hours'}
            </h2>
          </div>
          <button
            onClick={addHour}
            className="flex items-center gap-1 rounded-lg border border-gold-400/25 px-3 py-1.5 text-xs text-gold-200 transition hover:bg-gold-400/10"
          >
            <Plus size={14} />
            {lang === 'bg' ? 'Добави ред' : 'Add row'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* BG hours */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gold-300/70">БГ</h3>
            <div className="flex flex-col gap-2">
              {settings.hoursBg.map((h, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={h.day}
                    onChange={(e) => updateHour('hoursBg', idx, 'day', e.target.value)}
                    className="form-input flex-1"
                    placeholder="Ден"
                  />
                  <input
                    type="text"
                    value={h.time}
                    onChange={(e) => updateHour('hoursBg', idx, 'time', e.target.value)}
                    className="form-input flex-1"
                    placeholder="Час"
                  />
                  <button
                    onClick={() => removeHour(idx)}
                    className="rounded p-2 text-error transition hover:bg-error/10"
                    aria-label="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {settings.hoursBg.length === 0 && (
                <p className="text-xs text-gray-500">Няма въведени часове.</p>
              )}
            </div>
          </div>

          {/* EN hours */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gold-300/70">EN</h3>
            <div className="flex flex-col gap-2">
              {settings.hoursEn.map((h, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={h.day}
                    onChange={(e) => updateHour('hoursEn', idx, 'day', e.target.value)}
                    className="form-input flex-1"
                    placeholder="Day"
                  />
                  <input
                    type="text"
                    value={h.time}
                    onChange={(e) => updateHour('hoursEn', idx, 'time', e.target.value)}
                    className="form-input flex-1"
                    placeholder="Time"
                  />
                </div>
              ))}
              {settings.hoursEn.length === 0 && (
                <p className="text-xs text-gray-500">No hours entered.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-gold flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {lang === 'bg' ? 'Запази' : 'Save'}
        </button>
        {saved && (
          <span className="flex items-center gap-1 text-sm text-moss-400">
            <Check size={16} />
            {lang === 'bg' ? 'Запазено!' : 'Saved!'}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// THEME MANAGER
// ============================================================
// Add a new entry here (and a matching value in the site_settings.theme_override
// CHECK constraint, and a [data-theme="..."] block in src/index.css) to expose
// another seasonal visual theme the same way Christmas was added.
const THEME_OPTIONS: {
  value: ThemeOverride;
  labelBg: string;
  labelEn: string;
  descBg: string;
  descEn: string;
}[] = [
  {
    value: 'auto',
    labelBg: 'Автоматично (по дата)',
    labelEn: 'Automatic (by date)',
    descBg: 'Коледна тема от 1 ноември до 10 януари, основна тема през останалата част от годината.',
    descEn: 'Christmas theme Nov 1 – Jan 10, main theme the rest of the year.',
  },
  {
    value: 'main',
    labelBg: 'Основна тема',
    labelEn: 'Main theme',
    descBg: 'Тъмната магическа тема на сайта, независимо от датата.',
    descEn: "The site's dark magical theme, regardless of date.",
  },
  {
    value: 'christmas',
    labelBg: 'Коледна тема',
    labelEn: 'Christmas theme',
    descBg: 'Светлата снежна тема, независимо от датата.',
    descEn: 'The light snowy theme, regardless of date.',
  },
];

function ThemeManager() {
  const { lang } = useI18n();
  const { notify } = useToast();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSiteSettings()
      .then((s) => {
        setSettings(
          s ?? {
            address: '',
            phone: '',
            email: '',
            hoursBg: [],
            hoursEn: [],
            mapsQuery: '',
            themeOverride: 'auto',
            splashVideoEnabled: true,
          }
        );
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const choose = async (value: ThemeOverride) => {
    if (!settings || saving || settings.themeOverride === value) return;
    const previous = settings.themeOverride;
    const next = { ...settings, themeOverride: value };
    setSettings(next);
    setSaving(true);
    try {
      await saveSiteSettings(next);
      setThemeOverrideCache(value);
      notify('success', lang === 'bg' ? 'Темата е сменена.' : 'Theme switched.');
    } catch {
      setSettings({ ...next, themeOverride: previous });
      notify('error', lang === 'bg' ? 'Грешка при запазване.' : 'Error saving.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSplash = async () => {
    if (!settings || saving) return;
    const previous = settings.splashVideoEnabled;
    const next = { ...settings, splashVideoEnabled: !previous };
    setSettings(next);
    setSaving(true);
    try {
      await saveSiteSettings(next);
      notify('success', lang === 'bg' ? 'Запазено.' : 'Saved.');
    } catch {
      setSettings({ ...next, splashVideoEnabled: previous });
      notify('error', lang === 'bg' ? 'Грешка при запазване.' : 'Error saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin text-gold-300" />
      </div>
    );
  }

  if (!settings) {
    return <p className="text-center text-gray-500">Error loading settings.</p>;
  }

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="mb-1 font-display text-lg font-semibold text-gold-100">
        {lang === 'bg' ? 'Тема на сайта' : 'Site theme'}
      </h2>
      <p className="mb-5 text-sm text-gray-400">
        {lang === 'bg'
          ? 'Избира кой визуален облик виждат посетителите.'
          : 'Chooses which visual look visitors see.'}
      </p>

      <div className="grid gap-3 sm:grid-cols-3">
        {THEME_OPTIONS.map((opt) => {
          const active = settings.themeOverride === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => choose(opt.value)}
              disabled={saving}
              className={`flex flex-col items-start gap-1.5 rounded-xl border p-4 text-left transition disabled:opacity-60 ${
                active
                  ? 'border-gold-400/60 bg-gold-400/10 shadow-glow-sm'
                  : 'border-gold-400/15 hover:border-gold-400/35 hover:bg-gold-400/5'
              }`}
            >
              <span className="flex w-full items-center justify-between">
                <span className="font-display text-sm font-semibold text-gold-100">
                  {lang === 'bg' ? opt.labelBg : opt.labelEn}
                </span>
                {active && <Check size={16} className="shrink-0 text-gold-300" />}
              </span>
              <span className="text-xs leading-relaxed text-gray-400">
                {lang === 'bg' ? opt.descBg : opt.descEn}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 border-t border-gold-400/15 pt-6">
        <label
          className={`flex items-start gap-3 rounded-xl border p-4 transition ${
            saving ? 'opacity-60' : 'cursor-pointer hover:border-gold-400/35 hover:bg-gold-400/5'
          } border-gold-400/15`}
        >
          <input
            type="checkbox"
            checked={settings.splashVideoEnabled}
            onChange={toggleSplash}
            disabled={saving}
            className="mt-0.5 h-4 w-4 rounded border-gold-400/30 bg-ink-700"
          />
          <span>
            <span className="block font-display text-sm font-semibold text-gold-100">
              {lang === 'bg' ? 'Видео при първо посещение' : 'First-visit intro video'}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-gray-400">
              {lang === 'bg'
                ? 'Показва трансформационното видео на новите посетители еднократно, преди началната страница. Изключи, за да спреш видеото за всички.'
                : 'Shows the transformation video to new visitors once, before the homepage. Turn off to stop it for everyone.'}
            </span>
          </span>
        </label>
      </div>
    </div>
  );
}

// ============================================================
// SHARED UI COMPONENTS
// ============================================================

function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="flex max-h-[90vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-2xl border border-gold-400/20 bg-[#0b0d0b] shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gold-400/15 bg-[#0b0d0b] px-6 py-4">
          <h2 className="font-display text-xl font-bold text-gold-100">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gold-400/10 hover:text-gold-200" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  inline,
}: {
  label: string;
  children: ReactNode;
  inline?: boolean;
}) {
  return (
    <label className={`flex ${inline ? 'items-center gap-2' : 'flex-col gap-1.5'}`}>
      <span className="text-sm text-gray-300 whitespace-nowrap">{label}</span>
      {children}
    </label>
  );
}

function ErrorBox({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error">
      <AlertCircle size={16} />
      {children}
    </div>
  );
}

function FormActions({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label: string }) {
  const { lang } = useI18n();
  return (
    <div className="sticky bottom-0 -mx-6 -mb-6 flex gap-3 border-t border-gold-400/15 bg-[#0b0d0b] px-6 py-4">
      <button
        type="submit"
        disabled={saving}
        className="btn-gold flex items-center gap-2 rounded-lg px-6 py-3 text-sm disabled:opacity-50"
      >
        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
        {label}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-gold-400/25 px-6 py-3 text-sm text-gray-300 transition hover:bg-gold-400/10"
      >
        {lang === 'bg' ? 'Отказ' : 'Cancel'}
      </button>
    </div>
  );
}