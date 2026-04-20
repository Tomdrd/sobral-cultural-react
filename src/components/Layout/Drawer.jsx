import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Map, Info, Mail, Settings, User, Plus, LogOut } from 'lucide-react';

export default function Drawer({ auth }) {
  const { user, isAdmin, logout } = auth;
  const [open, setOpen] = useState(false);

  useEffect(() => { window.__setDrawerOpen = setOpen; }, []);

  const close = () => setOpen(false);

  if (!open) return null;

  return (
    <>
      <div className="dov" onClick={close} />
      <div className="drw open">
        <div className="drw-inner">
          <div className="drw-sec">Navegação</div>
          <Link to="/"        className="drw-lnk" onClick={close}><span className="drw-ic"><Map  size={15} /></span> Mapa Turístico</Link>
          <Link to="/sobre"   className="drw-lnk" onClick={close}><span className="drw-ic"><Info size={15} /></span> Sobre o Projeto</Link>
          <Link to="/contato" className="drw-lnk" onClick={close}><span className="drw-ic"><Mail size={15} /></span> Contato</Link>

          {isAdmin && (
            <>
              <div className="drw-sec">Sistema</div>
              <Link to="/admin" className="drw-lnk" onClick={close}><span className="drw-ic"><Settings size={15} /></span> Painel Administrativo</Link>
            </>
          )}

          <div className="drw-sec">Minha Conta</div>
          {user ? (
            <>
              <Link to="/perfil"   className="drw-lnk" onClick={close}><span className="drw-ic"><User  size={15} /></span> Meu Perfil</Link>
              <Link to="/submeter" className="drw-lnk" onClick={close}><span className="drw-ic"><Plus  size={15} /></span> Sugerir Ponto ou Evento</Link>
              <button className="drw-lnk" onClick={() => { logout(); close(); }}><span className="drw-ic"><LogOut size={15} /></span> Sair</button>
            </>
          ) : (
            <Link to="/login" className="drw-lnk" onClick={close}><span className="drw-ic"><User size={15} /></span> Entrar / Criar Conta</Link>
          )}
        </div>
      </div>
    </>
  );
}
