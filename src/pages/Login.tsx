import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GraduationCap, Loader2, KeyRound, Mail } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Login() {
  const { loginOperator, loginMaster } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'operator' | 'master'>('operator');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [masterToken, setMasterToken] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'operator') await loginOperator(email, password);
      else await loginMaster(masterToken);
      toast.success('Bem-vindo(a), professor(a)!');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Falha na autenticação');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Lado da marca */}
      <div className="hidden lg:flex flex-col justify-between bg-primary p-12 text-primary-foreground">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <GraduationCap className="size-6" /> Loja FIAP · Professor
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight">Control plane<br />da turma.</h1>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            Crie grupos e chaves, veja quem realmente integrou (por grupo e por RM), inspecione os
            logs de requisições e acompanhe as missões da turma.
          </p>
        </div>
        <p className="text-sm text-primary-foreground/70">2TDSPG · Backend E-commerce da Turma</p>
      </div>

      {/* Formulário */}
      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
          <div className="lg:hidden flex items-center gap-2 font-semibold text-lg text-primary">
            <GraduationCap className="size-6" /> Loja FIAP · Professor
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Entrar</h2>
            <p className="text-sm text-muted-foreground mt-1">Área do professor — acesso restrito.</p>
          </div>

          {/* Alternador de método */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-sm">
            <button type="button" onClick={() => setMode('operator')}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-colors ${mode === 'operator' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
              <Mail className="size-3.5" /> Operador
            </button>
            <button type="button" onClick={() => setMode('master')}
              className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 font-medium transition-colors ${mode === 'master' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
              <KeyRound className="size-3.5" /> Token mestre
            </button>
          </div>

          {mode === 'operator' ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="professor@fiap.com.br" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="master">ADMIN_TOKEN</Label>
              <Input id="master" type="password" placeholder="cole o token mestre do backend" value={masterToken} onChange={(e) => setMasterToken(e.target.value)} autoFocus required />
              <p className="text-xs text-muted-foreground">O <code>ADMIN_TOKEN</code> do backend. Use no primeiro acesso para criar operadores.</p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />} Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}
