import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supa } from '../lib/supabase';

const ASSUNTOS = [
  'Sugestão de ponto turístico',
  'Correção de informação',
  'Parceria ou colaboração',
  'Imprensa e mídia',
  'Outro assunto',
];

const INFO = [
  { icon: '📍', label: 'Localização',  value: 'Sobral, Ceará — Brasil' },
  { icon: '✉',  label: 'E-mail',       value: 'contato@sobralcultural.com' },
  { icon: '📱', label: 'WhatsApp',     value: '(88) 9 9999-9999' },
  { icon: '🕐', label: 'Atendimento',  value: 'Seg – Sex · 8h às 18h' },
];

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,.06)', border: '1.5px solid var(--border)',
  borderRadius: 9, padding: '11px 14px', color: 'var(--cream)',
  fontFamily: "'DM Sans', sans-serif", fontSize: 13.5, outline: 'none',
};

export default function Contato() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [msg,  setMsg]  = useState({ text: '', type: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim())                    { setMsg({ text: 'Informe seu nome.', type: 'error' }); return; }
    if (!form.email.trim())                   { setMsg({ text: 'Informe seu e-mail.', type: 'error' }); return; }
    if (!form.message.trim() || form.message.length < 20) { setMsg({ text: 'Mensagem muito curta (mínimo 20 caracteres).', type: 'error' }); return; }

    setBusy(true);
    const { error } = await supa.from('contacts').insert({
      name: form.name, email: form.email, phone: form.phone,
      subject: form.subject, message: form.message,
    });
    setBusy(false);

    if (error) { setMsg({ text: 'Erro ao enviar: ' + error.message, type: 'error' }); return; }
    setSent(true);
  }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '40px 20px' }}>
      <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 800, marginBottom: 6 }}>Entre em Contato</h1>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 40 }}>Dúvidas, sugestões ou quer divulgar um ponto turístico? Fale conosco!</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'start' }}>

        {/* Formulário */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, marginBottom: 8 }}>Mensagem enviada!</h2>
              <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 24 }}>
                Obrigado pelo contato. Retornaremos em breve!
              </p>
              <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--ochre)', color: 'var(--deep)', padding: '10px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                🗺 Voltar ao Mapa
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>Envie sua mensagem</h2>

              {msg.text && <div className={`msg ${msg.type}`} style={{ marginBottom: 16 }}>{msg.text}</div>}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Nome *</label>
                  <input style={inputStyle} placeholder="Seu nome completo" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>E-mail *</label>
                  <input style={inputStyle} type="email" placeholder="seu@email.com" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Telefone / WhatsApp</label>
                  <input style={inputStyle} placeholder="(88) 9 9999-9999" value={form.phone} onChange={e => set('phone', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Assunto</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.subject} onChange={e => set('subject', e.target.value)}>
                    <option value="">Selecione um assunto…</option>
                    {ASSUNTOS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Mensagem *</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 120, resize: 'vertical', lineHeight: 1.6 }}
                  placeholder="Escreva sua mensagem aqui…"
                  value={form.message}
                  onChange={e => set('message', e.target.value)}
                />
                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 4 }}>Mínimo de 20 caracteres.</div>
              </div>

              <button
                type="submit"
                disabled={busy}
                style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--ochre)', color: 'var(--deep)', border: 'none', padding: '13px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? .7 : 1 }}
              >
                {busy ? 'Enviando…' : '✉ Enviar Mensagem'}
              </button>
            </form>
          )}
        </div>

        {/* Informações */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {INFO.map(({ icon, label, value }) => (
            <div key={label} style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
              <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 13.5 }}>{value}</div>
            </div>
          ))}

          <div style={{ background: 'rgba(200,135,26,.08)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 18px' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Quer sugerir um ponto?</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 14 }}>
              Conhece um lugar incrível em Sobral que ainda não está no mapa? Nos conte!
            </p>
            <Link to="/submeter" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--ochre)', color: 'var(--deep)', padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              ➕ Sugerir Ponto
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
