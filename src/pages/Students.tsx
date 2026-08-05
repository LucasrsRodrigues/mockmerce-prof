import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Search, UserRound } from 'lucide-react';
import { api, type StudentRow } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ImportRosterDialog } from '@/components/ImportRosterDialog';

type Filter = 'todos' | 'sem-grupo' | 'com-grupo';

export default function Students() {
  const { can } = useAuth();
  const canWrite = can('groups:write');
  const { data, loading, reload } = useAsync(() => api.students.list(), []);
  const [importOpen, setImportOpen] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');

  const stats = useMemo(() => {
    const all = data ?? [];
    return {
      total: all.length,
      semGrupo: all.filter((s) => !s.groupId).length,
      comGrupo: all.filter((s) => s.groupId).length,
      acessaram: all.filter((s) => s.jaAcessou).length,
    };
  }, [data]);

  const rows = useMemo(() => {
    let list = data ?? [];
    if (filter === 'sem-grupo') list = list.filter((s) => !s.groupId);
    if (filter === 'com-grupo') list = list.filter((s) => s.groupId);
    const term = q.trim().toLowerCase();
    if (term) list = list.filter((s) => s.name.toLowerCase().includes(term) || s.rm.toLowerCase().includes(term));
    return list;
  }, [data, filter, q]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Alunos"
        description="Toda a turma: quem está em qual loja e quem ainda não foi alocado ou não acessou."
        action={canWrite && <Button onClick={() => setImportOpen(true)}><UploadCloud /> Importar turma</Button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Com loja" value={stats.comGrupo} />
        <StatCard label="Sem grupo" value={stats.semGrupo} tone={stats.semGrupo ? 'warning' : undefined} />
        <StatCard label="Já acessaram" value={stats.acessaram} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou RM…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8" />
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-xs">
          {(['todos', 'sem-grupo', 'com-grupo'] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 font-medium capitalize transition-colors ${filter === f ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              {f === 'sem-grupo' ? 'Sem grupo' : f === 'com-grupo' ? 'Com loja' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Aluno</TableHead><TableHead>RM</TableHead><TableHead>Loja</TableHead><TableHead>Acesso</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {rows.length ? rows.map((s) => <StudentRowItem key={s.rm} s={s} />) : (
                  <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    <UserRound className="mx-auto mb-2 size-7 opacity-40" />
                    {data?.length ? 'Nenhum aluno com esse filtro.' : 'Nenhum aluno ainda. Importe a turma.'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {importOpen && <ImportRosterDialog onClose={() => setImportOpen(false)} onDone={() => { setImportOpen(false); reload(); }} />}
    </div>
  );
}

function StudentRowItem({ s }: { s: StudentRow }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{s.name}</TableCell>
      <TableCell><code className="text-xs text-muted-foreground">{s.rm}</code></TableCell>
      <TableCell>
        {s.groupId
          ? <Link to={`/grupos/${s.groupId}`} className="text-primary hover:underline">{s.group}</Link>
          : <Badge variant="warning">sem grupo</Badge>}
      </TableCell>
      <TableCell><Badge variant={s.jaAcessou ? 'success' : 'muted'}>{s.jaAcessou ? 'já acessou' : '1º acesso pendente'}</Badge></TableCell>
    </TableRow>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: 'warning' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className={`text-2xl font-semibold tabular-nums ${tone === 'warning' && value > 0 ? 'text-amber-600' : ''}`}>{value}</div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
