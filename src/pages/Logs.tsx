import { useState } from 'react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { Pagination } from '@/components/Pagination';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

function statusVariant(s: number) {
  if (s >= 500) return 'destructive';
  if (s >= 400) return 'warning';
  if (s >= 200 && s < 300) return 'success';
  return 'muted';
}

export default function Logs() {
  const [filters, setFilters] = useState({ rm: '', path: '', since: '' });
  const [applied, setApplied] = useState({ rm: '', path: '', since: '' });
  const [page, setPage] = useState(1);
  const { data, loading } = useAsync(() => api.logs({ ...applied, page, pageSize: 50 }), [applied, page]);

  function apply() {
    setPage(1);
    setApplied({ ...filters });
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Logs de requisições" description="Registro bruto de toda chamada à API — filtre por RM, rota ou data." />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <Field label="RM"><Input value={filters.rm} onChange={(e) => setFilters((f) => ({ ...f, rm: e.target.value }))} placeholder="RM550001" className="w-36" /></Field>
          <Field label="Rota contém"><Input value={filters.path} onChange={(e) => setFilters((f) => ({ ...f, path: e.target.value }))} placeholder="/v1/products" className="w-52" /></Field>
          <Field label="Desde"><Input type="date" value={filters.since} onChange={(e) => setFilters((f) => ({ ...f, since: e.target.value }))} className="w-40" /></Field>
          <button onClick={apply} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Filtrar</button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead><TableHead>Grupo</TableHead><TableHead>RM</TableHead>
                    <TableHead>Método</TableHead><TableHead>Rota</TableHead><TableHead className="text-right">Status</TableHead><TableHead className="text-right">ms</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data.length ? data.data.map((l, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmt(l.createdAt)}</TableCell>
                      <TableCell className="text-xs">{l.group ?? '—'}</TableCell>
                      <TableCell><code className="text-xs">{l.rm ?? '—'}</code></TableCell>
                      <TableCell><Badge variant="muted" className="font-mono text-[10px]">{l.method}</Badge></TableCell>
                      <TableCell><code className="text-xs">{l.path}</code></TableCell>
                      <TableCell className="text-right"><Badge variant={statusVariant(l.statusCode)}>{l.statusCode}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums text-xs text-muted-foreground">{l.latencyMs}</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={7} className="py-10 text-center text-muted-foreground">Nenhum log encontrado.</TableCell></TableRow>}
                </TableBody>
              </Table>
              {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} disabled={loading} />}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1"><Label className="text-xs">{label}</Label>{children}</div>;
}
