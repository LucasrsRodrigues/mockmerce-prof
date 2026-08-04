import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, getSession, setSession, type OperatorRole, type Session } from './api';

// Espelha o RBAC do backend (admin/rbac.ts) para gating de UI. O backend é a fonte da
// verdade — isto só esconde botões que o operador não pode usar. `*` = tudo.
const PERMISSIONS: Record<OperatorRole, string[]> = {
  ADMIN: ['*'],
  MONITOR: ['groups:read', 'logs:read', 'activity:read', 'audit:read', 'config:read'],
  VIEWER: ['groups:read', 'logs:read', 'activity:read'],
};

interface AuthCtx {
  session: Session | null;
  loginOperator: (email: string, password: string) => Promise<void>;
  loginMaster: (token: string) => Promise<void>;
  logout: () => void;
  can: (permission: string) => boolean;
}

const Ctx = createContext<AuthCtx>(null as any);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSess] = useState<Session | null>(() => getSession());

  const commit = (s: Session) => {
    setSession(s);
    setSess(s);
  };

  const loginOperator = async (email: string, password: string) => {
    const res = await api.auth.loginOperator(email.trim(), password);
    commit({ kind: 'operator', token: res.token, operator: { ...res.operator, isMaster: false } });
  };

  const loginMaster = async (token: string) => {
    await api.auth.validateMaster(token.trim()); // lança se inválido
    commit({ kind: 'master', token: token.trim(), operator: { id: null, email: null, role: 'ADMIN', isMaster: true } });
  };

  const logout = () => {
    setSession(null);
    setSess(null);
  };

  const can = (permission: string) => {
    const role = session?.operator.role;
    if (!role) return false;
    const perms = PERMISSIONS[role] ?? [];
    return perms.includes('*') || perms.includes(permission);
  };

  return <Ctx.Provider value={{ session, loginOperator, loginMaster, logout, can }}>{children}</Ctx.Provider>;
}
