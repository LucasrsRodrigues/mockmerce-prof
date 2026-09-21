import { Link } from 'react-router-dom';
import { AlertTriangle, BellRing, CheckCircle2, RefreshCw, Smartphone, XCircle } from 'lucide-react';
import { api, type EstadoPush, type PushReadiness } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * A pergunta que esta tela responde é uma só: quem da turma consegue receber
 * push hoje? Não basta ter credencial — sem aparelho registrado não chega
 * nada, e vice-versa. Por isso o estado combina os dois lados.
 */
const ESTADOS: Record<EstadoPush, { rotulo: string; variante: 'success' | 'destructive' | 'warning' | 'muted'; dica: string }> = {
  pronto: { rotulo: 'pronto', variante: 'success', dica: 'credencial aceita e aparelho registrado' },
  'credencial-recusada': { rotulo: 'credencial recusada', variante: 'destructive', dica: 'o Google não aceitou a chave — os envios vão falhar' },
  'sem-aparelho': { rotulo: 'sem aparelho', variante: 'warning', dica: 'credencial ok, mas ninguém instalou o development build' },
  'sem-credencial': { rotulo: 'sem credencial', variante: 'muted', dica: 'ainda não enviou a chave do Firebase no painel' },
};

const dataHora = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default function Push() {
  const { data, loading, reload } = useAsync(() => api.pushReadiness(), []);
  const linhas = data ?? [];

  const contagem = (e: EstadoPush) => linhas.filter((l) => l.estado === e).length;

  return (
    <div>
      <PageHeader
        title="Prontidão de push"
        description="Quem da turma consegue receber notificação. Um grupo só está pronto com os dois lados: a credencial do Firebase aceita pelo Google e pelo menos um aparelho registrado."
        action={<Button variant="outline" onClick={reload}><RefreshCw className="size-4" /> Atualizar</Button>}
      />

      {loading && <Skeleton className="h-64 w-full rounded-lg" />}

      {!loading && (
        <>
          <div className="mb-4 grid gap-3 sm:grid-cols-4">
            <Resumo titulo="Prontos" valor={contagem('pronto')} total={linhas.length} icone={<CheckCircle2 className="size-4 text-emerald-600" />} />
            <Resumo titulo="Sem aparelho" valor={contagem('sem-aparelho')} total={linhas.length} icone={<Smartphone className="size-4 text-amber-600" />} />
            <Resumo titulo="Credencial recusada" valor={contagem('credencial-recusada')} total={linhas.length} icone={<XCircle className="size-4 text-destructive" />} />
            <Resumo titulo="Sem credencial" valor={contagem('sem-credencial')} total={linhas.length} icone={<AlertTriangle className="size-4 text-muted-foreground" />} />
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Projeto Firebase</TableHead>
                    <TableHead className="text-right">Aparelhos</TableHead>
                    <TableHead className="text-right">Envios</TableHead>
                    <TableHead>Último envio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {linhas.map((l) => (
                    <Linha key={l.groupId} l={l} />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {linhas.length === 0 && (
            <div className="py-14 text-center text-sm text-muted-foreground">
              <BellRing className="mx-auto mb-2 size-8 opacity-40" />
              Nenhum grupo ativo.
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Resumo({ titulo, valor, total, icone }: { titulo: string; valor: number; total: number; icone: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icone} {titulo}</div>
        <div className="mt-1 text-2xl font-semibold">
          {valor}
          <span className="ml-1 text-sm font-normal text-muted-foreground">/ {total}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Linha({ l }: { l: PushReadiness }) {
  const estado = ESTADOS[l.estado];
  const falhas = l.envios.porStatus.FAILED ?? 0;

  return (
    <TableRow>
      <TableCell>
        <Link to={`/grupos/${l.groupId}`} className="font-medium hover:underline">{l.name}</Link>
      </TableCell>
      <TableCell>
        <Badge variant={estado.variante} title={estado.dica}>{estado.rotulo}</Badge>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {l.credencial ? (
          <>
            <div className="font-mono">{l.credencial.projectId}</div>
            {/* A mensagem do Google explica a recusa melhor do que qualquer texto nosso. */}
            {l.credencial.ok === false && l.credencial.mensagem && (
              <div className="mt-0.5 text-destructive">{l.credencial.mensagem.slice(0, 90)}</div>
            )}
          </>
        ) : (
          <span className="opacity-60">usando a do servidor</span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        {l.aparelhos.ativos}
        {l.aparelhos.inativos > 0 && (
          <span className="ml-1 text-xs text-muted-foreground">
            +{l.aparelhos.inativos} {l.aparelhos.inativos === 1 ? 'inativo' : 'inativos'}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right tabular-nums">
        <div>{l.envios.total}</div>
        {falhas > 0 && (
          <div className="text-xs text-destructive">{falhas === 1 ? '1 falha' : `${falhas} falhas`}</div>
        )}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {l.envios.ultimoEm ? dataHora(l.envios.ultimoEm) : '—'}
      </TableCell>
    </TableRow>
  );
}
