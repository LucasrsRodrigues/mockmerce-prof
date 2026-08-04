import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Loader2, ShieldCheck } from 'lucide-react';
import { api, ApiError, type OperatorRole } from '@/lib/api';
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

const ROLE_VARIANT: Record<OperatorRole, 'default' | 'warning' | 'muted'> = { ADMIN: 'default', MONITOR: 'warning', VIEWER: 'muted' };
const ROLE_DESC: Record<OperatorRole, string> = {
  ADMIN: 'acesso total (cria grupos, chaves, operadores)',
  MONITOR: 'leitura de grupos, logs, participação, auditoria',
  VIEWER: 'leitura de grupos, logs e participação',
};

export default function Operators() {
  const { can } = useAuth();
  const canWrite = can('operators:write');
  const { data, loading, reload } = useAsync(() => api.operators.list(), []);
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Operadores"
        description="Contas de acesso ao control plane, com papel RBAC (deny-by-default)."
        action={canWrite && <Button onClick={() => setOpen(true)}><Plus /> Novo operador</Button>}
      />

      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>E-mail</TableHead><TableHead>Papel</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.length ? data.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.email}</TableCell>
                    <TableCell><Badge variant={ROLE_VARIANT[o.role]}>{o.role}</Badge></TableCell>
                    <TableCell><Badge variant={o.active ? 'success' : 'muted'}>{o.active ? 'ativo' : 'inativo'}</Badge></TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={3} className="py-10 text-center text-muted-foreground"><ShieldCheck className="mx-auto mb-2 size-7 opacity-40" />Nenhum operador. {canWrite ? 'Crie o primeiro (você está como token mestre).' : ''}</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {open && <CreateDialog onClose={() => setOpen(false)} onDone={() => { setOpen(false); reload(); }} />}
    </div>
  );
}

function CreateDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<OperatorRole>('MONITOR');
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.operators.create(email.trim(), password, role);
      toast.success('Operador criado');
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
          <DialogTitle>Novo operador</DialogTitle>
          <DialogDescription>Senha com no mínimo 8 caracteres. O papel define o que ele pode fazer.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label htmlFor="email">E-mail</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></div>
          <div className="space-y-2"><Label htmlFor="pw">Senha</Label><Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="mín. 8 caracteres" /></div>
          <div className="space-y-2">
            <Label>Papel</Label>
            <div className="grid gap-2">
              {(['ADMIN', 'MONITOR', 'VIEWER'] as OperatorRole[]).map((r) => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors ${role === r ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                  <Badge variant={ROLE_VARIANT[r]}>{r}</Badge>
                  <span className="text-muted-foreground">{ROLE_DESC[r]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || !email.trim() || password.length < 8}>{saving && <Loader2 className="animate-spin" />} Criar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
