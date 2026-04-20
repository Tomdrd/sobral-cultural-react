import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supa, mapRow, CAT_LABELS } from '../../lib/supabase';

const COLORS = ['#1B6B6B','#6440B4','#B54A2A','#3C7828','#C8871A','#1A5F8B','#8B2E6B','#2E6B1A','#6B3A1A','#1A3A6B'];
const BUCKET = 'spots-photos';

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

const CATS = Object.entries(CAT_LABELS).filter(([k]) => k !== 'todos' && k !== 'eventos');
const inputStyle = { width: '100%', background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '11px 14px', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, outline: 'none' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--muted)', marginBottom: 5, letterSpacing: .3 };

export default function SpotForm() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isEdit   = Boolean(id);

  const [form, setForm] = useState({
    name: '', cat: 'cultura', color: COLORS[4], type: 'spot',
    lat: '', lng: '', description: '', address: '', horario: '', entrada: '',
    blogTitle: '', blogContent: '', blogAuthor: '', blogDate: '',
    isFeatured: false, eventDate: '', eventEnd: '', existingPhoto: '',
  });
  const [pos,     setPos]     = useState(null);
  const [photo,   setPhoto]   = useState(null);
  const [preview, setPreview] = useState('');
  const [busy,    setBusy]    = useState(false);
  const [errMsg,  setErrMsg]  = useState('');
  const [loading, setLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    supa.from('spots').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) { navigate('/admin/spots'); return; }
      const s = mapRow(data);
      setForm({
        name: s.name, cat: s.cat, color: s.color, type: s.type,
        lat: s.lat, lng: s.lng, description: s.desc || '',
        address: s.address || '', horario: s.horario || '', entrada: s.entrada || '',
        blogTitle: s.blogTitle || '', blogContent: s.blogContent || '',
        blogAuthor: s.blogAuthor || '', blogDate: s.blogDate || '',
        isFeatured: s.isFeatured,
        eventDate: s.eventDate || '', eventEnd: s.eventEnd || '',
        existingPhoto: s.photo || '',
      });
      setPos({ lat: s.lat, lng: s.lng });
      setPreview(s.photo || '');
      setLoading(false);
    });
  }, [id]);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handlePhoto(file) {
    if (!file?.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) { setErrMsg('Imagem muito grande (máx. 5MB).'); return; }
    const compressed = await compressImage(file);
    setPhoto(compressed);
    setPreview(compressed);
  }

  async function uploadPhoto(spotId) {
    if (!photo) return form.existingPhoto;
    const res = await fetch(photo);
    const blob = await res.blob();
    const path = `spots/${spotId}/${Date.now()}.jpg`;
    const { error } = await supa.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: true });
    if (error) return form.existingPhoto;
    const { data } = supa.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim())        { setErrMsg('Informe o nome.'); return; }
    if (!pos)                     { setErrMsg('Marque a localização no mapa.'); return; }
    if (!form.description.trim()) { setErrMsg('Informe a descrição.'); return; }

    setBusy(true); setErrMsg('');
    const spotId   = isEdit ? id : crypto.randomUUID();
    const photoUrl = await uploadPhoto(spotId);

    const row = {
      id: spotId, name: form.name, cat: form.cat, color: form.color,
      type: form.type, lat: parseFloat(form.lat || pos.lat), lng: parseFloat(form.lng || pos.lng),
      description: form.description, address: form.address,
      horario: form.horario, entrada: form.entrada, photo: photoUrl,
      blog_title: form.blogTitle, blog_content: form.blogContent,
      blog_author: form.blogAuthor,
      blog_date: form.blogDate || new Date().toISOString().split('T')[0],
      is_featured: form.isFeatured,
      event_date: form.type === 'event' ? form.eventDate || null : null,
      event_end:  form.type === 'event' ? form.eventEnd  || null : null,
    };

    const { error } = isEdit
      ? await supa.from('spots').update(row).eq('id', id)
      : await supa.from('spots').insert(row);

    setBusy(false);
    if (error) { setErrMsg('Erro ao salvar: ' + error.message); return; }
    navigate('/admin/spots');
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center' }}>Carregando…</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h2>{isEdit ? 'Editar Ponto' : 'Novo Ponto'}</h2>
          <p>{isEdit ? 'Atualize as informações do ponto turístico' : 'Adicione um novo ponto ao mapa'}</p>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit}>

          {/* Tipo */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
            {[['spot','📍 Ponto Turístico'], ['event','📅 Evento']].map(([t, label]) => (
              <button key={t} type="button" onClick={() => set('type', t)} className={`btn${form.type === t ? ' btn-primary' : ' btn-secondary'}`}>{label}</button>
            ))}
          </div>

          {/* Nome + Categoria */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={labelStyle}>Nome *</label><input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required /></div>
            <div>
              <label style={labelStyle}>Categoria *</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.cat} onChange={e => set('cat', e.target.value)}>
                {CATS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>

          {/* Cor */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Cor do marcador</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <div key={c} onClick={() => set('color', c)}
                  style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', outline: form.color === c ? '3px solid white' : 'none', outlineOffset: 2 }} />
              ))}
            </div>
          </div>

          {/* Datas evento */}
          {form.type === 'event' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div><label style={labelStyle}>Data início</label><input type="date" style={inputStyle} value={form.eventDate} onChange={e => set('eventDate', e.target.value)} /></div>
              <div><label style={labelStyle}>Data fim</label><input type="date" style={inputStyle} value={form.eventEnd} onChange={e => set('eventEnd', e.target.value)} /></div>
            </div>
          )}

          {/* Descrição */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Descrição *</label>
            <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} required />
          </div>

          {/* Endereço / Horário / Entrada */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><label style={labelStyle}>Endereço</label><input style={inputStyle} value={form.address} onChange={e => set('address', e.target.value)} /></div>
            <div><label style={labelStyle}>Horário</label><input style={inputStyle} value={form.horario} onChange={e => set('horario', e.target.value)} /></div>
            <div><label style={labelStyle}>Entrada</label><input style={inputStyle} value={form.entrada} onChange={e => set('entrada', e.target.value)} /></div>
          </div>

          {/* Foto */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Foto</label>
            {preview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={preview} alt="" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 10, display: 'block' }} />
                <button type="button" onClick={() => { setPhoto(null); setPreview(''); set('existingPhoto', ''); }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.65)', border: 'none', color: '#fff', borderRadius: 7, padding: '3px 10px', cursor: 'pointer', fontSize: 12 }}>Remover</button>
              </div>
            ) : (
              <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '28px', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                <input type="file" accept="image/*" onChange={e => handlePhoto(e.target.files[0])} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                <div style={{ fontSize: 28, marginBottom: 8, opacity: .5 }}>📷</div>
                <p style={{ fontSize: 13, color: 'var(--muted)' }}>Arraste ou clique para enviar</p>
                <p style={{ fontSize: 11, color: 'rgba(245,237,216,.3)', marginTop: 4 }}>JPG, PNG, WEBP — máx. 5 MB</p>
              </div>
            )}
          </div>

          {/* Mapa */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Localização — clique no mapa *</label>
            {pos && <p style={{ fontSize: 12, color: 'var(--ochre)', marginBottom: 6 }}>📍 {Number(pos.lat).toFixed(6)}, {Number(pos.lng).toFixed(6)}</p>}
            <MapContainer center={pos || [-3.688, -40.3497]} zoom={14} style={{ height: 280, borderRadius: 10, border: '1.5px solid var(--border)' }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="© OSM © CARTO" subdomains="abcd" />
              <MapPicker position={pos} onPick={latlng => { setPos(latlng); set('lat', latlng.lat.toFixed(6)); set('lng', latlng.lng.toFixed(6)); }} />
            </MapContainer>
          </div>

          {/* Blog */}
          <details style={{ marginBottom: 16, background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
            <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, userSelect: 'none' }}>📝 Conteúdo do Post (opcional)</summary>
            <div style={{ display: 'grid', gap: 12, marginTop: 16 }}>
              <div><label style={labelStyle}>Título do Post</label><input style={inputStyle} value={form.blogTitle} onChange={e => set('blogTitle', e.target.value)} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>Autor</label><input style={inputStyle} value={form.blogAuthor} onChange={e => set('blogAuthor', e.target.value)} /></div>
                <div><label style={labelStyle}>Data</label><input type="date" style={inputStyle} value={form.blogDate} onChange={e => set('blogDate', e.target.value)} /></div>
              </div>
              <div><label style={labelStyle}>Conteúdo (HTML ou texto)</label><textarea style={{ ...inputStyle, minHeight: 140, resize: 'vertical' }} value={form.blogContent} onChange={e => set('blogContent', e.target.value)} /></div>
            </div>
          </details>

          {/* Destaque */}
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(200,135,26,.06)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <input type="checkbox" id="featured" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--ochre)', cursor: 'pointer' }} />
            <label htmlFor="featured" style={{ fontSize: 14, cursor: 'pointer' }}>⭐ Exibir no carrossel de destaques</label>
          </div>

          {errMsg && <div style={{ padding: '11px 14px', background: 'rgba(181,74,42,.15)', color: '#e89e7e', borderRadius: 9, fontSize: 13, marginBottom: 16 }}>{errMsg}</div>}

          <div style={{ display: 'flex', gap: 12 }}>
            <button type="submit" className="btn btn-primary" disabled={busy}>{busy ? 'Salvando…' : isEdit ? 'Salvar Alterações' : 'Criar Ponto'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/admin/spots')}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
