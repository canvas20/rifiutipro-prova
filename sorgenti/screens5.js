/* ================= NOTIFICHE PUSH (anche ad app chiusa) e BADGE ================= */
const PUSH_KINDS = { reqs: 'Nuove richieste di quotazione', quotes: 'Quotazioni (nuove, aggiornate, confermate)', chat: 'Messaggi in chat', links: 'Richieste di collegamento', team: 'Richieste di accesso del personale', agenda: 'Eventi assegnati in agenda', ads: 'Annunci (approvazione)', help: 'Assistenza' };
function pushReady() { return MODE === 'firebase' && !!window.NOTIFY_URL && !!window.FCM_VAPID_KEY && 'serviceWorker' in navigator && 'Notification' in window; }
function isIOS() { return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function isStandalone() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
function memberKinds(m) {
  const N = Object.assign({ quotes: true, reqs: true, chat: true, links: true, team: true, agenda: true, ads: true, help: true }, m.notif || {});
  let base = m.sa ? ['ads', 'help', 'chat'] : isField(m) ? ['chat', 'agenda'] : ['reqs', 'quotes', 'chat', 'links', 'agenda', 'ads', 'help'].concat(canTeam(m) ? ['team'] : []);
  return base.filter(k => N[k] !== false);
}
/* invio: chiede al «postino» (Cloudflare Worker) di avvisare i dispositivi di un'azienda o di una persona */
function pushNotify(co, kind, title, body, url, mid, self) {
  if (MODE !== 'firebase' || !window.NOTIFY_URL || !co) return;
  try { fetch(window.NOTIFY_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ co, mid: mid || '', kind, title: String(title).slice(0, 80), body: String(body || '').slice(0, 180), url: url || '#/notif', except: self ? '' : (meId() || '') }), keepalive: true }).catch(() => { }); } catch (e) { }
}
/* chi avvisare, in base a cosa è cambiato nei dati */
function afterWrite(c, id, b, a) {
  if (MODE !== 'firebase' || !a || window.__SEEDING) return;
  const nm = co => coName(co);
  if (c === 'reqs') {
    if (!b) (a.to || []).forEach(t => pushNotify(t, 'reqs', 'Nuova richiesta di quotazione', `${a.sub || a.macro} da ${nm(a.from)}`, '#/req/' + id));
    else if (a.status === 'cancelled' && b.status !== 'cancelled') (a.to || []).forEach(t => pushNotify(t, 'reqs', 'Richiesta annullata', `${a.sub || a.macro} · ${nm(a.from)}`, '#/req/' + id));
  }
  if (c === 'quotes') {
    const txt = `${a.sub || a.macro}: ${money(a.price)} ${a.unit} da ${nm(a.from)}`;
    if (!b && a.status === 'sent') pushNotify(a.to, 'quotes', 'Nuova quotazione', txt, '#/quote/' + id);
    else if (b && (a.ver || 1) > (b.ver || 1)) pushNotify(a.to, 'quotes', `Quotazione aggiornata (V${a.ver})`, txt, '#/quote/' + id);
    else if (b && a.confirmedAt && !b.confirmedAt) pushNotify(a.from, 'quotes', 'Ricezione confermata', `${nm(a.to)} ha visualizzato la quotazione ${a.num}`, '#/quote/' + id);
    else if (b && a.status === 'withdrawn' && b.status !== 'withdrawn') pushNotify(a.to, 'quotes', 'Quotazione ritirata', `${a.num} · ${nm(a.from)}`, '#/quote/' + id);
  }
  if (c === 'links') {
    if (!b && a.status === 'pending') pushNotify(a.b, 'links', 'Richiesta di collegamento', `${nm(a.a)} vuole collegarsi`, '#/company/' + a.a);
    else if (b && a.status === 'active' && b.status !== 'active') pushNotify(a.a, 'links', 'Collegamento accettato', `${nm(a.b)} ha accettato`, '#/company/' + a.b);
  }
  if (c === 'chats') {
    const L = a.msgs || [], LB = (b && b.msgs) || [];
    if (L.length > LB.length || (L.length && LB.length && L[L.length - 1].at !== LB[LB.length - 1].at)) { const last = L[L.length - 1]; const to = last.co === a.a ? a.b : a.a; pushNotify(to, 'chat', 'Messaggio da ' + nm(last.co), last.text, '#/chat/' + last.co); }
  }
  if (c === 'members' && !b && a.status === 'pending') pushNotify(a.co, 'team', 'Richiesta di accesso', `${a.name} ${a.surname || ''} chiede di entrare con il PIN`, '#/team');
  if (c === 'events' && a.who && (!b || b.who !== a.who)) pushNotify(a.co, 'agenda', 'Nuovo evento in agenda', `${a.title} · ${fDate(a.date)}${a.time ? ' ' + a.time : ''}`, '#/evedit/' + id, a.who);
  if (c === 'ads') {
    if (a.status === 'review' && (!b || b.status !== 'review')) pushNotify('co_staff', 'ads', 'Annuncio da approvare', `${a.title} · ${nm(a.co)}`, '#/admin/ads');
    if (b && b.status === 'review' && a.status === 'active') pushNotify(a.co, 'ads', 'Annuncio pubblicato', a.title, '#/myads');
    if (b && b.status === 'review' && a.status === 'rejected') pushNotify(a.co, 'ads', 'Annuncio non approvato', `${a.title}: ${a.reason || ''}`, '#/myads');
  }
  if (c === 'tickets') {
    if (!b) pushNotify('co_staff', 'help', 'Nuova richiesta di assistenza', `${a.subject} · ${nm(a.co)}`, '#/admin/help');
    else if ((a.replies || []).length > ((b.replies || []).length)) { const r = a.replies[a.replies.length - 1]; if (r.staff) pushNotify(a.co, 'help', 'Risposta dall\'assistenza', r.text, '#/help/' + id); else pushNotify('co_staff', 'help', 'Nuova risposta in assistenza', `${a.subject}: ${r.text}`, '#/admin/help'); }
  }
}
/* badge sull'icona dell'app = notifiche da leggere */
let _lastBadge = -1;
function updateBadge() {
  if (!('setAppBadge' in navigator) || !me()) return;
  const n = notifCount(); if (n === _lastBadge) return; _lastBadge = n;
  try { if (n > 0) navigator.setAppBadge(n); else navigator.clearAppBadge(); } catch (e) { }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && navigator.serviceWorker && navigator.serviceWorker.getRegistration) navigator.serviceWorker.getRegistration().then(r => r && r.getNotifications && r.getNotifications().then(ns => ns.forEach(n => n.close()))).catch(() => { }); });

/* attivazione su questo dispositivo */
function tokId(t) { let h = 0; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return 'p_' + h.toString(36) + t.length; }
async function savePushDoc(token) { const m = me(); const id = tokId(token); lsSet('rp_push', JSON.stringify({ id, token, mid: m.id })); const o = { token, co: m.co, mid: m.id, kinds: memberKinds(m), ua: navigator.userAgent.slice(0, 120), at: nowISO() }; await FS.collection('push').doc(id).set(o); }
function pushLocal() { try { return JSON.parse(lsGet('rp_push') || 'null'); } catch (e) { return null; } }
ACT.pushOn = async () => {
  if (!pushReady()) return toast('Notifiche non disponibili in questa versione.');
  if (isIOS() && !isStandalone()) return modal(`<h3 style="margin:0">Prima aggiungi l'app alla schermata Home</h3><p class="mut" style="margin:0">Su iPhone le notifiche funzionano solo per l'app installata (iOS 16.4 o successivo):<br>1. in Safari tocca <b>Condividi</b> ⬆️<br>2. <b>Aggiungi alla schermata Home</b><br>3. apri RifiutiPro dall'icona e torna qui.</p><button class="bt" data-act="mClose">Ho capito</button>`);
  try {
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return toast('Permesso negato: puoi riattivarlo dalle impostazioni del telefono.');
    toast('Attivo le notifiche…');
    const reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
    if (!window.firebase.messaging) await loadScript('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
    const token = await firebase.messaging().getToken({ vapidKey: window.FCM_VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return toast('Il dispositivo non ha restituito un codice di notifica.');
    await savePushDoc(token); log('Notifiche attivate su un dispositivo'); toast('Notifiche attive su questo dispositivo'); render();
  } catch (e) { console.error(e); toast('Attivazione non riuscita: ' + (e && (e.code || e.message) || 'errore')); }
};
ACT.pushOff = async () => { const P = pushLocal(); if (P) { try { await FS.collection('push').doc(P.id).delete(); } catch (e) { } try { await firebase.messaging().deleteToken(); } catch (e) { } } lsSet('rp_push', null); toast('Notifiche disattivate su questo dispositivo'); render(); };
ACT.pushTest = () => { const m = me(); pushNotify(m.co, 'chat', 'Prova di notifica', 'Se leggi questo messaggio, le notifiche funzionano.', '#/privacy', m.id, true); toast('Inviata: chiudi l\'app e attendi qualche secondo'); };
/* aggiorna i tipi di avviso quando cambiano le preferenze o l'utente */
function pushRefresh() { const P = pushLocal(); const m = me(); if (!P || !m || MODE !== 'firebase' || !FS) return; if (P.mid !== m.id) { savePushDoc(P.token).catch(() => { }); return; } FS.collection('push').doc(P.id).set({ kinds: memberKinds(m), co: m.co, mid: m.id }, { merge: true }).catch(() => { }); }
const _ntf = ACT.ntf; ACT.ntf = el => { _ntf(el); setTimeout(pushRefresh, 300); };
const _logout = ACT.logout; ACT.logout = () => { const P = pushLocal(); if (P && MODE === 'firebase' && FS) { FS.collection('push').doc(P.id).delete().catch(() => { }); lsSet('rp_push', null); } _logout(); };

/* schermata Privacy e preferenze, con la sezione notifiche push */
XR.privacy = () => {
  const m = me(); const N = Object.assign({ quotes: true, reqs: true, chat: true, links: true, team: true, agenda: true, ads: true, help: true, email: true, promo: !!m.mkt }, m.notif || {});
  const t = (k, l) => `<label class="cbx"><input type="checkbox" data-act="ntf" data-k="${k}" ${N[k] !== false ? 'checked' : ''}><span>${l}</span></label>`;
  const P = pushLocal(); const on = !!(P && P.mid === m.id && 'Notification' in window && Notification.permission === 'granted');
  const avail = memberKinds(Object.assign({}, m, { notif: {} }));
  let pushBox;
  if (!pushReady()) pushBox = `<div class="info">Le notifiche ad app chiusa funzionano nella versione installata da <b>canvas20.github.io/rifiutipro-prova</b>${MODE === 'firebase' && !window.NOTIFY_URL ? ', appena sarà attivo il servizio di invio' : ''}.</div>`;
  else if (on) pushBox = `<div class="ok">✓ Notifiche attive su questo dispositivo, anche ad app chiusa, con il numero sull'icona.</div><div class="two"><button class="bt gh s" data-act="pushTest">Invia una prova</button><button class="bt rd s" data-act="pushOff">Disattiva qui</button></div>`;
  else pushBox = `<button class="bt g" data-act="pushOn">🔔 Attiva le notifiche su questo dispositivo</button><span class="hint">${isIOS() ? 'iPhone: prima «Aggiungi alla schermata Home» da Safari, poi apri l\'app dall\'icona (iOS 16.4 o successivo).' : 'Il telefono ti chiederà il permesso: tocca «Consenti».'}</span>`;
  return {
    h: header('t', 'Privacy e preferenze', { back: '#/profile' }), b: `<div class="card"><h3>Notifiche sul telefono</h3>${pushBox}</div>
  <div class="card"><h3>Cosa vuoi ricevere</h3>${avail.map(k => t(k, PUSH_KINDS[k])).join('')}${t('email', 'Riepilogo via email')}${t('promo', 'Comunicazioni promozionali')}<span class="hint">Valgono per la campanella e per le notifiche sul telefono. Ognuno sceglie per sé.</span></div>
  <div class="card"><h3>Password</h3><span class="sm mut">In prova le password non vengono salvate. Nella versione definitiva: cambio password con conferma via email.</span></div>
  <div class="card"><h3>I tuoi dati</h3><button class="bt gh" data-act="expData">Esporta i dati della mia azienda (JSON)</button><button class="bt rd" data-act="askDel">Chiedi la cancellazione dell'account</button><span class="hint">La richiesta arriva all'assistenza di Soluzione Rifiuti.</span></div>` };
};
/* invito discreto in Home ad attivare le notifiche */
function pushInvite() { if (!pushReady() || !me()) return ''; const P = pushLocal(); if (P && P.mid === meId() && Notification.permission === 'granted') return ''; if (lsGet('rp_push_skip')) return ''; return `<div class="info row"><span class="sp">🔔 <b>Vuoi le notifiche anche ad app chiusa?</b></span><button class="bt s" data-go="#/privacy">Attiva</button><button class="x" data-act="pushSkip" aria-label="Chiudi">×</button></div>`; }
ACT.pushSkip = () => { lsSet('rp_push_skip', '1'); render(); };
