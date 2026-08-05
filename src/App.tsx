import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import AppShell from '@/components/layout/AppShell';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Groups from '@/pages/Groups';
import Students from '@/pages/Students';
import GroupDetail from '@/pages/GroupDetail';
import Activity from '@/pages/Activity';
import Logs from '@/pages/Logs';
import Teaching from '@/pages/Teaching';
import Operators from '@/pages/Operators';
import Audit from '@/pages/Audit';

function Protected({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><AppShell /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="grupos" element={<Groups />} />
        <Route path="alunos" element={<Students />} />
        <Route path="grupos/:id" element={<GroupDetail />} />
        <Route path="participacao" element={<Activity />} />
        <Route path="logs" element={<Logs />} />
        <Route path="turma" element={<Teaching />} />
        <Route path="operadores" element={<Operators />} />
        <Route path="auditoria" element={<Audit />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
