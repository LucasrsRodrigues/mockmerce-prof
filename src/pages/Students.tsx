import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Search, UserRound, Pencil, KeyRound, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api, ApiError, type StudentRow, type Group } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Pagination } from '@/components/Pagination';
import { ImportRosterDialog } from '@/components/ImportRosterDialog';

type Filter = 'todos' | 'sem-grupo' | 'com-grupo';
const PAGE_SIZE = 20;

export default function Students() {
  const { can } = useAuth();
  const canWrite = can('groups:write');
  const { data, loading, reload } = useAsync(() => api.students.list(), []);
  const { data: groups } = useAsync(() => api.groups.list(), []);
  const [importOpen, setImportOpen] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('todos');
  const [page, setPage] = useState(1);
  // Diálogo de ação sobre um aluno específico.
  const [action, setAction] = useState<{ type: 'edit' | 'reset' | 'delete'; student: StudentRow } | null>(null);

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

  // Volta pra 1ª página quando muda busca/filtro; corrige a página se a lista
  // encolher (ex.: remover o último aluno da última página).
  useEffect(() => { setPage(1); }, [q, filter]);
  useEffect(() => {
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (page > pages) setPage(pages);
  }, [rows.length, page]);

  const paged = useMemo(() => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [rows, page]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Alunos"
        description="Toda a turma: quem está em qual loja, quem ainda não acessou — e o gerenciamento (editar, resetar senha, remover)."
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
                <TableRow>
                  <TableHead>Aluno</TableHead><TableHead>RM</TableHead><TableHead>Loja</TableHead><TableHead>Acesso</TableHead>
                  {canWrite && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length ? paged.map((s) => (
                  <StudentRowItem key={s.rm} s={s} canWrite={canWrite} onAction={(type) => setAction({ type, student: s })} />
                )) : (
                  <TableRow><TableCell colSpan={canWrite ? 5 : 4} className="py-10 text-center text-muted-foreground">
                    <UserRound className="mx-auto mb-2 size-7 opacity-40" />
                    {data?.length ? 'Nenhum aluno com esse filtro.' : 'Nenhum aluno ainda. Importe a turma.'}
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {!loading && <Pagination page={page} pageSize={PAGE_SIZE} total={rows.length} onChange={setPage} />}
        </CardContent>
      </Card>

      {importOpen && <ImportRosterDialog onClose={() => setImportOpen(false)} onDone={() => { setImportOpen(false); reload(); }} />}

      {action?.type === 'edit' && (
        <EditStudentDialog student={action.student} groups={groups ?? []} onClose={() => setAction(null)} onDone={() => { setAction(null); reload(); }} />
      )}
      {action?.type === 'reset' && (
        <ResetPasswordDialog student={action.student} onClose={() => setAction(null)} onDone={() => { setAction(null); reload(); }} />
      )}
      {action?.type === 'delete' && (
        <DeleteStudentDialog student={action.student} onClose={() => setAction(null)} onDone={() => { setAction(null); reload(); }} />
      )}
    </div>
  );
}

function StudentRowItem({ s, canWrite, onAction }: { s: StudentRow; canWrite: boolean; onAction: (t: 'edit' | 'reset' | 'delete') => void }) {
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
      {canWrite && (
        <TableCell>
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" title="Editar" onClick={() => onAction('edit')}><Pencil /></Button>
            <Button variant="ghost" size="icon" title="Resetar senha" onClick={() => onAction('reset')}><KeyRound /></Button>
            <Button variant="ghost" size="icon" title="Remover" onClick={() => onAction('delete')} className="text-destructive hover:text-destructive"><Trash2 /></Button>
          </div>
        </TableCell>
      )}
    </TableRow>
  );
}

// ----------------------------------------------------------------- Editar aluno
function EditStudentDialog({ student, groups, onClose, onDone }: { student: StudentRow; groups: Group[]; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(student.name);
  const [groupId, setGroupId] = useState(student.groupId ?? '');
  const [saving, setSaving] = useState(false);

  const dirty = name.trim() !== student.name || (groupId || null) !== (student.groupId ?? null);

  async function save() {
    if (!name.trim()) return toast.error('Informe o nome do aluno.');
    setSaving(true);
    try {
      await api.students.update(student.rm, { name: name.trim(), groupId: groupId || null });
      toast.success('Aluno atualizado.');
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Falha ao salvar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar aluno</DialogTitle>
          <DialogDescription>RM <code className="text-xs">{student.rm}</code> — o RM é a identidade do aluno e não pode ser alterado.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nome</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-group">Loja</Label>
            <select
              id="edit-group"
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— Sem grupo —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <p className="text-xs text-muted-foreground">Mover para outra loja ou deixar sem grupo (o aluno mantém o login).</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !dirty}>{saving && <Loader2 className="animate-spin" />} Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------- Resetar a senha
function ResetPasswordDialog({ student, onClose, onDone }: { student: StudentRow; onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<'rm' | 'custom'>('rm');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (mode === 'custom' && password.trim().length < 6) return toast.error('A senha deve ter ao menos 6 caracteres.');
    setSaving(true);
    try {
      const res = await api.students.resetPassword(student.rm, mode === 'custom' ? password.trim() : undefined);
      toast.success(res.toRm ? `Senha resetada — voltou a ser o RM (${student.rm}).` : 'Senha definida. O aluno trocará no próximo login.');
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Falha ao resetar senha');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resetar senha</DialogTitle>
          <DialogDescription><strong>{student.name}</strong> · RM <code className="text-xs">{student.rm}</code></DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-xs">
            {(['rm', 'custom'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${mode === m ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
              >
                {m === 'rm' ? 'Voltar a ser o RM' : 'Definir senha'}
              </button>
            ))}
          </div>
          {mode === 'rm' ? (
            <p className="text-sm text-muted-foreground">
              A senha volta a ser o próprio RM (<code className="text-xs">{student.rm}</code>) e o aluno é obrigado a trocá-la no próximo acesso.
            </p>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="reset-pass">Nova senha</Label>
              <Input id="reset-pass" type="text" placeholder="mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="text-xs text-muted-foreground">O aluno ainda será obrigado a trocá-la no próximo login.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="animate-spin" />} Resetar senha</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --------------------------------------------------------------- Remover aluno
function DeleteStudentDialog({ student, onClose, onDone }: { student: StudentRow; onClose: () => void; onDone: () => void }) {
  const [saving, setSaving] = useState(false);

  async function remove() {
    setSaving(true);
    try {
      await api.students.remove(student.rm);
      toast.success(`Aluno ${student.name} removido.`);
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Falha ao remover');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover aluno</DialogTitle>
          <DialogDescription>
            Apaga o login de <strong>{student.name}</strong> (RM <code className="text-xs">{student.rm}</code>).
            {student.groupId && <> Ele será desvinculado da loja <strong>{student.group}</strong>.</>} Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={remove} disabled={saving}>{saving && <Loader2 className="animate-spin" />} Remover</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
