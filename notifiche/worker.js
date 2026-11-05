import EER from './eer_elenco.json' with { type: 'json' };
/* v9 
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
    if (new URL(req.url).pathname === '/eer-foto') {
      const ro = req.headers.get('Origin') || '';
      if (ro && ro !== origin && !ro.startsWith('http://localhost')) return new Response('Origine non ammessa', { status: 403, headers: cors });
      try { return json(await eerFoto(await req.json(), env), 200, cors); }
      catch (e) { return json({ error: String(e && e.message || e).slice(0, 300) }, 500, cors); }
    }
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
    const rawUrl = clip(msg.url, 400);
    const link = /^https:\/\//.test(rawUrl) && rawUrl.startsWith(origin) ? rawUrl : origin + '/rifiutipro-prova/' + (rawUrl.startsWith('#') ? rawUrl : '#/notif');
    const base = link.split('#')[0].replace(/[^/]*$/, '');
    let sent = 0, removed = 0;
    await Promise.all(targets.map(async d => {
      const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: { token: d.token, data: { title: clip(msg.title, 80) || 'RifiutiPro', body: clip(msg.body, 180), url: link, kind },
          webpush: { headers: { Urgency: 'high', TTL: '86400' },
            notification: { title: clip(msg.title, 80) || 'RifiutiPro', body: clip(msg.body, 180), icon: base + 'icon-192.png', badge: base + 'icon-192.png', tag: kind + '-' + Date.now(), renotify: true, requireInteraction: true, vibrate: [200, 100, 200, 100, 300], silent: false, timestamp: Date.now() },
            fcm_options: { link } } } }),
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

/* ===== Codice EER da foto: riconoscimento con Workers AI (piano gratuito) ===== */
const MODELS = ['@cf/meta/llama-4-scout-17b-16e-instruct', '@cf/mistralai/mistral-small-3.1-24b-instruct'];
const MATERIALI = { ferro: 'metallo ferroso (ferro, acciaio)', nonfer: 'alluminio o altri metalli non ferrosi', rame: 'rame, ottone o cavi elettrici', veicolo: 'componente di veicolo (alternatore, motorino, centralina, catalizzatore…)', plastica: 'plastica', carta: 'carta o cartone', legno: 'legno', vetro: 'vetro', lampade: 'lampade o tubi luminosi', raee: 'apparecchio elettrico o elettronico', alimenti: 'alimenti', inerti: 'macerie o inerti edili', oli: 'oli o liquidi', altro: 'altro' };
async function aiRun(env, messages, max_tokens) {
  if (!env.AI) throw new Error('Intelligenza artificiale non collegata al postino');
  let last;
  for (const m of MODELS) {
    try { const r = await env.AI.run(m, { messages, max_tokens, temperature: 0.1 }); const t = typeof r.response === 'string' ? r.response : JSON.stringify(r.response || r); return { text: t, model: m }; }
    catch (e) { last = e; }
  }
  throw last || new Error('Modello non disponibile');
}
function parseJson(t) { const m = String(t).match(/\{[\s\S]*\}/); if (!m) throw new Error('Risposta non leggibile'); return JSON.parse(m[0]); }
async function eerFoto(b, env) {
  if (b.mode === 'proponi') return proponi(b, env);
  const img = String(b.img || '');
  if (!/^data:image\/(jpeg|png|webp);base64,/.test(img) || img.length > 1400000) throw new Error('Foto mancante o troppo grande');
  const istr = `Sei un tecnico esperto di rifiuti. Guarda la foto e identifica il rifiuto (oggetto e materiale prevalente). ${b.note ? 'Indicazione dell\'utente: "' + String(b.note).slice(0, 200) + '". ' : ''}
Rispondi SOLO con un oggetto JSON valido, in italiano, con queste chiavi:
{"oggetto": "nome breve dell'oggetto", "materiale": una di queste chiavi ${JSON.stringify(Object.keys(MATERIALI))} (significati: ${Object.entries(MATERIALI).map(([k, v]) => k + '=' + v).join('; ')}), "descrizione": "una frase su cosa si vede e in che stato è", "pericolo": true se si vedono possibili sostanze pericolose (oli, liquidi, batterie, amianto, mercurio, residui chimici) altrimenti false, "nota_pericolo": "breve, o stringa vuota", "piu_rifiuti": true se nella foto ci sono più tipi di rifiuto diversi, "affidabilita": "alta" o "media" o "bassa"}.
Non indicare codici EER: la provenienza del rifiuto la chiederà l'app.`;
  const r = await aiRun(env, [{ role: 'user', content: [{ type: 'text', text: istr }, { type: 'image_url', image_url: { url: img } }] }], 350);
  const o = parseJson(r.text);
  if (!MATERIALI[o.materiale]) o.materiale = 'altro';
  return { ok: true, oggetto: String(o.oggetto || '').slice(0, 80), materiale: o.materiale, descrizione: String(o.descrizione || '').slice(0, 300), pericolo: !!o.pericolo, nota_pericolo: String(o.nota_pericolo || '').slice(0, 200), piu_rifiuti: !!o.piu_rifiuti, affidabilita: ['alta', 'media', 'bassa'].includes(o.affidabilita) ? o.affidabilita : 'media', modello: r.model };
}
const EERC = new Map(EER.codes.map(c => [c[0], c]));
const eerFmt = c => c.slice(0, 2) + ' ' + c.slice(2, 4) + ' ' + c.slice(4, 6);
const eerSub = c => c.slice(0, 2) + ' ' + c.slice(2, 4) + ' — ' + (EER.sub[c.slice(0, 4)] || '');
async function proponi(b, env) {
  const c = k => String(b[k] || '').slice(0, 600);
  const dati = `oggetto riconosciuto nella foto: ${c('oggetto') || '—'}; materiale: ${c('materiale') || '—'}${b.materiale_desc ? ' — DESCRIZIONE DELL\'UTENTE: «' + c('materiale_desc') + '»' : ''}; attività che ha prodotto il rifiuto: ${c('attivita') || '—'}${b.attivita_desc ? ' — DESCRIZIONE DELL\'UTENTE: «' + c('attivita_desc') + '»' : ''}; processo o motivo dello scarto: ${c('processo') || '—'}; altre informazioni: ${c('dettaglio') || '—'}`;
  const metodo = `Metodo obbligatorio (Linee guida SNPA, Decisione 2000/532/CE mod. 2014/955/UE): 1) cerca la fonte che genera il rifiuto nei capitoli 01-12 e 17-20; 2) se non c'è, nei capitoli 13, 14, 15; 3) poi nel capitolo 16; 4) solo alla fine una voce 99. Il capitolo 20 vale solo per rifiuti urbani (art. 183, c. 1, lett. b-ter, d.lgs. 152/2006, allegati L-quater e L-quinquies). Gli imballaggi vanno al 15 01. Le descrizioni scritte dall'utente sono le informazioni più importanti: prevalgono sulla foto.`;
  // 1) sottocapitoli candidati
  const elencoSub = Object.entries(EER.sub).filter(([k]) => k.length === 4).map(([k, v]) => k.slice(0, 2) + ' ' + k.slice(2) + ' ' + v).join('\n');
  const r1 = await aiRun(env, [{ role: 'user', content: `Sei un consulente ambientale italiano esperto di classificazione dei rifiuti. ${metodo}\nDati del rifiuto: ${dati}.\nQuesti sono TUTTI i sottocapitoli dell'elenco europeo dei rifiuti:\n${elencoSub}\nIndica da 2 a 6 sottocapitoli in cui può trovarsi la voce giusta, in ordine di probabilità, includendo anche quelli da confrontare (es. 15 01 per gli imballaggi, 16 01 per i veicoli, 20 01 per gli urbani). Rispondi SOLO con JSON: {"sottocapitoli": ["16 01", "..."]}` }], 200);
  let subs = []; try { subs = (parseJson(r1.text).sottocapitoli || []).map(x => String(x).replace(/\D/g, '').slice(0, 4)).filter(x => EER.sub[x]); } catch (e) { }
  if (!subs.length) subs = ['1601', '1501', '1602', '1701', '2001'];
  subs = [...new Set(subs)].slice(0, 6);
  const voci = EER.codes.filter(v => subs.includes(v[0].slice(0, 4)));
  const elencoVoci = subs.map(s => '[' + eerSub(s + '00') + ']\n' + voci.filter(v => v[0].startsWith(s)).map(v => eerFmt(v[0]) + (v[2] ? '*' : '') + ' ' + v[1]).join('\n')).join('\n');
  // 2) scelta della voce, solo dall'elenco ufficiale
  const ask = extra => aiRun(env, [{ role: 'user', content: `Sei un consulente ambientale italiano esperto di classificazione dei rifiuti. ${metodo} Per le voci a specchio (pericolosa con * e non pericolosa) indica la verifica di pericolosità da fare. Non assecondare l'utente se i dati portano altrove. Se i dati non bastano per scegliere con sicurezza, rispondi "non determinabile" e indica nelle verifiche quali informazioni servono.\nDati del rifiuto: ${dati}.\nVoci ufficiali tra cui scegliere (puoi scegliere SOLO una di queste; l'asterisco indica rifiuto pericoloso):\n${elencoVoci}\n${extra || ''}Rispondi SOLO con JSON: {"codice": "es. 16 01 18 oppure non determinabile", "motivazione": "2-4 frasi che collegano i dati alla voce scelta", "alternative": [{"codice": "...", "motivo": "perché scartato"}], "verifiche": ["..."], "sicurezza": "alta" o "media" o "bassa"}` }], 700);
  let r = await ask(); let o = parseJson(r.text); let dg = String(o.codice || '').replace(/\D/g, '');
  if (dg && !EERC.has(dg)) { r = await ask(`ATTENZIONE: il codice ${o.codice} che hai indicato non esiste nell'elenco ufficiale. Scegli solo tra le voci elencate.\n`); o = parseJson(r.text); dg = String(o.codice || '').replace(/\D/g, ''); }
  const v = EERC.get(dg);
  const alt = (Array.isArray(o.alternative) ? o.alternative : []).slice(0, 5).map(a => { const d = String(a.codice || '').replace(/\D/g, ''); const w = EERC.get(d); return { c: w ? eerFmt(d) + (w[2] ? '*' : '') : String(a.codice || '').slice(0, 20), d: (w ? w[1] + ' — ' : '') + String(a.motivo || '').slice(0, 200) }; });
  return { ok: true, codice: v ? eerFmt(dg) + (v[2] ? '*' : '') : 'non determinabile', descrizione: v ? v[1] : '', pericoloso: v ? !!v[2] : false, ufficiale: !!v, sicurezza: ['alta', 'media', 'bassa'].includes(o.sicurezza) ? o.sicurezza : 'media', motivazione: String(o.motivazione || '').slice(0, 900), alternative: alt, verifiche: (Array.isArray(o.verifiche) ? o.verifiche : []).slice(0, 6).map(x => String(x).slice(0, 220)), sottocapitoli: subs.map(s => eerSub(s + '00')), modello: r.model };
}

