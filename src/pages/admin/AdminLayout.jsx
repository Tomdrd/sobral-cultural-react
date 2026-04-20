import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const NAV = [
  { to: '/admin',        label: 'Dashboard', icon: '📊', exact: true },
  { to: '/admin/spots',  label: 'Pontos',    icon: '📍' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  function isActive(to, exact) {
    return exact ? pathname === to : pathname.startsWith(to);
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sb-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <img src="/logo.png" alt="" style={{ width: 36, height: 36, borderRadius: 9, objectFit: 'contain' }} />
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 15, fontWeight: 800 }}>Sobral Cultural</h1>
              <span style={{ fontSize: 9, color: 'var(--ochre)', letterSpacing: 2, textTransform: 'uppercase' }}>Painel Admin</span>
            </div>
          </div>
        </div>

        <nav className="sb-nav">
          <div className="nav-section">Principal</div>
          {NAV.map(n => (
            <Link key={n.to} to={n.to} className={`nav-btn${isActive(n.to, n.exact) ? ' active' : ''}`}>
              <span className="icon">{n.icon}</span> {n.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--muted)', padding: '8px 10px', borderRadius: 8, transition: '.15s', textDecoration: 'none' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            🗺 Ver o site
          </Link>
          <button onClick={() => { logout(); navigate('/'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--muted)', padding: '8px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', width: '100%', transition: '.15s', fontFamily: "'DM Sans', sans-serif" }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.06)'}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
            🚪 Sair
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
