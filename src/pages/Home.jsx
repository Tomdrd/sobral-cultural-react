import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { useSpots }    from '../hooks/useSpots';
import { useAuth }     from '../hooks/useAuth';
import { useReactions } from '../hooks/useReactions';
import { CAT_LABELS, CATS } from '../lib/supabase';

// Corrige ícone padrão Leaflet + Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function makeIcon(color, active = false) {
  const z = active ? 50 : 42;
  return L.divIcon({
    html: `<div style="width:${z}px;height:${z}px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(0,0,0,.5)${active ? ',0 0 0 3px rgba(200,135,26,.9)' : ''};border:2px solid rgba(255,255,255,.3)"><div style="width:${active ? 10 : 8}px;height:${active ? 10 : 8}px;background:rgba(255,255,255,.9);border-radius:50%;transform:rotate(45deg)"></div></div>`,
    className: '', iconSize: [z, z], iconAnchor: [z / 2, z], popupAnchor: [0, -z],
  });
}

function ReactionBtns({ spot, user, reactions }) {
  const [counts, setCounts] = useState(null);

  useState(() => {
    reactions.getCountsFor(spot.id).then(setCounts);
  }, [spot.id]);

  if (!user) return (
    <div style={{ fontSize: 11.5, color: 'rgba(245,237,216,.4)', marginTop: 10 }}>
      <a href="/login" style={{ color: 'var(--ochre)' }}>Entre</a> para curtir e marcar pontos
    </div>
  );

  if (!counts) return (
    <div className="rxn-btns" style={{ opacity: .35, pointerEvents: 'none' }}>
      {['','',''].map((_, i) => <div key={i} style={{ height: 32, width: 72, borderRadius: 8, background: 'rgba(245,237,216,.15)' }} />)}
    </div>
  );

  const rxns = [
    { type: 'like',  label: 'Gostei', icon: '♥', cls: 'active-like'  },
    { type: 'been',  label: 'Eu Fui', icon: '✓', cls: 'active-been'  },
    { type: 'going', label: 'Eu Vou', icon: '📅', cls: 'active-going' },
  ];

  return (
    <div className="rxn-btns">
      {rxns.map(({ type, label, icon, cls }) => {
        const mine = reactions.myReactionFor(spot.id, type);
        return (
          <button
            key={type}
            className={`rxn-btn${mine ? ' ' + cls : ''}`}
            onClick={() => reactions.toggle(spot.id, type).then(() => reactions.getCountsFor(spot.id).then(setCounts))}
          >
            {icon} <span>{label}</span>
            {counts[type] > 0 && <span className="rxn-count">{counts[type]}</span>}
          </button>
        );
      })}
    </div>
  );
}

export default function Home() {
  const { spots, loading, error } = useSpots();
  const { user }   = useAuth();
  const reactions  = useReactions(user);
  const navigate   = useNavigate();

  const [cat,      setCat]      = useState('todos');
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);
  const [sbOpen,   setSbOpen]   = useState(false);

  const filtered = spots.filter(s => {
    const catOk = cat === 'todos'   ? true
                : cat === 'eventos' ? s.type === 'event'
                : s.cat === cat && s.type !== 'event';
    return catOk && s.name.toLowerCase().includes(query.toLowerCase());
  });

  if (loading) return (
    <div className="loading-screen">
      <div className="lt">Sobral Cultural</div>
      <div className="ls">Ceará · Brasil</div>
      <div className="lsp" />
    </div>
  );

  if (error) return (
    <div className="loading-screen">
      <div className="lt">Sobral Cultural</div>
      <p style={{ color: '#e55', fontSize: 13, textAlign: 'center', maxWidth: 260, lineHeight: 1.5 }}>
        Não foi possível carregar os dados. Verifique sua conexão e recarregue a página.
      </p>
    </div>
  );

  return (
    <div className="app-body">
      {/* Sidebar */}
      {sbOpen && <div className="sb-back" onClick={() => setSbOpen(false)} />}
      <div className={`sidebar${sbOpen ? ' mob-open' : ''}`}>
        <div className="sb-hd">
          <h2>Pontos Turísticos</h2>
          <input
            className="sbox"
            placeholder="Buscar ponto turístico…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <div className="fps">
          {CATS.map(c => (
            <div
              key={c}
              className={`pill${cat === c ? ' active' : ''}`}
              data-cat={c}
              onClick={() => setCat(c)}
            >
              {CAT_LABELS[c]}
            </div>
          ))}
        </div>
        <div className="spl">
          {filtered.length === 0
            ? <div className="no-res">Nenhum ponto encontrado</div>
            : filtered.map(s => (
              <div
                key={s.id}
                className={`sc${selected?.id === s.id ? ' active' : ''}`}
                onClick={() => { setSelected(s); setSbOpen(false); }}
              >
                <div className="sc-thumb" style={{ background: s.color + '22' }}>
                  {s.photo
                    ? <img src={s.photo} alt={s.name} loading="lazy" />
                    : <div className="sc-ph" style={{ background: s.color + '22', color: s.color }}>{s.name.charAt(0)}</div>
                  }
                </div>
                <div className="sc-body">
                  <div className="sc-info">
                    <div className="sc-name">{s.name}</div>
                    <div className="sc-tag">{CAT_LABELS[s.cat] || s.cat}</div>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Mapa + Detail */}
      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <MapContainer center={[-3.688, -40.3497]} zoom={14} style={{ flex: 1 }}>
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="© OSM © CARTO" maxZoom={19} subdomains="abcd"
          />
          {filtered.map(s => (
            <Marker
              key={s.id}
              position={[s.lat, s.lng]}
              icon={makeIcon(s.color, selected?.id === s.id)}
              eventHandlers={{ click: () => setSelected(s) }}
            >
              <Popup maxWidth={210}>
                <div className="pp-title">{s.name}</div>
                <div className="pp-sub">{CAT_LABELS[s.cat] || s.cat}</div>
                <button className="pp-btn" onClick={() => setSelected(s)}>Ver detalhes</button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Detail panel */}
        <div className={`dp${selected ? ' open' : ''}`}>
          {selected && (
            <div className="dp-inner">
              <div className="dp-photo">
                {selected.photo
                  ? <img src={selected.photo} alt={selected.name} />
                  : <div className="dp-ph" style={{ background: selected.color + '22', color: selected.color }}>{selected.name.charAt(0)}</div>
                }
              </div>
              <div className="dp-body">
                <div className="dp-hdr">
                  <div>
                    <div className="dp-title">{selected.name}</div>
                    <div className="dp-cat" style={{ background: selected.color + '33', color: selected.color, border: `1px solid ${selected.color}66` }}>
                      {CAT_LABELS[selected.cat] || selected.cat}
                    </div>
                  </div>
                  <button className="btn-xd" onClick={() => setSelected(null)}>✕</button>
                </div>
                <div className="dp-desc">{selected.desc}</div>
                <div className="dp-meta">
                  {selected.address && <span>📍 <strong>{selected.address}</strong></span>}
                  {selected.horario  && <span>🕐 <strong>{selected.horario}</strong></span>}
                  {selected.entrada  && <span>🎟 <strong>{selected.entrada}</strong></span>}
                </div>
                <div className="dp-acts">
                  <button className="btn-blog" onClick={() => navigate(`/post/${selected.id}`)}>📄 Ver Post</button>
                  <button className="btn-blog btn-blog-ghost" onClick={() => navigate('/submeter')}>➕ Sugerir</button>
                </div>
                <ReactionBtns spot={selected} user={user} reactions={reactions} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
