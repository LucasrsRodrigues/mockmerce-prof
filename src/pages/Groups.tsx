import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Plus, KeyRound, Power, UserPlus, Copy, Loader2, Trash2, Users, ArrowRight, UploadCloud } from 'lucide-react';
import { api, ApiError, type Group, type NewStudent } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { StudentsImport } from '@/components/StudentsImport';
import { ImportRosterDialog } from '@/components/ImportRosterDialog';

type Mode = 'manual' | 'bulk';

function ModeToggle({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-xs">
      <button type="button" onClick={() => onChange('manual')} className={`rounded-md py-1.5 font-medium transition-colors ${mode === 'manual' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Linha a linha</button>
      <button type="button" onClick={() => onChange('bulk')} className={`rounded-md py-1.5 font-medium transition-colors ${mode === 'bulk' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>Colar lista / CSV</button>
    </div>
  );
}

export default function Groups() {
  const { can } = useAuth();
  const canWrite = can('groups:write');
  const { data: groups, loading, reload } = useAsync(() => api.groups.list(), []);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [addTo, setAddTo] = useState<Group | null>(null);
  const [revealed, setRevealed] = useState<{ title: string; key: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function rotate(g: Group) {
    setBusy(g.id);
    try {
      const res = await api.groups.rotateKey(g.id);
      setRevealed({ title: `Nova chave de ${g.name}`, key: res.apiKey });
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Falha ao rotacionar');
    } finally {
      setBusy(null);
    }
  }

  async function toggleActive(g: Group) {
    setBusy(g.id);
    try {
      await api.groups.setActive(g.id, !g.active);
      toast.success(g.active ? 'Grupo desativado' : 'Grupo ativado');
      reload();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Falha');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Grupos"
        description="Cada grupo é um tenant isolado pela sua API key. A chave aparece uma única vez."
        action={canWrite && (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setImportOpen(true)}><UploadCloud /> Importar turma</Button>
            <Button onClick={() => setCreateOpen(true)}><Plus /> Novo grupo</Button>
          </div>
        )}
      />

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : !groups?.length ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Users className="mx-auto mb-3 size-8 opacity-40" />
          Nenhum grupo ainda. {canWrite ? 'Crie o primeiro grupo.' : ''}
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <Card key={g.id} className={g.active ? '' : 'opacity-60'}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Link to={`/grupos/${g.id}`} className="font-semibold hover:text-primary hover:underline">{g.name}</Link>
                      <Badge variant={g.active ? 'success' : 'muted'}>{g.active ? 'ativo' : 'inativo'}</Badge>
                    </div>
                    <code className="text-xs text-muted-foreground">{g.apiKeyPrefix}…</code>
                  </div>
                  <Button asChild size="sm" className="shrink-0"><Link to={`/grupos/${g.id}`}>Entrar <ArrowRight /></Link></Button>
                </div>

                <div className="grid grid-cols-5 gap-2 text-center text-sm">
                  <Stat label="Alunos" value={g.counts.alunos} />
                  <Stat label="Produtos" value={g.counts.produtos} />
                  <Stat label="Pedidos" value={g.counts.pedidos} />
                  <Stat label="Clientes" value={g.counts.clientes} />
                  <Stat label="Reqs" value={g.counts.requisicoes} />
                </div>

                {g.students.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {g.students.map((s) => (
                      <span key={s.rm} className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{s.name} · {s.rm}</span>
                    ))}
                  </div>
                )}

                {canWrite && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button variant="outline" size="sm" onClick={() => setAddTo(g)}><UserPlus /> Alunos</Button>
                    <Button variant="outline" size="sm" disabled={busy === g.id} onClick={() => rotate(g)}>
                      {busy === g.id ? <Loader2 className="animate-spin" /> : <KeyRound />} Rotacionar
                    </Button>
                    <Button variant="outline" size="sm" disabled={busy === g.id} onClick={() => toggleActive(g)}>
                      <Power /> {g.active ? 'Desativar' : 'Ativar'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {importOpen && <ImportRosterDialog onClose={() => setImportOpen(false)} onDone={() => { setImportOpen(false); reload(); }} />}
      {createOpen && <CreateGroupDialog onClose={() => setCreateOpen(false)} onCreated={(name, key) => { setCreateOpen(false); setRevealed({ title: `Chave de ${name}`, key }); reload(); }} />}
      {addTo && <AddStudentsDialog group={addTo} onClose={() => setAddTo(null)} onDone={() => { setAddTo(null); reload(); }} />}
      {revealed && <RevealKeyDialog title={revealed.title} apiKey={revealed.key} onClose={() => setRevealed(null)} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted/60 py-1.5">
      <div className="font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------- Criar grupo
function CreateGroupDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (name: string, key: string) => void }) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>('manual');
  const [students, setStudents] = useState<NewStudent[]>([{ rm: '', name: '' }]);
  const [bulk, setBulk] = useState<NewStudent[]>([]);
  const [saving, setSaving] = useState(false);

  const setStudent = (i: number, patch: Partial<NewStudent>) => setStudents((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));
  const addRow = () => setStudents((s) => [...s, { rm: '', name: '' }]);
  const removeRow = (i: number) => setStudents((s) => s.filter((_, idx) => idx !== i));

  async function save() {
    setSaving(true);
    try {
      const clean = mode === 'bulk' ? bulk : students.map((s) => ({ rm: s.rm.trim(), name: s.name.trim() })).filter((s) => s.rm && s.name);
      const res = await api.groups.create(name.trim(), clean);
      toast.success(`Grupo criado com ${clean.length} aluno(s)`);
      onCreated(res.name, res.apiKey);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Falha ao criar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo grupo</DialogTitle>
          <DialogDescription>Gera a API key do grupo (mostrada uma única vez) e cadastra os RMs. A senha inicial de cada aluno é o próprio RM.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gname">Nome do grupo</Label>
            <Input id="gname" placeholder="Grupo 1 · Tema livre" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label>Alunos</Label>
            <ModeToggle mode={mode} onChange={setMode} />
            {mode === 'manual' ? (
              <div className="space-y-2">
                {students.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <Input placeholder="RM550001" value={s.rm} onChange={(e) => setStudent(i, { rm: e.target.value })} className="w-32" />
                    <Input placeholder="Nome do aluno" value={s.name} onChange={(e) => setStudent(i, { name: e.target.value })} />
                    <Button variant="ghost" size="icon" onClick={() => removeRow(i)} disabled={students.length === 1}><Trash2 className="size-4" /></Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addRow}><Plus /> Adicionar aluno</Button>
              </div>
            ) : (
              <StudentsImport onChange={setBulk} />
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !name.trim() || (mode === 'bulk' && bulk.length === 0)}>{saving && <Loader2 className="animate-spin" />} Criar grupo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------- Adicionar alunos
function AddStudentsDialog({ group, onClose, onDone }: { group: Group; onClose: () => void; onDone: () => void }) {
  const [mode, setMode] = useState<Mode>('bulk');
  const [students, setStudents] = useState<NewStudent[]>([{ rm: '', name: '' }]);
  const [bulk, setBulk] = useState<NewStudent[]>([]);
  const [saving, setSaving] = useState(false);
  const setStudent = (i: number, patch: Partial<NewStudent>) => setStudents((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));

  async function save() {
    setSaving(true);
    try {
      const clean = mode === 'bulk' ? bulk : students.map((s) => ({ rm: s.rm.trim(), name: s.name.trim() })).filter((s) => s.rm && s.name);
      if (!clean.length) return onClose();
      await api.groups.addStudents(group.id, clean);
      toast.success(`${clean.length} aluno(s) adicionado(s)`);
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Falha');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar alunos · {group.name}</DialogTitle>
          <DialogDescription>Cada RM é único na turma inteira. A senha inicial é o próprio RM (troca no 1º acesso).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <ModeToggle mode={mode} onChange={setMode} />
          {mode === 'manual' ? (
            <div className="space-y-2">
              {students.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="RM550001" value={s.rm} onChange={(e) => setStudent(i, { rm: e.target.value })} className="w-32" />
                  <Input placeholder="Nome do aluno" value={s.name} onChange={(e) => setStudent(i, { name: e.target.value })} />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setStudents((s) => [...s, { rm: '', name: '' }])}><Plus /> Mais um</Button>
            </div>
          ) : (
            <StudentsImport onChange={setBulk} />
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || (mode === 'bulk' && bulk.length === 0)}>{saving && <Loader2 className="animate-spin" />} Adicionar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------- Revelar chave (1x)
function RevealKeyDialog({ title, apiKey, onClose }: { title: string; apiKey: string; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Copie agora — esta chave <strong>não será mostrada de novo</strong>. Entregue ao grupo.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
          <code className="flex-1 break-all text-sm">{apiKey}</code>
          <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(apiKey); toast.success('Copiada'); }}><Copy className="size-4" /></Button>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Guardei a chave</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
