import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Loader2, X } from 'lucide-react';
import { LogoMark } from './Logo';

// ------------------------------------------------------------------ Loaders
export function Spinner({ className = 'w-4 h-4', label }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <Loader2 className={`${className} animate-spin`} aria-hidden="true" />
      <span className={label ? 'text-sm' : 'sr-only'}>{label ?? 'Chargement…'}</span>
    </span>
  );
}

/** Full-area loader used as Suspense fallback for lazily loaded pages. */
export function PageLoader({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] w-full items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3 text-white/50">
        <LogoMark size={40} className="animate-pulse" />
        <span className="text-xs tracking-widest uppercase">{label}</span>
      </div>
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`} aria-hidden="true" />;
}

// ------------------------------------------------------------------ Button
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-lime text-black hover:bg-white focus-visible:ring-lime',
  secondary: 'bg-white/[0.06] text-white border border-white/10 hover:bg-white/[0.1] hover:border-white/20',
  ghost: 'text-white/70 hover:text-white hover:bg-white/[0.05]',
  danger: 'bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', loading = false, size = 'md', icon, className = '', children, disabled, type = 'button', ...rest },
  ref,
) {
  const sizes = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer ${sizes[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
});

// ------------------------------------------------------------------ Form fields
interface FieldShellProps {
  label: string;
  error?: string;
  hint?: string;
  id: string;
  children: ReactNode;
  required?: boolean;
}

function FieldShell({ label, error, hint, id, children, required }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-white/80">
        {label}
        {required && <span className="text-lime"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-xs text-rose-300" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-white/40">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const inputBase =
  'w-full rounded-lg border bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder-white/30 transition-colors focus:outline-none focus:ring-2 focus:ring-lime/60 disabled:opacity-50';

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & FieldProps>(function Input(
  { label, error, hint, id, className = '', required, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} error={error} hint={hint} id={fid} required={required}>
      <input
        ref={ref}
        id={fid}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${fid}-error` : hint ? `${fid}-hint` : undefined}
        className={`${inputBase} ${error ? 'border-rose-400/60' : 'border-white/10'} ${className}`}
        {...rest}
      />
    </FieldShell>
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & FieldProps>(function Select(
  { label, error, hint, id, className = '', children, required, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} error={error} hint={hint} id={fid} required={required}>
      <select
        ref={ref}
        id={fid}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        className={`${inputBase} ${error ? 'border-rose-400/60' : 'border-white/10'} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10 ${className}`}
        {...rest}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps>(function Textarea(
  { label, error, hint, id, className = '', required, ...rest },
  ref,
) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell label={label} error={error} hint={hint} id={fid} required={required}>
      <textarea
        ref={ref}
        id={fid}
        required={required}
        aria-invalid={Boolean(error) || undefined}
        className={`${inputBase} ${error ? 'border-rose-400/60' : 'border-white/10'} min-h-24 ${className}`}
        {...rest}
      />
    </FieldShell>
  );
});

export function Checkbox({
  label,
  checked,
  onChange,
  error,
  id,
}: {
  label: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
  error?: string;
  id?: string;
}) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <div className="space-y-1">
      <label htmlFor={fid} className="flex cursor-pointer items-start gap-3 text-sm text-white/70">
        <input
          id={fid}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={Boolean(error) || undefined}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-lime"
        />
        <span>{label}</span>
      </label>
      {error && (
        <p className="pl-7 text-xs text-rose-300" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ Layout helpers
export function Card({ children, className = '', as: Tag = 'section' }: { children: ReactNode; className?: string; as?: 'section' | 'div' | 'article' }) {
  return <Tag className={`rounded-2xl border border-white/10 bg-panel p-5 sm:p-6 ${className}`}>{children}</Tag>;
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-white/50">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      {icon && <div className="mb-4 text-lime">{icon}</div>}
      <h2 className="font-display text-lg font-semibold text-white">{title}</h2>
      {text && <p className="mt-2 max-w-md text-sm text-white/50">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Alert({ tone = 'info', children }: { tone?: 'info' | 'error' | 'success' | 'warn'; children: ReactNode }) {
  const tones = {
    info: 'border-sky-400/30 bg-sky-400/5 text-sky-200',
    error: 'border-rose-400/30 bg-rose-400/5 text-rose-200',
    success: 'border-lime/30 bg-lime/5 text-lime',
    warn: 'border-amber-400/30 bg-amber-400/5 text-amber-200',
  };
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'lime' | 'sky' | 'rose' | 'amber' }) {
  const tones = {
    neutral: 'bg-white/[0.06] text-white/70',
    lime: 'bg-lime/15 text-lime',
    sky: 'bg-sky-400/15 text-sky-300',
    rose: 'bg-rose-400/15 text-rose-300',
    amber: 'bg-amber-400/15 text-amber-300',
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

// ------------------------------------------------------------------ Modal
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(92vw,32rem)] rounded-2xl border border-white/10 bg-panel p-0 text-white backdrop:bg-black/70 backdrop:backdrop-blur-sm"
      aria-labelledby="modal-title"
    >
      {open && (
        <div className="p-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h2 id="modal-title" className="font-display text-lg font-semibold">
              {title}
            </h2>
            <button onClick={onClose} className="rounded-md p-1 text-white/50 hover:text-white cursor-pointer" aria-label="Fermer">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4">{children}</div>
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

// ------------------------------------------------------------------ Read-only display
/** Clean read-only presentation of saved values (shown instead of inputs until "Modifier"). */
export function InfoList({ items, columns = 2 }: { items: { label: string; value: ReactNode }[]; columns?: 1 | 2 | 3 }) {
  const cols = { 1: '', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-2 lg:grid-cols-3' }[columns];
  return (
    <dl className={`grid gap-x-6 gap-y-4 ${cols}`}>
      {items.map((i) => (
        <div key={i.label} className="min-w-0 border-b border-white/5 pb-3">
          <dt className="text-xs font-medium uppercase tracking-wider text-white/40">{i.label}</dt>
          <dd className="mt-1 break-words text-sm text-white">{i.value === '' || i.value == null ? <span className="text-white/30">-</span> : i.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {action}
    </div>
  );
}
