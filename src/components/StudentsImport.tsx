import { useMemo, useRef, useState } from 'react';
import { Upload, AlertTriangle, Users } from 'lucide-react';
import { parseStudentList } from '@/lib/students';
import type { NewStudent } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const PLACEHOLDER = `RM550001, Ana Souza
RM550002, Bruno Lima
RM550003; Carla Dias
RM550004  Diego Alves`;

/**
 * Importador em massa de alunos: cola a lista (ou sobe .csv), vê o preview e os RMs
 * detectados. Chama onChange com os alunos parseados sempre que o texto muda.
 */
export function StudentsImport({ onChange }: { onChange: (students: NewStudent[]) => void }) {
  const [text, setText] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const { students, warnings } = useMemo(() => parseStudentList(text), [text]);

  // Reporta para o pai a cada mudança de parse (evita setState no render do pai).
  const lastKey = useRef('');
  const key = students.map((s) => `${s.rm}:${s.name}`).join('|');
  if (key !== lastKey.current) {
    lastKey.current = key;
    onChange(students);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ''));
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Uma linha por aluno: <code>RM, Nome</code> (vírgula, ; ou espaço).</p>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={onFile} />
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}><Upload /> Subir .csv</Button>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={PLACEHOLDER}
        rows={7}
        className="w-full rounded-md border border-input bg-transparent p-3 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <div className="flex items-center gap-2 text-sm">
        <Badge variant={students.length ? 'success' : 'muted'}><Users className="mr-1 size-3" /> {students.length} aluno(s) detectado(s)</Badge>
        {warnings.length > 0 && <Badge variant="warning"><AlertTriangle className="mr-1 size-3" /> {warnings.length} aviso(s)</Badge>}
      </div>

      {students.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-md border">
          {students.map((s) => (
            <div key={s.rm} className="flex items-center gap-2 border-b px-3 py-1.5 text-sm last:border-0">
              <code className="w-24 shrink-0 text-muted-foreground">{s.rm}</code>
              <span className="truncate">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <ul className="space-y-0.5 text-xs text-amber-600">
          {warnings.map((w, i) => <li key={i}>• {w}</li>)}
        </ul>
      )}
    </div>
  );
}
