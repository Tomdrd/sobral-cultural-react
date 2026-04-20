import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Header({ auth }) {
  const { user, isAdmin, logout } = auth;
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);

  window.__toggleDrawer = () => setDrawerOpen(o => !o);
  window.__drawerOpen   = drawerOpen;

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <header className="header">
      <Link to="/" className="logo">
        <img src="/logo.png" alt="Sobral Cultural" className="logo-img" />
        <div className="tb-logo-text">
          <span className="tb-logo-name">
            Sobral <em style={{ color: '#ff6600', fontStyle: 'normal' }}>Cultural</em>
          </span>
          <span className="tb-logo-sub">Mapa Turístico</span>
        </div>
      </Link>

      <nav className="hn">
        <Link to="/"        className="nl">Mapa</Link>
        <Link to="/sobre"   className="nl">Sobre</Link>
        <Link to="/contato" className="nl">Contato</Link>
        {isAdmin && (
          <Link to="/admin" className="nl" style={{ borderColor: 'rgba(200,135,26,.25)' }} title="Admin">⚙</Link>
        )}
        {user ? (
          <>
            <Link to="/perfil" className="user-chip">
              <div className="uc-av">
                {user.user_metadata?.avatar_url
                  ? <img src={user.user_metadata.avatar_url} alt="" />
                  : (user.user_metadata?.full_name || user.email || '?').charAt(0).toUpperCase()
                }
              </div>
              <span>{(user.user_metadata?.full_name || user.email || '').split(' ')[0]}</span>
            </Link>
            <button className="nl" onClick={handleLogout}>Sair</button>
          </>
        ) : (
          <Link to="/login" className="btn-login">Entrar</Link>
        )}
      </nav>

      <button
        className={`hbg${drawerOpen ? ' open' : ''}`}
        onClick={() => setDrawerOpen(o => !o)}
        aria-label="Menu"
      >
        <span /><span /><span />
      </button>

      {/* passa estado para o Drawer via evento global */}
      {typeof window !== 'undefined' && (() => {
        window.__drawerOpen = drawerOpen;
        window.__setDrawerOpen = setDrawerOpen;
        return null;
      })()}
    </header>
  );
}
