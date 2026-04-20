import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav({ auth }) {
  const { user } = auth;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const a = (p) => pathname === p ? ' active' : '';

  return (
    <nav className="bnav">
      <Link to="/"      className={`bnav-item${a('/')}`}>      <span className="bnav-ico">🗺</span><span>Mapa</span></Link>
      <Link to="/sobre" className={`bnav-item${a('/sobre')}`}> <span className="bnav-ico">ℹ</span><span>Sobre</span></Link>
      <Link to="/contato" className={`bnav-item${a('/contato')}`}><span className="bnav-ico">✉</span><span>Contato</span></Link>
      <div className="bnav-item" onClick={() => navigate(user ? '/perfil' : '/login')} style={{ cursor: 'pointer' }}>
        <span className="bnav-ico">👤</span>
        <span>{user ? (user.user_metadata?.full_name?.split(' ')[0] || 'Perfil') : 'Entrar'}</span>
      </div>
    </nav>
  );
}
