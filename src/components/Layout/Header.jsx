import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Map as MapIcon, Info, Mail, Settings, LogOut } from 'lucide-react';

export default function Header({ auth }) {
  const { user, isAdmin, logout } = auth;
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (typeof window !== 'undefined') window.__setDrawerOpen = setDrawerOpen;

  async function handleLogout() { await logout(); navigate('/'); }

  return (
    <header className="header">
      <Link to="/" className="logo">
        <img src="/logo.png" alt="Sobral Cultural" className="logo-img" />
        <div className="tb-logo-text">
          <span className="tb-logo-name">Sobral <em style={{ color: '#ff6600', fontStyle: 'normal' }}>Cultural</em></span>
          <span className="tb-logo-sub">Mapa Turístico</span>
        </div>
      </Link>

      <nav className="hn">
        <Link to="/"        className="nl"><MapIcon size={14} /> Mapa</Link>
        <Link to="/sobre"   className="nl"><Info size={14} /> Sobre</Link>
        <Link to="/contato" className="nl"><Mail size={14} /> Contato</Link>
        {isAdmin && (
          <Link to="/admin" className="nl" style={{ borderColor: 'rgba(200,135,26,.25)' }} title="Admin">
            <Settings size={14} />
          </Link>
        )}
        {user ? (
          <>
            <Link to="/perfil" className="user-chip">
              <div className="uc-av">
                {user.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} alt="" />
                  : (user.user_metadata?.full_name || user.email || '?').charAt(0).toUpperCase()}
              </div>
              <span>{(user.user_metadata?.full_name || user.email || '').split(' ')[0]}</span>
            </Link>
            <button className="nl" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <LogOut size={14} /> Sair
            </button>
          </>
        ) : (
          <Link to="/login" className="btn-login">Entrar</Link>
        )}
      </nav>

      <button className={`hbg${drawerOpen ? ' open' : ''}`} onClick={() => setDrawerOpen(o => !o)} aria-label="Menu">
        <span /><span /><span />
      </button>
    </header>
  );
}
