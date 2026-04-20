import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supa } from '../lib/supabase';

export default function Login() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get('redirect') || '/';
  const [tab,  setTab]  = useState('login');
  const [msg,  setMsg]  = useState({ text: '', type: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supa.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setTab('reset');
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    supa.auth.getSession().then(({ data: { session } }) => {
      if (session && !location.hash.includes('type=recovery')) navigate(redirect);
    });
  }, []);

  const ok  = text => setMsg({ text, type: 'success' });
  const err = text => setMsg({ text, type: 'error' });

  async function doLogin(e) {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(e.target));
    setBusy(true);
    const { error } = await supa.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { err('Erro: ' + error.message); return; }
    ok('Login realizado! Redirecionando…');
    setTimeout(() => navigate(redirect), 800);
  }

  async function doRegister(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    if (f.password !== f.password2) { err('As senhas não coincidem.'); return; }
    if (f.password.length < 8) { err('Senha deve ter ao menos 8 caracteres.'); return; }
    setBusy(true);
    const { error } = await supa.auth.signUp({ email: f.email, password: f.password, options: { data: { full_name: f.name } } });
    setBusy(false);
    if (error) { err('Erro: ' + error.message); return; }
    ok('Conta criada! Verifique seu e-mail para confirmar.');
  }

  async function doForgot(e) {
    e.preventDefault();
    const { email } = Object.fromEntries(new FormData(e.target));
    setBusy(true);
    const { error } = await supa.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/login' });
    setBusy(false);
    if (error) { err('Erro: ' + error.message); return; }
    ok('Link enviado! Verifique sua caixa de entrada.');
  }

  async function doReset(e) {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    if (f.password !== f.password2) { err('As senhas não coincidem.'); return; }
    if (f.password.length < 8) { err('A senha deve ter ao menos 8 caracteres.'); return; }
    setBusy(true);
    const { error } = await supa.auth.updateUser({ password: f.password });
    setBusy(false);
    if (error) { err('Erro: ' + error.message); return; }
    ok('Senha redefinida com sucesso! Redirecionando…');
    setTimeout(() => navigate('/'), 2000);
  }

  async function doGoogle() {
    await supa.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + redirect } });
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-wrap">
          <div className="logo-title">Sobral Cultural</div>
          <div className="logo-sub">{tab === 'reset' ? 'Redefina sua senha' : 'Entre ou crie sua conta'}</div>
        </div>

        {tab !== 'forgot' && tab !== 'reset' && (
          <div className="tabs">
            <button className={`tab${tab === 'login'    ? ' active' : ''}`} onClick={() => { setTab('login');    setMsg({}); }}>Entrar</button>
            <button className={`tab${tab === 'register' ? ' active' : ''}`} onClick={() => { setTab('register'); setMsg({}); }}>Criar Conta</button>
          </div>
        )}

        {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}

        {tab === 'login' && (
          <form onSubmit={doLogin}>
            <div className="fg"><label>E-mail</label><input name="email" type="email" placeholder="seu@email.com" required /></div>
            <div className="fg"><label>Senha</label><input name="password" type="password" placeholder="Sua senha" required /></div>
            <button type="button" className="forgot-link" onClick={() => { setTab('forgot'); setMsg({}); }}>Esqueci minha senha</button>
            <button className="btn-main" disabled={busy}>{busy ? 'Aguarde…' : 'Entrar'}</button>
            <div className="divider">ou continue com</div>
            <button type="button" className="btn-social btn-google" onClick={doGoogle}>
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Continuar com Google
            </button>
          </form>
        )}

        {tab === 'register' && (
          <form onSubmit={doRegister}>
            <div className="fg"><label>Nome Completo</label><input name="name" type="text" placeholder="Seu nome" required /></div>
            <div className="fg"><label>E-mail</label><input name="email" type="email" placeholder="seu@email.com" required /></div>
            <div className="fg"><label>Senha</label><input name="password" type="password" placeholder="Mínimo 8 caracteres" minLength={8} required /></div>
            <div className="fg"><label>Confirmar Senha</label><input name="password2" type="password" placeholder="Repita a senha" required /></div>
            <button className="btn-main" disabled={busy}>{busy ? 'Aguarde…' : 'Criar Conta Gratuita'}</button>
            <div className="divider">ou continue com</div>
            <button type="button" className="btn-social btn-google" onClick={doGoogle}>
              <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
              Registrar com Google
            </button>
          </form>
        )}

        {tab === 'forgot' && (
          <form onSubmit={doForgot}>
            <p style={{ fontSize: 13.5, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
            <div className="fg"><label>E-mail</label><input name="email" type="email" placeholder="seu@email.com" required /></div>
            <button className="btn-main" disabled={busy}>{busy ? 'Aguarde…' : 'Enviar Link de Recuperação'}</button>
            <button type="button" className="btn-main" style={{ marginTop: 10, background: 'transparent', border: '1px solid var(--border)' }} onClick={() => { setTab('login'); setMsg({}); }}>← Voltar ao Login</button>
          </form>
        )}

        {tab === 'reset' && (
          <form onSubmit={doReset}>
            <div className="fg"><label>Nova Senha</label><input name="password" type="password" placeholder="Mínimo 8 caracteres" minLength={8} required /></div>
            <div className="fg"><label>Confirmar Nova Senha</label><input name="password2" type="password" placeholder="Repita a nova senha" required /></div>
            <button className="btn-main" disabled={busy}>{busy ? 'Aguarde…' : 'Salvar Nova Senha'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
