import { useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Trophy, Loader2, Eye, CheckCircle2, Circle } from 'lucide-react';
import { api, ApiError, type GroupDashboard } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

function notaVariant(n: number) {
  if (n >= 7) return 'success';
  if (n >= 5) return 'warning';
  return 'destructive';
}

export default function Teaching() {
  const { can } = useAuth();
  const canEval = can('groups:write');
  const { data, loading, reload } = useAsync(() => api.teaching.class(), []);
  const { data: ranking } = useAsync(() => api.teaching.ranking(), []);
  const [evaluating, setEvaluating] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);

  async function evaluateAll() {
    setEvaluating(true);
    try {
      const res = await api.teaching.evaluate();
      toast.success(`${res.evaluated} grupo(s) avaliado(s)`);
      reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Falha ao avaliar');
    } finally {
      setEvaluating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Turma"
        description="XP e nota por grupo e por aluno, a partir das missões avaliadas por evidência."
        action={canEval && <Button onClick={evaluateAll} disabled={evaluating}>{evaluating ? <Loader2 className="animate-spin" /> : <RefreshCw />} Reavaliar turma</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Por grupo (2/3) */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Por grupo</CardTitle></CardHeader>
          <CardContent className="px-0">
            {loading ? <RowsSkeleton /> : (
              <Table>
                <TableHeader><TableRow><TableHead>Grupo</TableHead><TableHead className="text-right">Missões</TableHead><TableHead className="text-right">XP</TableHead><TableHead className="text-right">Nota</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {data?.porGrupo.length ? data.porGrupo.map((g) => (
                    <TableRow key={g.groupId}>
                      <TableCell className="font-medium">{g.grupo}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{g.missoes}</TableCell>
                      <TableCell className="text-right tabular-nums">{g.xp}</TableCell>
                      <TableCell className="text-right"><Badge variant={notaVariant(g.nota)}>{g.nota.toFixed(1)}</Badge></TableCell>
                      <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => setDetail(g.groupId)} title="Ver missões"><Eye className="size-4" /></Button></TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum grupo avaliado ainda.</TableCell></TableRow>}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Ranking (1/3) */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="size-4 text-primary" /> Ranking</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {ranking?.length ? ranking.map((r) => (
              <div key={r.posicao} className="flex items-center gap-3 text-sm">
                <span className="w-6 text-center font-semibold text-muted-foreground">{r.posicao}º</span>
                <span className="flex-1 truncate">{r.grupo}</span>
                <span className="tabular-nums font-medium">{r.xp} XP</span>
              </div>
            )) : <p className="text-sm text-muted-foreground">Sem dados.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Por aluno */}
      <Card>
        <CardHeader><CardTitle>Por aluno (RM)</CardTitle></CardHeader>
        <CardContent className="px-0">
          {loading ? <RowsSkeleton /> : (
            <Table>
              <TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Grupo</TableHead><TableHead className="text-right">XP</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.porAluno.length ? data.porAluno.map((a) => (
                  <TableRow key={a.rm}>
                    <TableCell><span className="font-medium">{a.nome}</span> <code className="ml-1 text-xs text-muted-foreground">{a.rm}</code></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.grupo ?? '—'}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.xp}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={3} className="py-8 text-center text-muted-foreground">Sem XP individual ainda.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {detail && <GroupDetailDialog groupId={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function GroupDetailDialog({ groupId, onClose }: { groupId: string; onClose: () => void }) {
  const { data, loading } = useAsync<GroupDashboard>(() => api.teaching.group(groupId), [groupId]);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Missões do grupo</DialogTitle>
          <DialogDescription>
            {data && <>Nota <strong>{data.nota.toFixed(1)}</strong> · {data.xp} XP · {data.missoes.cumpridas}/{data.missoes.total} missões</>}
          </DialogDescription>
        </DialogHeader>
        {loading || !data ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <div className="space-y-1.5">
            {data.missoes.lista.map((m) => (
              <div key={m.key} className="flex items-start gap-2 rounded-md border p-2.5">
                {m.cumprida ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{m.title}</span>
                    <Badge variant="muted" className="text-[10px]">{m.phase}</Badge>
                    <span className="text-xs text-muted-foreground">{m.points} pts</span>
                    {m.porRm && <code className="ml-auto text-[10px] text-muted-foreground">por {m.porRm}</code>}
                  </div>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RowsSkeleton() {
  return <div className="space-y-2 px-4 pb-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>;
}
