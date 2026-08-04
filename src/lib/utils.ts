import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(v: number | null | undefined): string {
  if (v == null) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

/** "há 3 min", "há 2 h", "há 5 d" — para os feeds de atividade. */
export function fmtRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return 'agora';
  const m = Math.floor(s / 60);
  if (m < 60) return `há ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `há ${h} h`;
  return `há ${Math.floor(h / 24)} d`;
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' | 'muted';

export function orderStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'PAID': case 'FULFILLED': case 'SHIPPED': case 'DELIVERED': return 'success';
    case 'PENDING': return 'warning';
    case 'CANCELLED': case 'REFUNDED': return 'destructive';
    default: return 'muted';
  }
}

export function productStateVariant(state: string): BadgeVariant {
  switch (state) {
    case 'PUBLISHED': return 'success';
    case 'DRAFT': return 'muted';
    case 'HIDDEN': return 'warning';
    default: return 'muted';
  }
}

export function httpStatusVariant(s: number): BadgeVariant {
  if (s >= 500) return 'destructive';
  if (s >= 400) return 'warning';
  if (s >= 200 && s < 300) return 'success';
  return 'muted';
}
