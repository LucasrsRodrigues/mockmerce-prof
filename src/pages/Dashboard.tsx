import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, DollarSign, ShoppingCart, Zap, GraduationCap, Package, ArrowRight } from 'lucide-react';
import { api, type ClassDashboard } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { cn, money, orderStatusVariant } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarCompare, AreaChart, Donut } from '@/components/charts';

type Metric = 'receitaPaga' | 'pedidos' | 'requisicoes' | 'xp' | 'nota';
const METRICS: { key: Metric; label: string; fmt: (v: number) => string }[] = [
  { key: 'receitaPaga', label: 'Receita', fmt: money },
  { key: 'pedidos', label: 'Pedidos', fmt: (v) => String(v) },
  { key: 'requisicoes', label: 'Requisições', fmt: (v) => String(v) },
  { key: 'xp', label: 'XP', fmt: (v) => String(v) },
  { key: 'nota', label: 'Nota', fmt: (v) => v.toFixed(1) },
];

const STATUS_TONE = (s: string) => {
  const v = orderStatusVariant(s);
  return (v === 'success' ? 'success' : v === 'warning' ? 'warning' : v === 'destructive' ? 'destructive' : 'muted') as 'success' | 'warning' | 'destructive' | 'muted';
};

export default function Dashboard() {
  const [days, setDays] = useState(14);
  const [metric, setMetric] = useState<Metric>('receitaPaga');
  const { data, loading } = useAsync<ClassDashboard>(() => api.dashboard(days), [days]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard da turma"
        description="Visão comparativa de todos os grupos — receita, pedidos, atividade e XP lado a lado."
        action={
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
            {[7, 14, 30].map((d) => (
              <button key={d} onClick={() => setDays(d)} className={cn('rounded-md px-3 py-1 font-medium transition-colors', days === d ? 'bg-background shadow-sm' : 'text-muted-foreground')}>{d}d</button>
            ))}
          </div>
        }
      />

      {loading || !data ? (
        <div className="space-y-4">
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
          <div className="grid gap-6 lg:grid-cols-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64" />)}</div>
        </div>
      ) : (
        <>
          {/* Totais da turma */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <Tile icon={Users} label="Grupos" value={data.totals.grupos} />
            <Tile icon={DollarSign} label="Receita paga" value={money(data.totals.receitaPaga)} accent />
            <Tile icon={ShoppingCart} label="Pedidos" value={data.totals.pedidos} />
            <Tile icon={Package} label="Produtos" value={data.totals.produtos} />
            <Tile icon={Zap} label="Requisições" value={data.totals.requisicoes} />
            <Tile icon={GraduationCap} label="XP da turma" value={data.totals.xp} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Comparativo por métrica */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle>Ranking por grupo</CardTitle>
                <div className="flex flex-wrap gap-1 rounded-lg bg-muted p-1 text-xs">
                  {METRICS.map((m) => (
                    <button key={m.key} onClick={() => setMetric(m.key)} className={cn('rounded-md px-2.5 py-1 font-medium transition-colors', metric === m.key ? 'bg-background shadow-sm' : 'text-muted-foreground')}>{m.label}</button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <BarCompare
                  items={[...data.groups]
                    .sort((a, b) => (b[metric] as number) - (a[metric] as number))
                    .map((g) => ({ label: g.name, value: g[metric] as number, sub: g.active ? undefined : '(inativo)' }))}
                  format={METRICS.find((m) => m.key === metric)!.fmt}
                />
              </CardContent>
            </Card>

            {/* Pedidos por status */}
            <Card>
              <CardHeader><CardTitle>Pedidos por status</CardTitle></CardHeader>
              <CardContent>
                <Donut segments={data.ordersByStatus.map((s) => ({ label: s.status, value: s.count, tone: STATUS_TONE(s.status) }))} />
              </CardContent>
            </Card>
          </div>

          {/* Séries temporais */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Atividade da turma (requisições/dia)</CardTitle></CardHeader>
              <CardContent>
                <AreaChart points={data.activityByDay.map((d) => d.requisicoes)} labels={data.activityByDay.map((d) => d.date.slice(5))} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Pedidos e receita/dia</CardTitle></CardHeader>
              <CardContent>
                <AreaChart points={data.ordersByDay.map((d) => d.receita)} labels={data.ordersByDay.map((d) => d.date.slice(5))} format={money} />
              </CardContent>
            </Card>
          </div>

          {/* Tabela comparativa */}
          <Card>
            <CardHeader><CardTitle>Todos os grupos</CardTitle></CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader><TableRow><TableHead>Grupo</TableHead><TableHead className="text-right">Alunos</TableHead><TableHead className="text-right">Produtos</TableHead><TableHead className="text-right">Pedidos</TableHead><TableHead className="text-right">Receita</TableHead><TableHead className="text-right">Reqs</TableHead><TableHead className="text-right">XP</TableHead><TableHead className="text-right">Nota</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {data.groups.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell><Link to={`/grupos/${g.id}`} className="font-medium hover:text-primary hover:underline">{g.name}</Link>{!g.active && <Badge variant="muted" className="ml-2 text-[10px]">inativo</Badge>}</TableCell>
                      <TableCell className="text-right tabular-nums">{g.alunos}</TableCell>
                      <TableCell className="text-right tabular-nums">{g.produtos}</TableCell>
                      <TableCell className="text-right tabular-nums">{g.pedidos}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(g.receitaPaga)}</TableCell>
                      <TableCell className="text-right tabular-nums">{g.requisicoes}</TableCell>
                      <TableCell className="text-right tabular-nums">{g.xp}</TableCell>
                      <TableCell className="text-right"><Badge variant={g.nota >= 7 ? 'success' : g.nota >= 5 ? 'warning' : 'destructive'}>{g.nota.toFixed(1)}</Badge></TableCell>
                      <TableCell className="text-right"><Link to={`/grupos/${g.id}`} className="text-muted-foreground hover:text-primary"><ArrowRight className="size-4" /></Link></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Tile({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className={accent ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="p-4">
        <Icon className={cn('size-4', accent ? 'text-primary' : 'text-muted-foreground')} />
        <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
