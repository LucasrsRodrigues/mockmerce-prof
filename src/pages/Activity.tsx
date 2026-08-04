import { useState } from 'react';
import { Activity as ActivityIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export default function Activity() {
  const [since, setSince] = useState('');
  const { data, loading } = useAsync(() => api.activity(since || undefined), [since]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Participação"
        description="Quem realmente integrou: requisições por grupo e por aluno (RM), com a última atividade."
        action={
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="since" className="text-xs">Desde</Label>
              <Input id="since" type="date" value={since} onChange={(e) => setSince(e.target.value)} className="w-40" />
            </div>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ActivityIcon className="size-4 text-primary" /> Por grupo</CardTitle></CardHeader>
          <CardContent className="px-0">
            {loading ? <RowsSkeleton /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Grupo</TableHead><TableHead className="text-right">Reqs</TableHead><TableHead>Última</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data?.porGrupo.length ? data.porGrupo.map((r) => (
                    <TableRow key={r.groupId}>
                      <TableCell className="font-medium">{r.grupo}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.requisicoes}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{fmt(r.ultimaAtividade)}</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Sem atividade no período.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ActivityIcon className="size-4 text-primary" /> Por aluno (RM)</CardTitle></CardHeader>
          <CardContent className="px-0">
            {loading ? <RowsSkeleton /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Grupo</TableHead><TableHead className="text-right">Reqs</TableHead><TableHead>Última</TableHead></TableRow></TableHeader>
                <TableBody>
                  {data?.porAluno.length ? data.porAluno.map((r) => (
                    <TableRow key={r.rm}>
                      <TableCell>
                        <div className="font-medium">{r.nome}</div>
                        <code className="text-xs text-muted-foreground">{r.rm}</code>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.grupo ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.requisicoes}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{fmt(r.ultimaAtividade)}</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Sem atividade no período.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {!loading && data && (
        <p className="text-xs text-muted-foreground">
          <Badge variant="muted" className="mr-1">dica</Badge>
          RMs marcados como “(RM não cadastrado)” fizeram requisições sem estar num grupo — verifique o header <code>X-Student-RM</code> deles.
        </p>
      )}
    </div>
  );
}

function RowsSkeleton() {
  return <div className="space-y-2 px-4 pb-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>;
}
