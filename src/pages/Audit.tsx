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

export default function Audit() {
  const [action, setAction] = useState('');
  const [applied, setApplied] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading } = useAsync(() => api.audit({ action: applied || undefined, page, pageSize: 50 }), [applied, page]);

  return (
    <div className="space-y-4">
      <PageHeader title="Auditoria" description="Trilha de ações sensíveis: criação de grupos, rotação de chaves, operadores, LGPD." />

      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="space-y-1">
            <Label className="text-xs">Ação contém</Label>
            <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="group.created" className="w-56"
              onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); setApplied(action.trim()); } }} />
          </div>
          <button onClick={() => { setPage(1); setApplied(action.trim()); }} className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">Filtrar</button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
          ) : (
            <>
              <Table>
                <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Ação</TableHead><TableHead>Por</TableHead><TableHead>Alvo</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data?.data.length ? data.data.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmt(a.at)}</TableCell>
                      <TableCell><Badge variant="muted" className="font-mono text-[10px]">{a.action}</Badge></TableCell>
                      <TableCell className="text-xs">{a.by === 'master' ? <Badge variant="default">master</Badge> : a.by ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{a.targetType ? `${a.targetType}:${a.targetId ?? ''}` : '—'}</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">Nenhum registro.</TableCell></TableRow>}
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
