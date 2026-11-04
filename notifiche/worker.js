/* v5 
 * RifiutiPro · «postino» delle notifiche (Cloudflare Worker, piano gratuito)
 *
 * L'app chiede: «avvisa l'azienda X (o la persona Y) che è arrivata una quotazione».
 * Il postino cerca in Firestore i telefoni registrati per quell'azienda (collezione «push»)
 * e manda la notifica con Firebase Cloud Messaging.
 *
 * Segreto da impostare in Cloudflare › Settings › Variables and Secrets:
 *   SERVICE_ACCOUNT = tutto il contenuto del file JSON «chiave privata» scaricato da Firebase
 * Facoltativo:
 *   ALLOWED_ORIGIN  = https://canvas20.github.io   (indirizzo da cui l'app può chiamare il postino)
 */
export default {
  async fetch(req, env) {
    const origin = env.ALLOWED_ORIGIN || 'https://canvas20.github.io';
    const cors = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method === 'GET') {
      let stato = 'manca il segreto SERVICE_ACCOUNT';
      if (env.SERVICE_ACCOUNT) { try { const sa = JSON.parse(env.SERVICE_ACCOUNT); stato = sa.client_email && sa.private_key ? 'chiave Firebase valida (progetto ' + sa.project_id + ')' : 'il segreto SERVICE_ACCOUNT non è la chiave Firebase giusta'; if (new URL(req.url).searchParams.get('verifica') === '1' && sa.private_key) { await accessToken(sa); stato += ', accesso a Google riuscito'; } } catch (e) { stato = 'problema con SERVICE_ACCOUNT: ' + (e.message || e); } }
      if (new URL(req.url).searchParams.get('dispositivi') === '1' && env.SERVICE_ACCOUNT) { try { const sa = JSON.parse(env.SERVICE_ACCOUNT); const tk = await accessToken(sa); const r = await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/push?pageSize=100`, { headers: { Authorization: 'Bearer ' + tk } }); const j = await r.json(); const L = (j.documents || []).map(d => { const f = d.fields || {}; return (f.co && f.co.stringValue) + ' / ' + (f.mid && f.mid.stringValue) + ' / ' + ((f.ua && f.ua.stringValue) || '').replace(/^Mozilla\/5.0 \(([^;)]+).*$/, '$1') + ' / ' + (f.at && f.at.stringValue); }); stato += ' · dispositivi registrati: ' + L.length + (L.length ? '\n' + L.join('\n') : ''); } catch (e) { stato += ' · errore lettura dispositivi: ' + e.message; } }
      return new Response('RifiutiPro: postino delle notifiche attivo · ' + stato, { headers: Object.assign({ 'Content-Type': 'text/plain; charset=utf-8' }, cors) });
    }
    if (req.method !== 'POST') return new Response('Metodo non ammesso', { status: 405, headers: cors });
    const reqOrigin = req.headers.get('Origin') || '';
    if (reqOrigin && reqOrigin !== origin && !reqOrigin.startsWith('http://localhost')) return new Response('Origine non ammessa', { status: 403, headers: cors });
    let msg;
    try { msg = await req.json(); } catch (e) { return json({ error: 'JSON non valido' }, 400, cors); }
    const co = String(msg.co || ''), kind = String(msg.kind || ''), mid = String(msg.mid || ''), except = String(msg.except || '');
    if (!/^[\w.:@+~-]{1,200}$/.test(co) || !/^[a-z]{2,12}$/.test(kind)) return json({ error: 'Parametri non validi' }, 400, cors);
    if (!env.SERVICE_ACCOUNT) return json({ error: 'Segreto SERVICE_ACCOUNT mancante' }, 500, cors);
    const sa = JSON.parse(env.SERVICE_ACCOUNT);
    const token = await accessToken(sa);
    const devices = await findDevices(sa.project_id, token, co);
    const targets = devices.filter(d => (!mid || d.mid === mid) && (!except || d.mid !== except) && (!d.kinds || d.kinds.includes(kind)));
    let sent = 0, removed = 0;
    await Promise.all(targets.map(async d => {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: { token: d.token, data: { title: clip(msg.title, 80) || 'RifiutiPro', body: clip(msg.body, 180), url: clip(msg.url, 120) || '#/notif', tag: kind + '-' + Date.now() }, webpush: { headers: { Urgency: 'high', TTL: '86400' } } } }),
      });
      if (r.ok) { sent++; return; }
      const t = await r.text();
      if (r.status === 404 || /UNREGISTERED|INVALID_ARGUMENT/.test(t)) { await deleteDoc(sa.project_id, token, d.name); removed++; }
    }));
    return json({ ok: true, devices: devices.length, sent, removed }, 200, cors);
  },
};
const clip = (s, n) => String(s || '').slice(0, n);
const json = (o, s, h) => new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'Content-Type': 'application/json' }, h) });
const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uStr = s => b64u(new TextEncoder().encode(s));
let CACHED = null;
async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  if (CACHED && CACHED.exp > now + 60) return CACHED.token;
  const header = b64uStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64uStr(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(header + '.' + claims));
  const jwt = header + '.' + claims + '.' + b64u(sig);
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + jwt });
  const j = await r.json();
  if (!j.access_token) throw new Error('Accesso a Google non riuscito: ' + JSON.stringify(j));
  CACHED = { token: j.access_token, exp: now + (j.expires_in || 3600) };
  return CACHED.token;
}
async function findDevices(pid, token, co) {
  const r = await fetch(`https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents:runQuery`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'push' }], where: { fieldFilter: { field: { fieldPath: 'co' }, op: 'EQUAL', value: { stringValue: co } } }, limit: 200 } }),
  });
  const rows = await r.json();
  return (Array.isArray(rows) ? rows : []).filter(x => x.document).map(x => {
    const f = x.document.fields || {};
    return { name: x.document.name, token: f.token && f.token.stringValue, mid: f.mid && f.mid.stringValue, kinds: f.kinds && f.kinds.arrayValue ? (f.kinds.arrayValue.values || []).map(v => v.stringValue) : null };
  }).filter(d => d.token);
}
async function deleteDoc(pid, token, name) { await fetch(`https://firestore.googleapis.com/v1/${name}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } }); }
