import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

export default function Drawer({ auth }) {
  const { user, isAdmin, logout } = auth;
  const [open, setOpen] = useState(false);

  // sincroniza com o Header via função global
  useEffect(() => {
    window.__setDrawerOpen = setOpen;
  }, []);

  const close = () => setOpen(false);

  if (!open) return null;

  return (
    <>
      <div className="dov" onClick={close} />
      <div className="drw open">
        <div className="drw-inner">
          <div className="drw-sec">Navegação</div>
          <Link to="/"        className="drw-lnk" onClick={close}><span className="drw-ic">🗺</span> Mapa Turístico</Link>
          <Link to="/sobre"   className="drw-lnk" onClick={close}><span className="drw-ic">ℹ</span> Sobre o Projeto</Link>
          <Link to="/contato" className="drw-lnk" onClick={close}><span className="drw-ic">✉</span> Contato</Link>

          {isAdmin && (
            <>
              <div className="drw-sec">Sistema</div>
              <Link to="/admin" className="drw-lnk" onClick={close}><span className="drw-ic">⚙</span> Painel Administrativo</Link>
            </>
          )}

          <div className="drw-sec">Minha Conta</div>
          {user ? (
            <>
              <Link to="/perfil"   className="drw-lnk" onClick={close}><span className="drw-ic">👤</span> Meu Perfil</Link>
              <Link to="/submeter" className="drw-lnk" onClick={close}><span className="drw-ic">➕</span> Sugerir Ponto ou Evento</Link>
              <button className="drw-lnk" onClick={() => { logout(); close(); }}><span className="drw-ic">🚪</span> Sair</button>
            </>
          ) : (
            <Link to="/login" className="drw-lnk" onClick={close}><span className="drw-ic">👤</span> Entrar / Criar Conta</Link>
          )}
        </div>
      </div>
    </>
  );
}
