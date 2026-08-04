// Cliente da API do CONTROL PLANE (rotas /admin/*). Usa o proxy /api (ver vite.config).
// Duas formas de autenticar o professor:
//   - 'master'   → header X-Admin-Token (o ADMIN_TOKEN do backend; god-mode, faz bootstrap)
//   - 'operator' → header Authorization: Bearer (token de 12h do /admin/login, com papel RBAC)

const AUTH_KEY = 'profadmin.auth';

export type OperatorRole = 'ADMIN' | 'MONITOR' | 'VIEWER';

export interface Session {
  kind: 'master' | 'operator';
  token: string;
  operator: { id: string | null; email: string | null; role: OperatorRole; isMaster: boolean };
}

export const getSession = (): Session | null => {
  const raw = localStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
};
export const setSession = (s: Session | null) =>
  s ? localStorage.setItem(AUTH_KEY, JSON.stringify(s)) : localStorage.removeItem(AUTH_KEY);

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

/** Envia a request com o cabeçalho de auth adequado ao tipo de sessão. Se `session` for
 *  passado explicitamente (login/validação), usa-o; senão pega o da sessão salva. */
async function request<T>(method: string, path: string, body?: unknown, session?: Session | null): Promise<T> {
  const headers: Record<string, string> = {};
  const s = session === undefined ? getSession() : session;
  if (s) {
    if (s.kind === 'master') headers['X-Admin-Token'] = s.token;
    else headers['Authorization'] = `Bearer ${s.token}`;
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`/api${path}`, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (res.status === 401 && !path.startsWith('/admin/login') && session === undefined) {
    setSession(null);
    if (!location.pathname.startsWith('/login')) location.href = '/login';
  }
  if (res.status === 204) return undefined as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = (json as any).error;
    throw new ApiError(res.status, err?.code ?? 'ERROR', err?.message ?? res.statusText);
  }
  return json as T;
}

const qs = (params: Record<string, unknown>) => {
  const s = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => [k, String(v)]),
  ).toString();
  return s ? `?${s}` : '';
};

export const api = {
  auth: {
    // Login de operador → token Bearer + identidade.
    loginOperator: (email: string, password: string) =>
      request<{ token: string; operator: { id: string; email: string; role: OperatorRole } }>(
        'POST',
        '/admin/login',
        { email, password },
        null, // sem sessão salva
      ),
    // Valida um token mestre batendo numa rota admin leve. Lança se inválido.
    validateMaster: (token: string) =>
      request<unknown>('GET', '/admin/missions', undefined, {
        kind: 'master',
        token,
        operator: { id: null, email: null, role: 'ADMIN', isMaster: true },
      }),
  },

  groups: {
    list: () => request<Group[]>('GET', '/admin/groups'),
    create: (name: string, students: NewStudent[]) =>
      request<{ id: string; name: string; apiKey: string; students: { rm: string; name: string }[] }>(
        'POST',
        '/admin/groups',
        { name, students },
      ),
    rotateKey: (id: string) => request<{ id: string; apiKey: string }>('POST', `/admin/groups/${id}/rotate-key`),
    setActive: (id: string, active: boolean) => request<{ id: string; active: boolean }>('PATCH', `/admin/groups/${id}`, { active }),
    addStudents: (id: string, students: NewStudent[]) => request<{ added: number }>('POST', `/admin/groups/${id}/students`, { students }),
  },

  // "Entrar no grupo": inspeção read-only do que cada grupo está fazendo.
  inspect: {
    overview: (id: string) => request<GroupOverview>('GET', `/admin/groups/${id}/overview`),
    products: (id: string, p: Record<string, unknown> = {}) => request<Paginated<InspectProduct>>('GET', `/admin/groups/${id}/products${qs(p)}`),
    orders: (id: string, p: Record<string, unknown> = {}) => request<Paginated<InspectOrder>>('GET', `/admin/groups/${id}/orders${qs(p)}`),
    order: (id: string, orderId: string) => request<InspectOrderDetail>('GET', `/admin/groups/${id}/orders/${orderId}`),
    customers: (id: string, p: Record<string, unknown> = {}) => request<Paginated<InspectCustomer>>('GET', `/admin/groups/${id}/customers${qs(p)}`),
    webhooks: (id: string) => request<InspectWebhook[]>('GET', `/admin/groups/${id}/webhooks`),
  },

  dashboard: (days = 14) => request<ClassDashboard>('GET', `/admin/dashboard${qs({ days })}`),

  activity: (since?: string) => request<Activity>('GET', `/admin/activity${qs({ since })}`),

  logs: (p: Record<string, unknown> = {}) => request<Paginated<LogRow>>('GET', `/admin/logs${qs(p)}`),

  operators: {
    list: () => request<Operator[]>('GET', '/admin/operators'),
    create: (email: string, password: string, role: OperatorRole) =>
      request<Operator>('POST', '/admin/operators', { email, password, role }),
  },

  audit: (p: Record<string, unknown> = {}) => request<Paginated<AuditRow>>('GET', `/admin/audit${qs(p)}`),

  teaching: {
    evaluate: (groupId?: string) => request<{ evaluated: number; groupId?: string }>('POST', '/admin/teaching/evaluate', groupId ? { groupId } : {}),
    class: () => request<ClassView>('GET', '/admin/teaching/class'),
    ranking: () => request<RankingRow[]>('GET', '/admin/teaching/ranking'),
    group: (id: string) => request<GroupDashboard>('GET', `/admin/teaching/groups/${id}`),
    missions: () => request<Mission[]>('GET', '/admin/missions'),
  },
};

// ---- Tipos ----
export interface NewStudent { rm: string; name: string }
export interface Paginated<T> { data: T[]; page: number; pageSize: number; total: number }

export interface Group {
  id: string;
  name: string;
  apiKeyPrefix: string;
  active: boolean;
  createdAt: string;
  students: { rm: string; name: string }[];
  counts: { alunos: number; produtos: number; pedidos: number; clientes: number; requisicoes: number };
}

export interface Activity {
  porGrupo: { groupId: string | null; grupo: string; requisicoes: number; ultimaAtividade: string | null }[];
  porAluno: { rm: string | null; nome: string; grupo: string | null; requisicoes: number; ultimaAtividade: string | null }[];
}

export interface LogRow {
  createdAt: string;
  group: string | null;
  groupId: string | null;
  rm: string | null;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  ip: string | null;
}

export interface Operator { id: string; email: string; role: OperatorRole; active: boolean; createdAt?: string }

export interface AuditRow {
  action: string;
  by: string | null;
  targetType: string | null;
  targetId: string | null;
  groupId: string | null;
  meta: unknown;
  at: string;
}

export interface ClassView {
  porGrupo: { groupId: string; grupo: string; xp: number; nota: number; missoes: number; ativo?: boolean }[];
  porAluno: { rm: string; nome: string; grupo: string | null; xp: number }[];
}

export interface RankingRow { posicao: number; grupo: string; xp: number }

export interface Mission {
  key: string;
  title: string;
  description: string;
  phase: string;
  points: number;
  badgeKey: string | null;
  active: boolean;
  criteria: unknown;
}

export interface ClassDashboard {
  totals: { grupos: number; alunos: number; produtos: number; pedidos: number; clientes: number; requisicoes: number; receitaPaga: number; xp: number };
  groups: { id: string; name: string; active: boolean; alunos: number; produtos: number; pedidos: number; clientes: number; requisicoes: number; receitaPaga: number; xp: number; nota: number; missoes: number }[];
  ordersByStatus: { status: string; count: number }[];
  activityByDay: { date: string; requisicoes: number }[];
  ordersByDay: { date: string; pedidos: number; receita: number }[];
}

export interface GroupOverview {
  id: string;
  name: string;
  apiKeyPrefix: string;
  active: boolean;
  createdAt: string;
  counts: { alunos: number; produtos: number; pedidos: number; clientes: number; requisicoes: number };
  revenuePaid: number;
  xpTotal: number;
  ordersByStatus: { status: string; count: number }[];
  students: { rm: string; name: string; jaAcessou: boolean; requisicoes: number; ultimaAtividade: string | null; xp: number }[];
  recentActivity: { method: string; path: string; statusCode: number; rm: string | null; latencyMs: number; at: string }[];
}
export interface InspectProduct { id: string; name: string; type: string; state: string; brand: string | null; image: string | null; variantsCount: number; priceFrom: number; priceTo: number; stock: number; createdAt: string }
export interface InspectOrder { id: string; status: string; total: number; customer: string; email: string; itens: number; createdAt: string }
export interface InspectCustomer { id: string; name: string; email: string; pedidos: number; createdAt: string }
export interface InspectOrderDetail {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  customer: { id: string; name: string; email: string; document: string | null };
  invoiceNumber: number | null;
  items: { productName: string; variantName: string | null; sku: string; quantity: number; unitPrice: number; lineTotal: number }[];
  payment: { method: string; status: string; amount: number; transactionId: string; at: string } | null;
  timeline: { from: string | null; to: string; actor: string; rm: string | null; note: string | null; at: string }[];
  internalComments: { rm: string | null; body: string; at: string }[];
}
export interface InspectWebhook { id: string; url: string; description: string | null; events: string[]; active: boolean; createdAt: string; deliveries: { total: number; byStatus: Record<string, number> } }

export interface GroupDashboard {
  xp: number;
  nota: number;
  badges: { key: string; name: string; icon: string }[];
  xpPorAluno: { rm: string; nome: string; xp: number }[];
  missoes: {
    cumpridas: number;
    total: number;
    lista: { key: string; title: string; description: string; phase: string; points: number; cumprida: boolean; porRm: string | null }[];
  };
  proximosPassos: string[];
}
