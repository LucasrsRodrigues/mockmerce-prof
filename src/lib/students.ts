import type { NewStudent } from './api';

export interface ParseResult {
  students: NewStudent[];
  warnings: string[];
}

const HEADER_RE = /^\s*(rm|matr[ií]cula)\b/i;

/**
 * Faz o parse de uma lista colada / CSV de alunos. Cada linha é `RM<sep>Nome`, onde o
 * separador pode ser vírgula, ponto-e-vírgula, tab ou espaço(s). Ignora linha de cabeçalho
 * ("RM,Nome") e linhas vazias. Deduplica RMs repetidos na própria lista (com aviso).
 */
export function parseStudentList(text: string): ParseResult {
  const warnings: string[] = [];
  const students: NewStudent[] = [];
  const seen = new Set<string>();

  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    if (i === 0 && HEADER_RE.test(raw) && /nome|name/i.test(raw)) continue; // cabeçalho

    // Separa no primeiro delimitador forte; se não houver, no primeiro bloco de espaços.
    let rm: string, name: string;
    const m = raw.match(/^([^,;\t]+)[,;\t]+(.+)$/);
    if (m) {
      rm = m[1].trim();
      name = m[2].trim();
    } else {
      const sp = raw.match(/^(\S+)\s+(.+)$/);
      if (!sp) { warnings.push(`Linha ${i + 1}: sem nome — "${raw}" (ignorada)`); continue; }
      rm = sp[1].trim();
      name = sp[2].trim();
    }

    rm = rm.replace(/\s+/g, '').toUpperCase();
    name = name.replace(/["']/g, '').replace(/,+$/, '').trim();
    if (!rm || !name) { warnings.push(`Linha ${i + 1}: RM ou nome vazio (ignorada)`); continue; }
    if (seen.has(rm)) { warnings.push(`RM ${rm} repetido na lista (mantido o 1º)`); continue; }

    seen.add(rm);
    students.push({ rm, name });
  }

  return { students, warnings };
}
