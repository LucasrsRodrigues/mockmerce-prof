import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Package, ShoppingCart, Users, Radio, Webhook, GraduationCap, DollarSign, Zap, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { api, type GroupOverview, type GroupDashboard, type InspectOrderDetail } from '@/lib/api';
import { useAsync } from '@/lib/hooks';
import { cn, money, fmtDateTime, fmtRelative, orderStatusVariant, productStateVariant, httpStatusVariant } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/Pagination';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export default function GroupDetail() {
  const { id = '' } = useParams();
  const { data: ov, loading } = useAsync(() => api.inspect.overview(id), [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link to="/grupos"><ArrowLeft className="size-4" /></Link></Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{ov?.name ?? (loading ? 'Carregando…' : 'Grupo')}</h1>
            {ov && <Badge variant={ov.active ? 'success' : 'muted'}>{ov.active ? 'ativo' : 'inativo'}</Badge>}
          </div>
          {ov && <code className="text-xs text-muted-foreground">{ov.apiKeyPrefix}… · criado {fmtDateTime(ov.createdAt)}</code>}
        </div>
      </div>

      {loading || !ov ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : (
        <>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            <Tile icon={DollarSign} label="Receita paga" value={money(ov.revenuePaid)} accent />
            <Tile icon={Package} label="Produtos" value={ov.counts.produtos} />
            <Tile icon={ShoppingCart} label="Pedidos" value={ov.counts.pedidos} />
            <Tile icon={Users} label="Clientes" value={ov.counts.clientes} />
            <Tile icon={Zap} label="Requisições" value={ov.counts.requisicoes} />
            <Tile icon={GraduationCap} label="XP total" value={ov.xpTotal} />
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="overview">Visão geral</TabsTrigger>
              <TabsTrigger value="activity">Atividade ao vivo</TabsTrigger>
              <TabsTrigger value="products">Catálogo</TabsTrigger>
              <TabsTrigger value="orders">Pedidos</TabsTrigger>
              <TabsTrigger value="customers">Clientes</TabsTrigger>
              <TabsTrigger value="teaching">Ensino</TabsTrigger>
              <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><OverviewTab ov={ov} /></TabsContent>
            <TabsContent value="activity"><LiveActivity groupId={id} /></TabsContent>
            <TabsContent value="products"><ProductsTab groupId={id} /></TabsContent>
            <TabsContent value="orders"><OrdersTab groupId={id} statuses={ov.ordersByStatus.map((s) => s.status)} /></TabsContent>
            <TabsContent value="customers"><CustomersTab groupId={id} /></TabsContent>
            <TabsContent value="teaching"><TeachingTab groupId={id} /></TabsContent>
            <TabsContent value="webhooks"><WebhooksTab groupId={id} /></TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function Tile({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string | number; accent?: boolean }) {
  return (
    <Card className={accent ? 'border-primary/30 bg-primary/5' : ''}>
      <CardContent className="p-4">
        <Icon className={cn('size-4', accent ? 'text-primary' : 'text-muted-foreground')} />
        <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------- VISÃO GERAL
function OverviewTab({ ov }: { ov: GroupOverview }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Alunos do grupo</CardTitle></CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader><TableRow><TableHead>Aluno</TableHead><TableHead>Acesso</TableHead><TableHead className="text-right">Reqs</TableHead><TableHead className="text-right">XP</TableHead><TableHead>Última atividade</TableHead></TableRow></TableHeader>
            <TableBody>
              {ov.students.length ? ov.students.map((s) => (
                <TableRow key={s.rm}>
                  <TableCell><span className="font-medium">{s.name}</span> <code className="ml-1 text-xs text-muted-foreground">{s.rm}</code></TableCell>
                  <TableCell>{s.jaAcessou ? <Badge variant="success">acessou</Badge> : <Badge variant="muted">1º acesso</Badge>}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.requisicoes}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.xp}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtRelative(s.ultimaAtividade)}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum aluno cadastrado.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Pedidos por status</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {ov.ordersByStatus.length ? ov.ordersByStatus.map((s) => (
            <div key={s.status} className="flex items-center justify-between">
              <Badge variant={orderStatusVariant(s.status)}>{s.status}</Badge>
              <span className="tabular-nums font-medium">{s.count}</span>
            </div>
          )) : <p className="text-sm text-muted-foreground">Nenhum pedido.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

// --------------------------------------------------------- ATIVIDADE AO VIVO
function LiveActivity({ groupId }: { groupId: string }) {
  const [live, setLive] = useState(true);
  const [rows, setRows] = useState<import('@/lib/api').LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchRows = async () => {
    try {
      const res = await api.logs({ groupId, pageSize: 30, page: 1 });
      setRows(res.data);
    } catch { /* ignora erro transitório do polling */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchRows();
    if (live) timer.current = setInterval(fetchRows, 4000);
    return () => { if (timer.current) clearInterval(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, groupId]);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Radio className={cn('size-4', live ? 'text-primary animate-pulse' : 'text-muted-foreground')} /> Atividade ao vivo
        </CardTitle>
        <Button variant={live ? 'default' : 'outline'} size="sm" onClick={() => setLive((v) => !v)}>
          {live ? 'Ao vivo (4s)' : 'Pausado'}
        </Button>
      </CardHeader>
      <CardContent className="px-0">
        {loading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}</div>
        ) : (
          <Table>
            <TableHeader><TableRow><TableHead>Quando</TableHead><TableHead>RM</TableHead><TableHead>Método</TableHead><TableHead>Rota</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.length ? rows.map((l, i) => (
                <TableRow key={i}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground" title={fmtDateTime(l.createdAt)}>{fmtRelative(l.createdAt)}</TableCell>
                  <TableCell><code className="text-xs">{l.rm ?? '—'}</code></TableCell>
                  <TableCell><Badge variant="muted" className="font-mono text-[10px]">{l.method}</Badge></TableCell>
                  <TableCell><code className="text-xs">{l.path}</code></TableCell>
                  <TableCell className="text-right"><Badge variant={httpStatusVariant(l.statusCode)}>{l.statusCode}</Badge></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhuma requisição ainda.</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------- CATÁLOGO
function ProductsTab({ groupId }: { groupId: string }) {
  const [page, setPage] = useState(1);
  const { data, loading } = useAsync(() => api.inspect.products(groupId, { page, pageSize: 20 }), [groupId, page]);
  return (
    <Card>
      <CardContent className="px-0">
        {loading ? <TableSkeleton /> : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Tipo</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Preço</TableHead><TableHead className="text-right">Estoque</TableHead><TableHead className="text-right">Variantes</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.data.length ? data.data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}{p.brand && <span className="ml-1 text-xs text-muted-foreground">· {p.brand}</span>}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{p.type}</TableCell>
                    <TableCell><Badge variant={productStateVariant(p.state)}>{p.state}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums">{p.priceFrom === p.priceTo ? money(p.priceFrom) : `${money(p.priceFrom)}–${money(p.priceTo)}`}</TableCell>
                    <TableCell className="text-right tabular-nums">{p.stock}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{p.variantsCount}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={6} className="py-8 text-center text-muted-foreground">Nenhum produto cadastrado.</TableCell></TableRow>}
              </TableBody>
            </Table>
            {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} disabled={loading} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------- PEDIDOS
function OrdersTab({ groupId, statuses }: { groupId: string; statuses: string[] }) {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, loading } = useAsync(() => api.inspect.orders(groupId, { page, pageSize: 20, status: status || undefined }), [groupId, page, status]);
  return (
    <Card>
      <CardContent className="px-0">
        <div className="flex flex-wrap gap-1.5 p-4 pb-2">
          <FilterChip active={!status} onClick={() => { setStatus(''); setPage(1); }}>Todos</FilterChip>
          {statuses.map((s) => <FilterChip key={s} active={status === s} onClick={() => { setStatus(s); setPage(1); }}>{s}</FilterChip>)}
        </div>
        {loading ? <TableSkeleton /> : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Itens</TableHead><TableHead className="text-right">Total</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.data.length ? data.data.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => setOpenId(o.id)}>
                    <TableCell><span className="font-medium">{o.customer}</span><div className="text-xs text-muted-foreground">{o.email}</div></TableCell>
                    <TableCell><Badge variant={orderStatusVariant(o.status)}>{o.status}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{o.itens}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{money(o.total)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDateTime(o.createdAt)}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">Nenhum pedido.</TableCell></TableRow>}
              </TableBody>
            </Table>
            {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} disabled={loading} />}
          </>
        )}
      </CardContent>
      {openId && <OrderDetailDialog groupId={groupId} orderId={openId} onClose={() => setOpenId(null)} />}
    </Card>
  );
}

// ------------------------------------------------------- DETALHE DO PEDIDO
function OrderDetailDialog({ groupId, orderId, onClose }: { groupId: string; orderId: string; onClose: () => void }) {
  const { data, loading } = useAsync<InspectOrderDetail>(() => api.inspect.order(groupId, orderId), [groupId, orderId]);
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Pedido
            {data && <Badge variant={orderStatusVariant(data.status)}>{data.status}</Badge>}
            {data?.invoiceNumber != null && <Badge variant="secondary">NF-e #{data.invoiceNumber}</Badge>}
          </DialogTitle>
          <DialogDescription>
            {data && <>#{data.id} · {fmtDateTime(data.createdAt)}</>}
          </DialogDescription>
        </DialogHeader>
        {loading || !data ? (
          <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : (
          <div className="space-y-5">
            {/* Cliente + pagamento */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border p-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Cliente</div>
                <div className="mt-1 font-medium">{data.customer.name}</div>
                <div className="text-xs text-muted-foreground">{data.customer.email}</div>
                {data.customer.document && <div className="text-xs text-muted-foreground">Doc: {data.customer.document}</div>}
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Pagamento</div>
                {data.payment ? (
                  <>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-medium">{data.payment.method}</span>
                      <Badge variant={data.payment.status === 'APPROVED' ? 'success' : data.payment.status === 'DECLINED' ? 'destructive' : 'warning'}>{data.payment.status}</Badge>
                    </div>
                    <div className="text-sm tabular-nums">{money(data.payment.amount)}</div>
                    <code className="text-[10px] text-muted-foreground">{data.payment.transactionId}</code>
                  </>
                ) : <div className="mt-1 text-sm text-muted-foreground">Sem pagamento registrado.</div>}
              </div>
            </div>

            {/* Itens */}
            <div>
              <div className="mb-2 text-sm font-medium">Itens</div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">Unit.</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.items.map((it, i) => (
                      <TableRow key={i}>
                        <TableCell><span className="font-medium">{it.productName}</span>{it.variantName && <span className="ml-1 text-xs text-muted-foreground">· {it.variantName}</span>}<div><code className="text-[10px] text-muted-foreground">{it.sku}</code></div></TableCell>
                        <TableCell className="text-right tabular-nums">{it.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(it.unitPrice)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{money(it.lineTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between border-t px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Total do pedido</span>
                  <span className="font-semibold tabular-nums">{money(data.total)}</span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <div className="mb-2 text-sm font-medium">Timeline</div>
              {data.timeline.length ? (
                <ol className="relative space-y-3 border-l pl-4">
                  {data.timeline.map((e, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[21px] top-1 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        {e.from && <><Badge variant="muted" className="text-[10px]">{e.from}</Badge><span className="text-muted-foreground">→</span></>}
                        <Badge variant={orderStatusVariant(e.to)} className="text-[10px]">{e.to}</Badge>
                        <span className="text-xs text-muted-foreground">{e.actor}{e.rm ? ` · ${e.rm}` : ''}</span>
                        <span className="ml-auto text-xs text-muted-foreground">{fmtDateTime(e.at)}</span>
                      </div>
                      {e.note && <p className="mt-0.5 text-xs text-muted-foreground">{e.note}</p>}
                    </li>
                  ))}
                </ol>
              ) : <p className="text-sm text-muted-foreground">Sem eventos de transição registrados.</p>}
            </div>

            {/* Comentários internos */}
            {data.internalComments.length > 0 && (
              <div>
                <div className="mb-2 text-sm font-medium">Comentários internos</div>
                <div className="space-y-2">
                  {data.internalComments.map((c, i) => (
                    <div key={i} className="rounded-md bg-muted/50 p-2.5 text-sm">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><code>{c.rm ?? '—'}</code><span>{fmtDateTime(c.at)}</span></div>
                      <p className="mt-0.5">{c.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------- CLIENTES
function CustomersTab({ groupId }: { groupId: string }) {
  const [page, setPage] = useState(1);
  const { data, loading } = useAsync(() => api.inspect.customers(groupId, { page, pageSize: 20 }), [groupId, page]);
  return (
    <Card>
      <CardContent className="px-0">
        {loading ? <TableSkeleton /> : (
          <>
            <Table>
              <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead className="text-right">Pedidos</TableHead><TableHead>Cadastro</TableHead></TableRow></TableHeader>
              <TableBody>
                {data?.data.length ? data.data.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.email}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.pedidos}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDateTime(c.createdAt)}</TableCell>
                  </TableRow>
                )) : <TableRow><TableCell colSpan={4} className="py-8 text-center text-muted-foreground">Nenhum cliente final ainda.</TableCell></TableRow>}
              </TableBody>
            </Table>
            {data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={setPage} disabled={loading} />}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ------------------------------------------------------------------ ENSINO
function TeachingTab({ groupId }: { groupId: string }) {
  const { data, loading } = useAsync<GroupDashboard>(() => api.teaching.group(groupId), [groupId]);
  if (loading || !data) return <TableSkeleton />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="text-sm">Nota <strong className="text-lg">{data.nota.toFixed(1)}</strong></div>
        <span className="text-muted-foreground">·</span>
        <div className="text-sm">{data.xp} XP</div>
        <span className="text-muted-foreground">·</span>
        <div className="text-sm">{data.missoes.cumpridas}/{data.missoes.total} missões</div>
        <div className="ml-auto flex flex-wrap gap-1">{data.badges.map((b) => <Badge key={b.key} variant="default">{b.icon} {b.name}</Badge>)}</div>
      </div>
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
    </div>
  );
}

// ---------------------------------------------------------------- WEBHOOKS
function WebhooksTab({ groupId }: { groupId: string }) {
  const { data, loading } = useAsync(() => api.inspect.webhooks(groupId), [groupId]);
  if (loading) return <TableSkeleton />;
  if (!data?.length) return <Card><CardContent className="py-12 text-center text-muted-foreground"><Webhook className="mx-auto mb-3 size-8 opacity-40" />Nenhum webhook registrado por este grupo.</CardContent></Card>;
  return (
    <div className="space-y-3">
      {data.map((w) => (
        <Card key={w.id}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <code className="break-all text-sm">{w.url}</code>
              <Badge variant={w.active ? 'success' : 'muted'}>{w.active ? 'ativo' : 'inativo'}</Badge>
            </div>
            {w.description && <p className="text-xs text-muted-foreground">{w.description}</p>}
            <div className="flex flex-wrap gap-1">{w.events.map((e) => <Badge key={e} variant="secondary" className="text-[10px]">{e}</Badge>)}</div>
            <div className="flex flex-wrap gap-2 pt-1 text-xs text-muted-foreground">
              <span>{w.deliveries.total} entregas</span>
              {Object.entries(w.deliveries.byStatus).map(([s, n]) => <Badge key={s} variant={s === 'DELIVERED' ? 'success' : s === 'FAILED' || s === 'DEAD' ? 'destructive' : 'muted'} className="text-[10px]">{s}: {n}</Badge>)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn('rounded-full border px-3 py-1 text-xs font-medium transition-colors', active ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent')}>
      {children}
    </button>
  );
}

function TableSkeleton() {
  return <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}</div>;
}
