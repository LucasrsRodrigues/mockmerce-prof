import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Activity, ScrollText, GraduationCap, ShieldCheck, History, LogOut, GraduationCap as Logo, KeyRound } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true, perm: 'activity:read' },
  { to: '/grupos', label: 'Grupos', icon: Users, perm: 'groups:read' },
  { to: '/participacao', label: 'Participação', icon: Activity, perm: 'activity:read' },
  { to: '/logs', label: 'Logs', icon: ScrollText, perm: 'logs:read' },
  { to: '/turma', label: 'Turma', icon: GraduationCap, perm: 'activity:read' },
  { to: '/operadores', label: 'Operadores', icon: ShieldCheck, perm: 'operators:read' },
  { to: '/auditoria', label: 'Auditoria', icon: History, perm: 'audit:read' },
];

const ROLE_VARIANT = { ADMIN: 'default', MONITOR: 'warning', VIEWER: 'muted' } as const;

export default function AppShell() {
  const { session, logout, can } = useAuth();
  const op = session?.operator;
  const items = NAV.filter((i) => can(i.perm));

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr] bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col border-r bg-background">
        <div className="flex h-14 items-center gap-2 border-b px-5 font-semibold">
          <Logo className="size-5 text-primary" /> Loja FIAP
          <Badge variant="default" className="ml-auto">Professor</Badge>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn('flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground')
              }
            >
              <item.icon className="size-4" /> {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t p-3 text-xs text-muted-foreground space-y-1">
          <div className="flex items-center gap-1.5 text-foreground font-medium">
            {op?.isMaster ? <><KeyRound className="size-3.5" /> Token mestre</> : op?.email}
          </div>
          {op && <Badge variant={ROLE_VARIANT[op.role]} className="text-[10px]">{op.role}</Badge>}
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex flex-col min-w-0">
        <header className="flex h-14 items-center justify-between border-b bg-background px-5">
          <div className="md:hidden flex items-center gap-2 font-semibold"><Logo className="size-5 text-primary" /> Professor</div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-right text-sm leading-tight">
              <div className="font-medium">{op?.isMaster ? 'Token mestre' : op?.email}</div>
              <div className="text-xs text-muted-foreground">Control plane · {op?.role}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={logout} title="Sair"><LogOut className="size-4" /></Button>
          </div>
        </header>
        <main className="flex-1 p-5 md:p-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
