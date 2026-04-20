import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useOutletContext } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supa, CAT_LABELS } from '../lib/supabase';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function MapPicker({ position, onPick }) {
  useMapEvents({ click: e => onPick(e.latlng) });
  return position ? <Marker position={position} /> : null;
}

async function compressImage(file) {
  return new Promise(res => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(900 / img.width, 1);
        const c = document.createElement('canvas');
        c.width = img.width * ratio; c.height = img.height * ratio;
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.78));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

const inputStyle = { width: '100%', background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--border)', borderRadius: 9, padding: '11px 14px', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, outline: 'none' };
const labelStyle = { display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5 };

export default function Submeter() {
  const { user } = useOutletContext();
  const navigate = useNavigate();

  const [type,    setType]    = useState('spot');
  const [form,    setForm]    = useState({ name: '', cat: 'cultura', address: '', horario: '', entrada: '', description: '', dateStart: '', dateEnd: '' });
  const [pos,     setPos]     = useState(null);
  const [photo,   setPhoto]   = useState(null);
  const [preview, setPreview] = useState('');
  const [terms,   setTerms]   = useState(false);
  const [err,     setErr]     = useState('');
  const [busy,    setBusy]    = useState(false);
  const [sent,    setSent]    = useState(false);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handlePhoto(file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { setErr('Imagem muito grande (máx. 5MB).'); return; }
    const compressed = await compressImage(file);
    setPhoto(compressed);
    setPreview(compressed);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim())                           { setErr('Informe o nome do local ou evento.'); return; }
    if (!form.description.trim() || form.description.length < 20) { setErr('Descrição muito curta (mínimo 20 caracteres).'); return; }
    if (!pos)                                        { setErr('Marque a localização no mapa.'); return; }
    if (!terms)                                      { setErr('Você precisa aceitar os Termos de Uso.'); return; }

    setBusy(true); setErr('');

    let photoUrl = null;
    if (photo) {
      const res = await fetch(photo);
      const blob = await res.blob();
      const path = `submissions/${user.id}/${Date.now()}.jpg`;
      const { data: up } = await supa.storage.from('spots-photos').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (up) {
        const { data: url } = supa.storage.from('spots-photos').getPublicUrl(path);
        photoUrl = url.publicUrl;
      }
    }

    const { error } = await supa.from('submissions').insert({
      user_id: user.id, type, status: 'pending',
      name: form.name, cat: form.cat, color: '#C8871A',
      lat: pos.lat, lng: pos.lng,
      description: form.description, address: form.address,
      horario: form.horario, entrada: form.entrada,
      photo: photoUrl,
      event_date: type === 'event' ? form.dateStart || null : null,
      event_end:  type === 'event' ? form.dateEnd   || null : null,
      terms_agreed: true,
    });

    setBusy(false);
    if (error) { setErr('Erro ao enviar: ' + error.message); return; }
    setSent(true);
  }

  if (sent) return (
    <main style={{ maxWidth: 600, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginBottom: 12 }}>Sugestão enviada!</h1>
      <p style={{ color: 'var(--muted)', lineHeight: 1.7, marginBottom: 28 }}>Obrigado! Sua sugestão foi recebida e será avaliada pela equipe.</p>
      <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--ochre)', color: 'var(--deep)', padding: '10px 22px', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>🗺 Voltar ao Mapa</Link>
    </main>
  );

  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 30, fontWeight: 800, marginBottom: 6 }}>Sugerir Ponto ou Evento</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>Sua sugestão será revisada antes de aparecer no mapa.</p>

      <form onSubmit={handleSubmit}>

        {/* Tipo */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          {[['spot', '📍 Ponto Turístico'], ['event', '📅 Evento']].map(([t, label]) => (
            <button key={t} type="button" onClick={() => setType(t)}
              style={{ padding: '10px 22px', borderRadius: 9, border: '1.5px solid var(--border)', background: type === t ? 'var(--ochre)' : 'transparent', color: type === t ? 'var(--deep)' : 'var(--muted)', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: '.2s', fontFamily: "'DM Sans', sans-serif" }}>
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Nome *</label><input style={inputStyle} placeholder="Nome do local ou evento" value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div>
            <label style={labelStyle}>Categoria *</label>
            <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.cat} onChange={e => set('cat', e.target.value)}>
              {['religioso','cultura','historico','natureza','lazer'].map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
            </select>
          </div>
        </div>

        {type === 'event' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div><label style={labelStyle}>Data de Início *</label><input type="date" style={inputStyle} value={form.dateStart} onChange={e => set('dateStart', e.target.value)} /></div>
            <div><label style={labelStyle}>Data de Fim</label><input type="date" style={inputStyle} value={form.dateEnd} onChange={e => set('dateEnd', e.target.value)} /></div>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Descrição * <span style={{ float: 'right', fontWeight: 400, fontSize: 11 }}>{form.description.length}/400</span></label>
          <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} maxLength={400} placeholder="Descreva o local ou evento em até 400 caracteres" value={form.description} onChange={e => set('description', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Endereço</label><input style={inputStyle} placeholder="Rua, bairro — Sobral" value={form.address} onChange={e => set('address', e.target.value)} /></div>
          <div><label style={labelStyle}>Horário</label><input style={inputStyle} placeholder="Ex: Ter–Dom, 9h–18h" value={form.horario} onChange={e => set('horario', e.target.value)} /></div>
          <div><label style={labelStyle}>Entrada</label><input style={inputStyle} placeholder="Gratuita ou R$ XX" value={form.entrada} onChange={e => set('entrada', e.target.value)} /></div>
        </div>

        {/* Foto */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Foto</label>
          {preview ? (
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img src={preview} alt="" style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 10 }} />
              <button type="button" onClick={() => { setPhoto(null); setPreview(''); }} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,.6)', border: 'none', color: '#fff', borderRadius: 6, padding: '2px 10px', cursor: 'pointer', fontSize: 12 }}>Remover</button>
            </div>
          ) : (
            <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '24px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
              <input type="file" accept="image/*" onChange={e => handlePhoto(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
              <div style={{ fontSize: 24, marginBottom: 6 }}>📷</div>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Arraste ou clique para enviar uma foto</p>
              <p style={{ fontSize: 11, color: 'rgba(245,237,216,.3)', marginTop: 4 }}>JPG, PNG, WEBP — máximo 5 MB</p>
            </div>
          )}
        </div>

        {/* Mapa */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Localização * — clique no mapa para marcar</label>
          {pos && <p style={{ fontSize: 12, color: 'var(--ochre)', marginBottom: 6 }}>📍 {pos.lat.toFixed(6)}, {pos.lng.toFixed(6)}</p>}
          <MapContainer center={[-3.688, -40.3497]} zoom={14} style={{ height: 260, borderRadius: 10 }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© OSM © CARTO" subdomains="abcd" />
            <MapPicker position={pos} onPick={setPos} />
          </MapContainer>
        </div>

        {/* Termos */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20 }}>
          <input type="checkbox" id="termsCk" checked={terms} onChange={e => setTerms(e.target.checked)} style={{ marginTop: 2, accentColor: 'var(--ochre)', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }} />
          <label htmlFor="termsCk" style={{ fontSize: 13, color: 'var(--muted)', cursor: 'pointer', lineHeight: 1.5 }}>
            Li e concordo com os <Link to="/termos" target="_blank" style={{ color: 'var(--ochre)' }}>Termos de Uso</Link>. Confirmo que as informações são verdadeiras e tenho direito às imagens enviadas.
          </label>
        </div>

        {err && <div style={{ padding: '10px 14px', background: 'rgba(181,74,42,.15)', color: '#e89e7e', borderRadius: 9, fontSize: 13, marginBottom: 16 }}>{err}</div>}

        <button type="submit" disabled={busy}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--ochre)', color: 'var(--deep)', border: 'none', padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .7 : 1 }}>
          {busy ? 'Enviando…' : '📤 Enviar para Aprovação'}
        </button>
      </form>
    </main>
  );
}
