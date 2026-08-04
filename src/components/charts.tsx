import { cn } from '@/lib/utils';

/** Barras horizontais comparando itens por um valor. Escala pelo maior. */
export function BarCompare({ items, format }: { items: { label: string; value: number; sub?: string }[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const fmt = format ?? ((v: number) => String(v));
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate font-medium">{it.label}</span>
            <span className="tabular-nums text-muted-foreground">{fmt(it.value)}{it.sub && <span className="ml-1 text-xs">{it.sub}</span>}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(it.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
      {!items.length && <p className="text-sm text-muted-foreground">Sem dados.</p>}
    </div>
  );
}

/** Gráfico de área/linha para uma série temporal (valores por dia). SVG responsivo. */
export function AreaChart({ points, labels, format, height = 120 }: { points: number[]; labels: string[]; format?: (v: number) => string; height?: number }) {
  const W = 600, H = height, pad = 6;
  const max = Math.max(1, ...points);
  const n = points.length;
  const x = (i: number) => (n <= 1 ? W / 2 : pad + (i * (W - pad * 2)) / (n - 1));
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const line = points.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = `${line} L ${x(n - 1).toFixed(1)} ${H - pad} L ${x(0).toFixed(1)} ${H - pad} Z`;
  const fmt = format ?? ((v: number) => String(v));
  const peak = points.indexOf(max);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none" role="img" aria-label="Série temporal">
        <path d={area} className="fill-primary/10" />
        <path d={line} className="fill-none stroke-primary" strokeWidth={2} vectorEffect="non-scaling-stroke" />
        {points.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={i === peak ? 3.5 : 0} className="fill-primary" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>{labels[0]}</span>
        {n > 2 && <span>{labels[Math.floor(n / 2)]}</span>}
        <span>{labels[n - 1]}</span>
      </div>
      <div className="mt-0.5 text-center text-[10px] text-muted-foreground">pico: {fmt(max)}</div>
    </div>
  );
}

const SEG_CLASS: Record<string, string> = {
  success: 'text-emerald-500',
  warning: 'text-amber-500',
  destructive: 'text-red-500',
  muted: 'text-muted-foreground',
  primary: 'text-primary',
};

/** Donut para distribuição (ex.: pedidos por status). Usa currentColor por segmento. */
export function Donut({ segments }: { segments: { label: string; value: number; tone: keyof typeof SEG_CLASS }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const R = 42, C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90">
        <circle cx="50" cy="50" r={R} className="fill-none stroke-muted" strokeWidth={12} />
        {total > 0 && segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = <circle key={i} cx="50" cy="50" r={R} className={cn('fill-none', SEG_CLASS[s.tone])} stroke="currentColor" strokeWidth={12} strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
        <text x="50" y="50" className="rotate-90 fill-foreground text-[14px] font-semibold" textAnchor="middle" dominantBaseline="central" transform="rotate(90 50 50)">{total}</text>
      </svg>
      <div className="space-y-1.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span className={cn('size-2.5 rounded-full bg-current', SEG_CLASS[s.tone])} />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="tabular-nums font-medium">{s.value}</span>
          </div>
        ))}
        {!total && <p className="text-sm text-muted-foreground">Sem pedidos.</p>}
      </div>
    </div>
  );
}
