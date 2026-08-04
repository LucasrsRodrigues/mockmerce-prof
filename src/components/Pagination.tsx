import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** Rodapé de paginação. Usa page/pageSize/total que o backend já devolve. */
export function Pagination({ page, pageSize, total, onChange, disabled }: {
  page: number; pageSize: number; total: number; onChange: (page: number) => void; disabled?: boolean;
}) {
  if (total === 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-4 border-t px-4 py-3 text-sm text-muted-foreground">
      <span><span className="font-medium text-foreground">{from}–{to}</span> de {total}</span>
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline">Página {page} de {pages}</span>
        <Button variant="outline" size="icon" className="size-8" disabled={disabled || page <= 1} onClick={() => onChange(page - 1)} title="Anterior">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="icon" className="size-8" disabled={disabled || page >= pages} onClick={() => onChange(page + 1)} title="Próxima">
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
