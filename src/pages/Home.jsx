import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, MapPin, Clock, Ticket, Ruler, Heart, Check, Calendar, Navigation, X } from 'lucide-react';
import { useSpots }     from '../hooks/useSpots';
import { useAuth }      from '../hooks/useAuth';
import { useReactions } from '../hooks/useReactions';
import { CAT_LABELS, CATS } from '../lib/supabase';

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
      {[0,1,2].map(i => <div key={i} style={{ height: 32, width: 72, borderRadius: 8, background: 'rgba(245,237,216,.15)' }} />)}
    </div>
  );

  const rxns = [
    { type: 'like',  label: 'Gostei', Icon: Heart,    cls: 'active-like'  },
    { type: 'been',  label: 'Eu Fui', Icon: Check,    cls: 'active-been'  },
    { type: 'going', label: 'Eu Vou', Icon: Calendar, cls: 'active-going' },
  ];

  return (
    <div className="rxn-btns">
      {rxns.map(({ type, label, Icon, cls }) => {
        const mine = reactions.myReactionFor(spot.id, type);
        return (
          <button key={type} className={`rxn-btn${mine ? ' ' + cls : ''}`}
            onClick={() => reactions.toggle(spot.id, type).then(() => reactions.getCountsFor(spot.id).then(setCounts))}>
            <Icon size={13} /> <span>{label}</span>
            {counts[type] > 0 && <span className="rxn-count">{counts[type]}</span>}
          </button>
        );
      })}
    </div>
  );
}

function haversine(a, b, c, e) {
  const R = 6371e3, dL = (c-a)*Math.PI/180, dN = (e-b)*Math.PI/180,
    x = Math.sin(dL/2)**2 + Math.cos(a*Math.PI/180)*Math.cos(c*Math.PI/180)*Math.sin(dN/2)**2;
  return R*2*Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}
function fmtDist(m) { return m < 1000 ? `${Math.round(m)}m` : `${(m/1e3).toFixed(1)}km`; }

export default function Home() {
  const { spots, loading, error } = useSpots();
  const { user }   = useAuth();
  const reactions  = useReactions(user);
  const navigate   = useNavigate();

  const [cat,      setCat]      = useState('todos');
  const [query,    setQuery]    = useState('');
  const [selected, setSelected] = useState(null);
  const [sbOpen,   setSbOpen]   = useState(false);
  const [userPos,  setUserPos]  = useState(null);
  const [locating, setLocating] = useState(false);

  const filtered = spots.filter(s => {
    const catOk = cat === 'todos'   ? true
                : cat === 'eventos' ? s.type === 'event'
                : s.cat === cat && s.type !== 'event';
    return catOk && s.name.toLowerCase().includes(query.toLowerCase());
  });

  const sorted = userPos
    ? [...filtered].sort((a, b) => haversine(userPos.lat, userPos.lng, a.lat, a.lng) - haversine(userPos.lat, userPos.lng, b.lat, b.lng))
    : filtered;

  function geolocate() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(p => {
      setUserPos({ lat: p.coords.latitude, lng: p.coords.longitude });
      setLocating(false);
    }, () => setLocating(false), { timeout: 10000, enableHighAccuracy: true });
  }

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
      {sbOpen && <div className="sb-back" onClick={() => setSbOpen(false)} />}
      <div className={`sidebar${sbOpen ? ' mob-open' : ''}`}>
        <div className="sb-hd">
          <h2>Pontos Turísticos</h2>
          <input className="sbox" placeholder="Buscar ponto turístico…" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="fps">
          {CATS.map(c => (
            <div key={c} className={`pill${cat === c ? ' active' : ''}`} data-cat={c} onClick={() => setCat(c)}>
              {CAT_LABELS[c]}
            </div>
          ))}
        </div>
        <div className="spl">
          {sorted.length === 0
            ? <div className="no-res">Nenhum ponto encontrado</div>
            : sorted.map(s => (
              <div key={s.id} className={`sc${selected?.id === s.id ? ' active' : ''}`}
                onClick={() => { setSelected(s); setSbOpen(false); }}>
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
                  {userPos && (
                    <div className="sc-dist">{fmtDist(haversine(userPos.lat, userPos.lng, s.lat, s.lng))}</div>
                  )}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <MapContainer center={[-3.688, -40.3497]} zoom={14} style={{ flex: 1 }}>
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© OSM © CARTO" maxZoom={19} subdomains="abcd" />
          {sorted.map(s => (
            <Marker key={s.id} position={[s.lat, s.lng]} icon={makeIcon(s.color, selected?.id === s.id)}
              eventHandlers={{ click: () => setSelected(s) }}>
              <Popup maxWidth={210}>
                <div className="pp-title">{s.name}</div>
                <div className="pp-sub">{CAT_LABELS[s.cat] || s.cat}</div>
                <button className="pp-btn" onClick={() => setSelected(s)}>Ver detalhes</button>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Botão geolocalização */}
        <button
          onClick={geolocate}
          className={`btn-geo${locating ? ' locating' : ''}`}
          style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}
        >
          <Navigation size={14} />
          {locating ? 'Localizando…' : 'Localização'}
        </button>

        {/* Status bar */}
        <div className="stbar" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <span><MapPin size={11} /> <strong>{sorted.length}</strong> pontos</span>
          <span><MapPin size={11} /> Sobral, CE</span>
          {userPos && <span><Navigation size={11} /> <strong>Localizado</strong></span>}
        </div>

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
                  <button className="btn-xd" onClick={() => setSelected(null)}><X size={14} /></button>
                </div>
                <div className="dp-desc">{selected.desc}</div>
                <div className="dp-meta">
                  {selected.address && <span><MapPin size={11} /> <strong>{selected.address}</strong></span>}
                  {selected.horario  && <span><Clock   size={11} /> <strong>{selected.horario}</strong></span>}
                  {selected.entrada  && <span><Ticket  size={11} /> <strong>{selected.entrada}</strong></span>}
                  {userPos && <span><Ruler size={11} /> <strong>{fmtDist(haversine(userPos.lat, userPos.lng, selected.lat, selected.lng))}</strong></span>}
                </div>
                <div className="dp-acts">
                  <button className="btn-blog" onClick={() => navigate(`/post/${selected.id}`)}>
                    <FileText size={14} /> Ver Post
                  </button>
                  <button className="btn-blog btn-blog-ghost" onClick={() => navigate('/submeter')}>
                    <Plus size={14} /> Sugerir
                  </button>
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
