# Loja FIAP · Admin do Professor (control plane)

Painel web do **professor** — a "última ponta" do projeto. É o *control plane* da turma:
cria grupos e suas API keys, mostra **quem realmente integrou** (por grupo e por RM),
inspeciona os logs de requisições, acompanha as missões da turma e gerencia operadores.

É a pasta irmã de [`aluno-admin-web`](../aluno-admin-web) (o painel que os **alunos** usam
para gerenciar a loja) e consome o mesmo backend em [`../Backend`](../Backend), mas só as
rotas `/admin/*`.

## Stack
Vite + React + TypeScript + Tailwind + shadcn/ui (mesma base do painel do aluno).
Tema **índigo** para distinguir visualmente do verde do painel do aluno.

## Como rodar
```bash
# 1) backend em pé (porta 3333)
cd ../Backend && npm run dev

# 2) este painel
npm install
npm run dev   # http://localhost:5174
```
O Vite faz proxy de `/api` → `http://localhost:3333` (sem CORS, sem expor a URL).

## Autenticação (duas formas)
- **Operador** — e-mail + senha → token Bearer de 12h, com papel RBAC (`ADMIN` / `MONITOR` /
  `VIEWER`). É o acesso do dia a dia.
- **Token mestre** — cole o `ADMIN_TOKEN` do backend (header `X-Admin-Token`). É o *god-mode*
  usado no **primeiro acesso** para criar o primeiro operador.

O RBAC é aplicado no **backend** (deny-by-default); a UI apenas esconde os botões que o papel
não pode usar.

## Páginas
| Rota | O quê | Rotas do backend |
|------|-------|------------------|
| `/` Grupos | criar grupo + alunos, rotacionar chave, ativar/desativar, add alunos | `GET/POST /admin/groups`, `POST /admin/groups/:id/rotate-key`, `PATCH /admin/groups/:id`, `POST /admin/groups/:id/students` |
| `/participacao` | requisições por grupo e por RM (quem trabalhou) | `GET /admin/activity` |
| `/logs` | log bruto de requisições, com filtros e paginação | `GET /admin/logs` |
| `/turma` | XP/nota por grupo e por aluno, ranking, missões, reavaliar | `GET /admin/teaching/class`, `/ranking`, `/groups/:id`, `POST /admin/teaching/evaluate` |
| `/operadores` | listar/criar operadores (só `ADMIN`) | `GET/POST /admin/operators` |
| `/auditoria` | trilha de ações sensíveis | `GET /admin/audit` |
# mockmerce-prof
