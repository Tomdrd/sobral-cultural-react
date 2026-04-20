import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Map, Info, Mail, User } from 'lucide-react';

export default function BottomNav({ auth }) {
  const { user } = auth;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const a = (p) => pathname === p ? ' active' : '';

  return (
    <nav className="bnav">
      <Link to="/"       className={`bnav-item${a('/')}`}>       <Map  size={20} className="bnav-ico" /><span>Mapa</span></Link>
      <Link to="/sobre"  className={`bnav-item${a('/sobre')}`}>  <Info size={20} className="bnav-ico" /><span>Sobre</span></Link>
      <Link to="/contato" className={`bnav-item${a('/contato')}`}><Mail size={20} className="bnav-ico" /><span>Contato</span></Link>
      <div className="bnav-item" onClick={() => navigate(user ? '/perfil' : '/login')} style={{ cursor: 'pointer' }}>
        <User size={20} className="bnav-ico" />
        <span>{user ? (user.user_metadata?.full_name?.split(' ')[0] || 'Perfil') : 'Entrar'}</span>
      </div>
    </nav>
  );
}
