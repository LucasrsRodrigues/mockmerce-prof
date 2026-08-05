import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { api, ApiError, type NewStudent } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { StudentsImport } from '@/components/StudentsImport';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

/**
 * Importa a turma inteira só com LOGIN (sem grupo). Cada aluno cria/entra na loja
 * depois pelo próprio painel. RMs já cadastrados são ignorados.
 */
export function ImportRosterDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [students, setStudents] = useState<NewStudent[]>([]);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await api.students.import(students);
      const skipped = res.skipped.length;
      toast.success(`${res.created} aluno(s) criado(s)${skipped ? ` · ${skipped} já existia(m)` : ''}`);
      onDone();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Falha ao importar');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar turma</DialogTitle>
          <DialogDescription>
            Cria só o <strong>login</strong> de cada aluno (senha inicial = RM), <strong>sem grupo</strong>. Depois cada aluno
            cria a própria loja e vincula os colegas por RM nas configurações. RMs já cadastrados são ignorados.
          </DialogDescription>
        </DialogHeader>
        <StudentsImport onChange={setStudents} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving || students.length === 0}>{saving && <Loader2 className="animate-spin" />} Importar {students.length || ''} aluno(s)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
