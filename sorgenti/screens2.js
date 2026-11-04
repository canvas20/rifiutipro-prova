/* ============ finestra di testo (al posto di prompt) ============ */
function askText(title, ph, cb) {
  modal(`<h3 style="margin:0">${esc(title)}</h3><input class="in" id="askin" placeholder="${esc(ph || '')}"><div class="two"><button class="bt gh" data-act="mClose">Annulla</button><button class="bt" id="askok">Conferma</button></div>`);
  const i = document.getElementById('askin'); i.focus();
  const ok = () => { const v = i.value.trim(); closeOverlays(); if (v) cb(v); };
  document.getElementById('askok').onclick = ok; i.onkeydown = e => { if (e.key === 'Enter') ok(); };
}
function confirmBox(title, text, okLabel, cb, danger) {
  modal(`<h3 style="margin:0">${esc(title)}</h3><p class="mut" style="margin:0">${text}</p><div class="two"><button class="bt gh" data-act="mClose">Annulla</button><button class="bt ${danger ? 'rd' : ''}" id="cfok">${esc(okLabel)}</button></div>`);
  document.getElementById('cfok').onclick = () => { closeOverlays(); cb(); };
}
ACT.mClose = () => closeOverlays();
ACT.wAddSub = el => { const F = U[wF()]; const m = F.WO[+el.dataset.m]; askText('Nuova sottocategoria in «' + m + '»', 'Es. Rame in cavi', n => { if (!F.W[m].subs[n]) F.W[m].subs[n] = { on: true, rows: [{ d: '', e: '' }, { d: '', e: '' }] }; render(); }); };
ACT.wAddMacro = () => { const F = U[wF()]; askText('Nuova macroarea', 'Es. Tessili', n => { if (!F.W[n]) { F.W[n] = { open: true, subs: {} }; F.WO.push(n); } render(); setTimeout(() => askText('Prima sottocategoria in «' + n + '»', 'Es. Indumenti usati', s => { F.W[n].subs[s] = { on: true, rows: [{ d: '', e: '' }, { d: '', e: '' }] }; render(); }), 50); }); };

/* ============ conteggi e notifiche ============ */
function reqsToMe() { const co = myCo(); if (!co) return []; return all('reqs').filter(r => r.status !== 'cancelled' && (r.to || []).includes(co.id)); }
function reqsOpenToMe() { const co = myCo(); return reqsToMe().filter(r => !(r.resp && r.resp[co.id])); }
function quotesToMe() { const co = myCo(); return co ? all('quotes').filter(q => q.to === co.id && q.status !== 'draft') : []; }
function notifQuotes() { return quotesToMe().filter(q => q.status === 'sent' && !q.seenAt).length; }
function chatKey(a, b) { return [a, b].sort().join('__'); }
function unreadChats() { const co = myCo(); if (!co) return 0; return all('chats').filter(c => (c.a === co.id || c.b === co.id) && c.msgs && c.msgs.length && c.msgs[c.msgs.length - 1].co !== co.id && (!c.read || !c.read[co.id] || c.read[co.id] < c.msgs[c.msgs.length - 1].at)).length; }
function linkReqsToMe() { const co = myCo(); return co ? all('links').filter(l => l.status === 'pending' && l.b === co.id) : []; }
function memberReqs() { const co = myCo(); return co ? all('members').filter(m => m.co === co.id && m.status === 'pending') : []; }
function notifList() {
  const m = me(); const co = myCo(); if (!co) return [];
  const L = [];
  if (canTeam(m)) memberReqs().forEach(x => L.push({ at: x.createdAt, ic: '👤', t: `${memName(x.id)} chiede di accedere come ${ROLES[x.role] || 'dipendente'}`, go: '#/team' }));
  if (!isField(m)) {
    linkReqsToMe().forEach(l => L.push({ at: l.createdAt, ic: '🤝', t: `${coName(l.a)} chiede di collegarsi`, go: '#/company/' + l.a }));
    reqsOpenToMe().forEach(r => L.push({ at: r.createdAt, ic: '📥', t: `Nuova richiesta di quotazione: ${r.sub || r.macro} da ${coName(r.from)}`, go: '#/req/' + r.id }));
    quotesToMe().filter(q => q.status === 'sent' && !q.seenAt).forEach(q => L.push({ at: q.updatedAt || q.createdAt, ic: '🏷️', t: `Nuova quotazione da ${coName(q.from)}: ${q.sub || q.macro}`, go: '#/quote/' + q.id }));
  }
  all('chats').filter(c => (c.a === co.id || c.b === co.id) && c.msgs && c.msgs.length).forEach(c => { const last = c.msgs[c.msgs.length - 1]; if (last.co !== co.id && (!c.read || !c.read[co.id] || c.read[co.id] < last.at)) L.push({ at: last.at, ic: '💬', t: `Messaggio da ${coName(last.co)}: «${String(last.text).slice(0, 60)}»`, go: '#/chat/' + last.co }); });
  return L.sort((a, b) => String(b.at).localeCompare(String(a.at)));
}
function notifCount() { return notifList().length; }
function vNotif() {
  const L = notifList();
  return { h: header('t', 'Notifiche', { back: '#/home' }), t: 'home', b: L.length ? `<div class="list">${L.map(n => `<a class="li" data-go="${n.go}"><span style="font-size:22px">${n.ic}</span><span class="sp"><b style="font-weight:600">${esc(n.t)}</b><span class="s">${fDT(n.at)}</span></span><span class="chev">›</span></a>`).join('')}</div>` : '<div class="empty">Nessuna novità. Le notifiche compaiono qui e restano finché non le apri.</div>' };
}

/* ============ HOME ============ */
function vHome() {
  const m = me(); const co = myCo(); const g = isG(co);
  if (isField(m)) return vHomeField();
  const coCard = `<a class="co" data-go="#/coedit">${avatar(co)}<span class="sp"><b style="font-size:18px">${esc(co.name)}</b><div class="mut sm">${esc(co.city)} (${esc(co.prov)})</div><div class="mut sm">${esc(coTypes(co))}${co.auth && co.auth.declared ? ' · <span class="tag g">Dati dichiarati</span>' : ''}</div></span><span class="chev mut">›</span></a>`;
  const nq = notifQuotes(); const lr = linkReqsToMe().length; const np = partners(co.id).length; const open = reqsOpenToMe();
  const tiles = `<div class="tiles">
   <a class="tile t-g" href="#/quotes">${IC.tag}${g ? (nq ? `<em>${nq} nuove</em>` : '') : (nq ? `<em>${nq} non viste</em>` : '')}<b>Quotazioni</b><span>${g ? 'Inviate e ricevute' : 'Ricevute dai collegati'}</span></a>
   <a class="tile t-b" href="#/companies">${IC.people}${lr ? `<em>${lr} richiest${lr > 1 ? 'e' : 'a'}</em>` : `<em>${np} collegat${np === 1 ? 'a' : 'e'}</em>`}<b>Aziende collegate</b><span>${g ? 'La tua rete commerciale' : 'Impianti e trasportatori'}</span></a>
   <a class="tile t-o" href="#/companies/search">${IC.search}<b>Cerca aziende</b><span>Trova nuovi operatori</span></a>
   <a class="tile t-t" href="#/fotoeer">${IC.cam}<b>Codice EER da foto</b><span>Scatta o carica una foto</span></a></div>`;
  const foto = '';
  const vetr = `<a class="wide w-navy" href="#/vetrina"><span class="vi">${IC.shop}</span><span><b>VETRINA</b><small>Consulenti, avvocati, noleggi e attrezzature nella tua zona</small></span><span class="ar">›</span></a>`;
  if (!g) {
    const recent = quotesToMe().sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt))).slice(0, 3);
    return { h: header('home'), t: 'home', b: `${banner()}${pushInvite()}${coCard}${giftInvite()}${tiles}${foto}${vetr}${zoneLine()}${adBig()}
    <div class="card"><div class="row"><h3 class="sp">Quotazioni ricevute recenti</h3><a href="#/quotes">Vedi tutte</a></div>${recent.length ? `<div class="list">${recent.map(quoteRow).join('')}</div>` : '<span class="mut sm">Ancora nessuna quotazione. Collegati a un impianto e chiedi una quotazione.</span>'}<span class="hint">Le quotazioni sono private: le vedi solo tu e l'azienda che te le ha inviate.</span></div>
    ${canWrite(m) ? '<button class="bt" data-act="newReq">Richiedi quotazione ai tuoi collegamenti</button>' : ''}${ftr()}` };
  }
  const since = Date.now() - 30 * 864e5; const inR = x => new Date(x.createdAt).getTime() > since;
  const qs = all('quotes').filter(inR);
  const kpi = `<div class="card"><div class="row"><h3 class="sp">Panoramica</h3><span class="mut sm">ultimi 30 giorni</span></div><div class="kp"><div><span>Quotazioni inviate</span><b>${qs.filter(q => q.from === co.id).length}</b></div><div><span>Quotazioni ricevute</span><b>${qs.filter(q => q.to === co.id).length}</b></div><div><span>Aziende collegate</span><b>${np}</b></div><div><span>Richieste ricevute</span><b>${reqsToMe().filter(inR).length}</b></div></div></div>`;
  const logs = ((D.logs[co.id] && D.logs[co.id].items) || []).slice(0, 4);
  return {
    h: header('home'), t: 'home', b: `${banner()}${pushInvite()}${coCard}${giftInvite()}${tiles}${foto}${vetr}${zoneLine()}${adBig()}${expiringBox()}
  ${canWrite(m) ? `<div class="two"><button class="bt g" data-act="newReq">Richiedi quotazione</button><button class="bt" data-go="#/quotes/req">Invia quotazione${open.length ? ' · ' + open.length + ' in attesa' : ''}</button></div>` : '<div class="info">Il tuo ruolo è «Solo visualizzazione»: vedi tutto ma non invii richieste o quotazioni.</div>'}
  ${!planOn(co) ? `<div class="warn">Ricevere è gratis. Per <b>inviare</b> quotazioni attiva il piano (${eur(PRICE.m)}/mese o ${eur(PRICE.y)}/anno) oppure usa un codice regalo. <a href="#/plan"><b>Il tuo piano</b></a></div>` : ''}
  ${kpi}
  <div class="card"><div class="row"><h3 class="sp">Richieste da gestire</h3><a href="#/quotes/req">Vedi tutte</a></div>${open.length ? `<div class="list">${open.slice(0, 3).map(reqRow).join('')}</div>` : '<span class="mut sm">Nessuna richiesta in attesa.</span>'}</div>
  ${adSmall()}<div class="card"><div class="row"><h3 class="sp">Attività recenti</h3><a href="#/logs">Registro</a></div>${logs.length ? logs.map(l => `<div class="row sm"><span class="sp">${esc(l.t)}<div class="xs mut">${esc(l.who)}</div></span><span class="xs mut">${fDT(l.at)}</span></div>`).join('') : '<span class="mut sm">Nessuna attività.</span>'}</div>
  ${ftr()}` };
}
function vHomeField() {
  const m = me(); const co = myCo();
  return { h: header('home'), t: 'home', b: `<h2 class="ttl">Ciao ${esc(m.name)}</h2><div class="co">${avatar(co)}<span class="sp"><b>${esc(co.name)}</b><div class="mut sm">${esc(ROLES[m.role])}</div></span></div>
  <div class="info">Menu ridotto per ${m.role === 'autista' ? 'autisti' : 'operatori'}: niente prezzi, quotazioni o ricerca aziende.</div>
  ${todayBox()}<a class="li" href="#/agenda">${IC.cal}<span class="sp"><b>Agenda</b><span class="s">I tuoi ritiri e appuntamenti</span></span><span class="chev">›</span></a>
  <a class="li" href="#/firs">${IC.truck}<span class="sp"><b>Formulari xFIR (scanner)</b><span class="s">Fotografa e registra i formulari</span></span><span class="chev">›</span></a>
  <a class="li" href="#/chats">${IC.chat}<span class="sp"><b>Chat</b><span class="s">Con le aziende collegate</span></span><span class="chev">›</span></a>
  <a class="li" href="#/eer">${IC.doc}<span class="sp"><b>Codici EER</b><span class="s">Consulta l'elenco</span></span><span class="chev">›</span></a>${ftr()}` };
}

/* ============ QUOTAZIONI e RICHIESTE ============ */
function qStatus(q, forMe) {
  if (q.status === 'withdrawn') return ['x', 'Ritirata'];
  if (q.validUntil && new Date(q.validUntil + 'T23:59:59') < new Date()) return ['x', 'Scaduta'];
  if (q.confirmedAt) return ['c', 'Confermata'];
  if (q.seenAt) return ['v', 'Vista'];
  return forMe ? ['n', 'Nuova'] : ['w', 'Inviata'];
}
function priceTxt(q) { return q.dir === 'gratuito' ? 'Gratuito · nessun compenso' : `${money(q.price)} ${esc(q.unit)} ${q.vat === 'esente' ? 'esente IVA' : '+ IVA'}`; }
function quoteRow(q) {
  const co = myCo(); const forMe = q.to === co.id; const other = get('companies', forMe ? q.from : q.to); const [c, t] = qStatus(q, forMe);
  return `<a class="li" data-go="#/quote/${q.id}">${avatar(other, 1)}<span class="sp"><b>${esc(other ? other.name : '')}</b><span class="s">${esc(q.sub || q.macro)}${q.eer ? ' · ' + esc(q.eer) : ''} · ${(DIRL[q.dir] || 'Offro')}</span><span class="s" style="color:var(--navy);font-weight:700">${priceTxt(q)}</span><span class="s">${fDT(q.updatedAt || q.createdAt)} · ${esc(q.num)} · V${q.ver || 1}</span></span>${stx(c, t)}</a>`;
}
function reqState(r, coId) { const s = r.resp && r.resp[coId]; return s === 'quoted' ? ['v', 'Quotata'] : s === 'declined' ? ['x', 'Non interessato'] : ['w', 'In attesa']; }
function reqRow(r) {
  const co = myCo(); const mine = r.from === co.id; const [c, t] = r.status === 'cancelled' ? ['x', 'Annullata'] : mine ? (Object.values(r.resp || {}).filter(x => x === 'quoted').length ? ['v', Object.values(r.resp || {}).filter(x => x === 'quoted').length + ' quotazioni'] : ['w', 'In attesa']) : reqState(r, co.id);
  const info = macroInfo(r.macro);
  return `<a class="li" data-go="#/req/${r.id}"><span class="mi" style="background:${info.col}">${esc(info.ini)}</span><span class="sp"><b>${esc(r.sub || r.macro)}</b><span class="s">${esc(r.macro)}${r.eer ? ' · ' + esc(r.eer) : ''}${r.qty ? ' · ' + esc(r.qty) + ' ' + esc(r.unit) : ''}</span><span class="s">${mine ? 'A ' + (r.to || []).length + ' aziende' : 'Da ' + esc(coName(r.from))} · ${esc(r.num)} · ${fDT(r.createdAt)}</span></span>${stx(c, t)}</a>`;
}
function vQuotes(tab) {
  const m = me(); const co = myCo(); const g = isG(co);
  tab = tab || (g ? 'rx' : 'rx');
  const flt = fv('qf', 'f', 'all');
  let body = '';
  const segs = g ? [['rx', 'Ricevute'], ['tx', 'Inviate'], ['req', 'Richieste']] : [['rx', 'Ricevute'], ['req', 'Le mie richieste']];
  if (tab === 'rx' || tab === 'tx') {
    let L = all('quotes').filter(q => tab === 'rx' ? q.to === co.id : q.from === co.id).sort((a, b) => String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)));
    const F = { all: () => true, new: q => qStatus(q, tab === 'rx')[1] === (tab === 'rx' ? 'Nuova' : 'Inviata'), seen: q => qStatus(q, 1)[1] === 'Vista', conf: q => qStatus(q, 1)[1] === 'Confermata', old: q => ['Scaduta', 'Ritirata'].includes(qStatus(q, 1)[1]) };
    const cnt = k => L.filter(F[k]).length;
    body = `<div class="chips">${[['all', 'Tutte'], ['new', tab === 'rx' ? 'Nuove' : 'Inviate'], ['seen', 'Viste'], ['conf', 'Confermate'], ['old', 'Scadute/ritirate']].map(([k, l]) => chip(flt === k, 'qf', `${l} (${cnt(k)})`, `data-k="${k}"`)).join('')}</div>`;
    L = L.filter(F[flt] || F.all);
    body += L.length ? `<div class="list">${L.map(quoteRow).join('')}</div>` : `<div class="empty">${tab === 'rx' ? 'Nessuna quotazione ricevuta.' : 'Nessuna quotazione inviata. Rispondi a una richiesta dalla scheda «Richieste».'}</div>`;
    body += '<p class="hint">Offro: chi quota paga il materiale. Richiedo: chi quota chiede un compenso per ritiro o trattamento. Gratuito: nessun compenso da nessuna delle due parti.</p>';
  } else {
    const sub = fv('qf', 'r', g ? 'in' : 'out');
    const L = all('reqs').filter(r => sub === 'in' ? (r.to || []).includes(co.id) : r.from === co.id).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    body = (g ? `<div class="chips">${chip(sub === 'in', 'qr', 'Ricevute', 'data-k="in"')}${chip(sub === 'out', 'qr', 'Inviate', 'data-k="out"')}</div>` : '') + (L.length ? `<div class="list">${L.map(reqRow).join('')}</div>` : `<div class="empty">${sub === 'in' ? 'Nessuna richiesta ricevuta.' : 'Nessuna richiesta inviata.'}</div>`) + (canWrite(m) ? '<button class="bt g" data-act="newReq">Nuova richiesta di quotazione</button>' : '') + '<p class="hint">Stati: In attesa (da gestire), Quotata (hai risposto), Non interessato, Annullata (ritirata dal richiedente).</p>';
  }
  return { h: header('home'), t: 'quotes', b: `<h2 class="ttl">Quotazioni</h2><p class="sub">Le offerte scambiate con le aziende collegate</p><div class="seg">${segs.map(([k, l]) => `<a href="#/quotes/${k}" class="${tab === k ? 'on' : ''}">${l}</a>`).join('')}</div>${body}${adSmall()}` };
}
ACT.qf = el => { setF('qf', 'f', el.dataset.k); render(); };
ACT.qr = el => { setF('qf', 'r', el.dataset.k); render(); };

function vQuote(id) {
  const q = get('quotes', id); const co = myCo(); const m = me();
  if (!q || (q.from !== co.id && q.to !== co.id)) return { h: header('t', 'Quotazione', { back: '#/quotes' }), b: '<div class="empty">Quotazione non disponibile.</div>' };
  const forMe = q.to === co.id; const other = get('companies', forMe ? q.from : q.to);
  if (forMe && !q.seenAt && q.status === 'sent') setTimeout(() => { patch('quotes', q.id, { seenAt: nowISO(), seenBy: m.id }); log('Visualizzata la quotazione ' + q.num + ' di ' + coName(q.from)); }, 0);
  const [c, t] = qStatus(q, forMe);
  const req = q.reqId ? get('reqs', q.reqId) : null;
  return {
    h: header('t', 'Quotazione', { back: '#/quotes/' + (forMe ? 'rx' : 'tx') }), t: 'quotes', b: `
  <div class="row"><span class="mono sm mut sp">${esc(q.num)} · V${q.ver || 1}</span>${stx(c, t)}</div>
  <div class="card"><div class="row">${avatar(other)}<span class="sp"><b>${esc(q.sub || q.macro)}</b><div class="mut sm">${q.dir === 'gratuito' ? 'Gratuito · nessun compenso' : q.dir === 'offro' ? 'Offro · chi quota paga il materiale' : 'Richiedo · chi quota chiede un compenso'}</div></span></div>
   <div class="price">${q.dir === 'gratuito' ? 'Gratuito' : money(q.price) + ' <span style="font-size:16px">' + esc(q.unit) + '</span>'}</div><div class="mut sm">${q.dir === 'gratuito' ? 'Nessun compenso' : (q.vat === 'esente' ? 'Esente IVA' : '+ IVA')} · Trasporto ${esc(q.transport)}${q.transport === 'separato' && q.tcost ? ' (' + money(q.tcost) + ' €)' : ''} · ${q.validUntil ? 'Valida fino al ' + fDate(q.validUntil) : 'Fino a variazione'}</div></div>
  <div class="card"><dl class="dl"><dt>Da</dt><dd>${esc(coName(q.from))}</dd><dt>A</dt><dd>${forMe ? 'Te' : esc(coName(q.to))}</dd><dt>Macroarea</dt><dd>${esc(q.macro)}</dd><dt>Codice EER</dt><dd>${q.eer ? esc(q.eer) + ' <span class="mut sm">' + esc(eerLabel(q.eer)) + '</span>' : '—'}</dd>${q.descr ? `<dt>Descrizione</dt><dd>${esc(q.descr)}</dd>` : ''}<dt>Aggiornata</dt><dd>${fDT(q.updatedAt || q.createdAt)}</dd>${req ? `<dt>Richiesta</dt><dd><a href="#/req/${req.id}">${esc(req.num)}</a></dd>` : ''}<dt>Note</dt><dd>${esc(q.note || '—')}</dd></dl></div>
  ${forMe ? (q.status === 'sent' ? (q.confirmedAt ? `<div class="ok">Ricezione confermata il ${fDT(q.confirmedAt)} da ${esc(memName(q.confirmedBy))}.</div>` : (canWrite(m) ? `<button class="bt g" data-act="qConfirm" data-id="${q.id}">HO RICEVUTO E VISUALIZZATO</button><span class="hint">Conferma solo la ricezione: non è un'accettazione della quotazione.</span>` : '')) : '')
      : `<div class="info">${q.seenAt ? 'Visualizzata il ' + fDT(q.seenAt) : 'Non ancora visualizzata'}${q.confirmedAt ? ' · ricezione confermata il ' + fDT(q.confirmedAt) : ''}</div>${q.status === 'sent' && canWrite(m) ? `<div class="two"><button class="bt ln" data-go="#/makequote/edit/${q.id}">MODIFICA (crea V${(q.ver || 1) + 1})</button><button class="bt rd" data-act="qWithdraw" data-id="${q.id}">Ritira</button></div>` : ''}`}
  <div class="two"><button class="bt gh" data-go="#/chat/${other ? other.id : ''}">${IC.chat} DISCUTI IN CHAT</button>${favBtn('quotes', q.id)}</div>
  ${(q.hist || []).length ? `<div class="card"><h3>Storico versioni</h3>${q.hist.map(h => `<div class="row sm"><b>V${h.ver}</b><span class="sp">${money(h.price)} ${esc(h.unit)}</span><span class="mut">${fDT(h.at)}</span></div>`).join('')}</div>` : ''}
  <p class="hint">RifiutiPro non conclude contratti: nessuna accettazione, controproposta o aggiudicazione nell'app.</p>` };
}
ACT.qConfirm = el => { const q = get('quotes', el.dataset.id); patch('quotes', q.id, { confirmedAt: nowISO(), confirmedBy: meId(), seenAt: q.seenAt || nowISO() }); log('Confermata la ricezione della quotazione ' + q.num); toast('Ricezione confermata'); };
ACT.qWithdraw = el => { const q = get('quotes', el.dataset.id); confirmBox('Ritirare la quotazione?', 'Resta nello storico; il destinatario vede «Ritirata».', 'Ritira', () => { patch('quotes', q.id, { status: 'withdrawn', updatedAt: nowISO() }); log('Ritirata la quotazione ' + q.num); }, 1); };

function vReq(id) {
  const r = get('reqs', id); const co = myCo(); const m = me();
  if (!r || (r.from !== co.id && !(r.to || []).includes(co.id))) return { h: header('t', 'Richiesta', { back: '#/quotes/req' }), b: '<div class="empty">Richiesta non disponibile.</div>' };
  const mine = r.from === co.id; const info = macroInfo(r.macro);
  const qs = all('quotes').filter(q => q.reqId === r.id && (mine || q.from === co.id));
  const [c, t] = r.status === 'cancelled' ? ['x', 'Annullata'] : mine ? ['v', 'Inviata'] : reqState(r, co.id);
  let actions = '';
  if (!mine && r.status !== 'cancelled' && canWrite(m)) {
    const st = r.resp && r.resp[co.id];
    actions = `${st !== 'quoted' ? `<button class="bt g" data-go="#/makequote/req/${r.id}">FAI QUOTAZIONE</button>` : `<button class="bt ln" data-go="#/makequote/req/${r.id}">Invia un'altra quotazione</button>`}${!st ? `<button class="bt gh" data-act="reqDecline" data-id="${r.id}">NON INTERESSATO</button>` : ''}`;
  }
  if (mine && r.status !== 'cancelled' && canWrite(m)) actions = `<button class="bt rd" data-act="reqCancel" data-id="${r.id}">Annulla richiesta</button>`;
  return {
    h: header('t', 'Richiesta', { back: '#/quotes/req' }), t: 'quotes', b: `
  <div class="row"><span class="mono sm mut sp">${esc(r.num)}</span>${stx(c, t)}</div>
  <div class="card"><div class="row"><span class="mi" style="background:${info.col}">${esc(info.ini)}</span><span class="sp"><b style="font-size:18px">${esc(r.sub || r.macro)}</b><div class="mut sm">${esc(r.macro)}</div></span></div>
  <dl class="dl"><dt>Codice EER</dt><dd>${r.eer ? esc(r.eer) + ' <span class="mut sm">' + esc(eerLabel(r.eer)) + '</span>' : 'non indicato'}</dd>${r.descr ? `<dt>Descrizione</dt><dd>${esc(r.descr)}</dd>` : ''}<dt>Quantità</dt><dd>${r.qty ? esc(r.qty) + ' ' + esc(r.unit) : 'non indicata'}</dd><dt>Trasporto</dt><dd>${r.transport ? 'Serve il trasporto' : 'Non serve'}</dd>${r.place ? `<dt>Ritiro</dt><dd>${esc(r.place)}</dd>` : ''}<dt>Note</dt><dd>${esc(r.note || '—')}</dd><dt>${mine ? 'Inviata a' : 'Richiedente'}</dt><dd>${mine ? (r.to || []).map(x => esc(coName(x)) + ' <span class="xs mut">(' + reqState(r, x)[1] + ')</span>').join('<br>') : esc(coName(r.from)) + '<br><span class="xs mut">' + esc(memName(r.by)) + '</span>'}</dd><dt>Data</dt><dd>${fDT(r.createdAt)}</dd></dl>${(r.photos || []).length ? `<div class="row" style="gap:6px">${r.photos.map(f => `<img src="${imgSrc(f)}" alt="Foto" style="width:31%;aspect-ratio:1;object-fit:cover;border-radius:10px" data-act="zoom" data-f="" data-id="${f}">`).join('')}</div>` : ''}</div>
  ${actions}
  <button class="bt gh" data-go="#/chat/${mine ? (r.to || [])[0] : r.from}">${IC.chat} DISCUTI IN CHAT</button>
  ${qs.length ? `<div class="sec">Quotazioni ${mine ? 'ricevute' : 'inviate'} per questa richiesta</div><div class="list">${qs.map(quoteRow).join('')}</div>` : ''}` };
}
ACT.reqDecline = el => { const r = get('reqs', el.dataset.id); const co = myCo(); confirmBox('Non interessato?', 'Il richiedente vedrà che non sei interessato.', 'Conferma', () => { patch('reqs', r.id, { resp: { [co.id]: 'declined' } }); log('Richiesta ' + r.num + ': non interessato'); }); };
ACT.reqCancel = el => { const r = get('reqs', el.dataset.id); confirmBox('Annullare la richiesta?', 'Le aziende destinatarie la vedranno come «Annullata».', 'Annulla richiesta', () => { patch('reqs', r.id, { status: 'cancelled' }); log('Annullata la richiesta ' + r.num); }, 1); };

/* nuova richiesta di quotazione */
ACT.newReq = () => { U.nr = { macro: 'Metalli', sub: '', unit: 'kg', to: {} }; go('#/newreq'); };
function vNewReq(preTo) {
  const co = myCo(); const m = me();
  if (!U.nr) U.nr = { macro: 'Metalli', sub: '', unit: 'kg', to: {} };
  if (preTo && !U.nr._pre) { U.nr._pre = 1; U.nr.to = { [preTo]: true }; }
  const N = U.nr;
  const subs = (MACRO.find(x => x[0] === N.macro) || [, , , []])[3];
  const parts = partners(co.id).filter(p => p.kind === 'gestore');
  parts.sort((a, b) => (coMacros(b).includes(N.macro) ? 1 : 0) - (coMacros(a).includes(N.macro) ? 1 : 0));
  const eerQ = String(fv('nr', 'eer')).trim(); const sugg = eerQ.length >= 2 && !eerNorm(eerQ) ? EER.codes.filter(c => (c[0] + ' ' + c[3]).toLowerCase().includes(eerQ.replace(/\s/g, '').toLowerCase()) || c[3].toLowerCase().includes(eerQ.toLowerCase())).slice(0, 5) : [];
  return {
    h: header('t', 'Richiedi quotazione', { back: '#/home' }), b: `
  ${N.err ? `<div class="err">${esc(N.err)}</div>` : ''}
  <div class="sec">Rifiuto (una richiesta = un solo rifiuto)</div>
  ${fld('Macroarea', sel('nr', 'macro', MACRO.map(x => x[0]), 'data-rr'), 1)}
  ${fld('Sottocategoria', sel('nr', 'sub', [['', 'Scegli…']].concat(subs).concat([['__altro', 'Altro (scrivi tu)']])), 1)}
  ${fv('nr', 'sub') === '__altro' ? fld('Quale rifiuto?', inp('nr', 'subx', 'Es. Rame in treccia')) : ''}
  ${fld('Descrizione (facoltativa)', inp('nr', 'descr', 'Es. cavi elettrici già separati'))}
  ${fld('Codice EER (facoltativo)', inp('nr', 'eer', 'Es. 17 04 01 oppure «rame»', 'text', 'data-live'), 0, sugg.length ? sugg.map(c => `<a href="#" data-act="nrEer" data-c="${c[0]}" class="tag">${eerNorm(c[0])}${c[1] ? '*' : ''} ${esc(c[3].slice(0, 40))}</a>`).join(' ') : 'Scrivi il codice o una parola per cercarlo. Non è obbligatorio.')}
  <div class="two">${fld('Quantità stimata', inp('nr', 'qty', 'Es. 350', 'text', 'inputmode="decimal"'))}${fld('Unità', sel('nr', 'unit', ['kg', 't', 'pezzi', 'm³', 'litri']))}</div>
  ${cbx('nr', 'transport', 'Serve il trasporto')}
  ${fld('Luogo di ritiro (facoltativo)', inp('nr', 'place', 'Comune, provincia'))}
  ${fld('Note', area('nr', 'note', 'Condizioni, tempi, stato del materiale…'))}
  ${photosBox('nr')}
  <div class="sec">Destinatari: aziende collegate</div>
  ${parts.length ? `<div class="list">${parts.map(p => `<label class="li"><input type="checkbox" data-act="nrTo" data-id="${p.id}" ${N.to[p.id] ? 'checked' : ''} style="width:20px;height:20px;accent-color:var(--green)">${avatar(p, 1)}<span class="sp"><b>${esc(p.name)}</b><span class="s">${esc(coTypes(p))} · ${esc(p.city)} (${esc(p.prov)})${coMacros(p).includes(N.macro) ? ' · <span class="tag g">tratta ' + esc(N.macro) + '</span>' : ''}</span></span></label>`).join('')}</div>` : '<div class="warn">Non hai ancora aziende collegate tra i gestori ambientali. <a href="#/companies/search"><b>Cerca aziende</b></a> e invia una richiesta di collegamento.</div>'}
  <button class="bt g" data-act="nrSend" ${canWrite(m) ? '' : 'disabled'}>Invia richiesta</button>
  <p class="hint">Le richieste sono private: le vedono solo le aziende che scegli.</p>` };
}
ACT.nrTo = el => { U.nr.to[el.dataset.id] = !U.nr.to[el.dataset.id]; };
ACT.nrEer = el => { setF('nr', 'eer', eerNorm(el.dataset.c)); render(); };
document.addEventListener('change', e => { if (e.target.getAttribute && e.target.getAttribute('data-f') === 'nr.macro') { setF('nr', 'sub', ''); render(); } });
ACT.nrSend = () => {
  const N = U.nr; const co = myCo(); const m = me();
  const sub = N.sub === '__altro' ? String(N.subx || '').trim() : N.sub;
  const to = Object.keys(N.to).filter(k => N.to[k]);
  const err = t => { N.err = t; render(); window.scrollTo(0, 0); };
  if (!sub) return err('Scegli la sottocategoria del rifiuto.');
  let eer = ''; if (String(N.eer || '').trim()) { eer = eerNorm(N.eer); if (!eer) return err('Codice EER non valido: 6 cifre, es. 17 04 01. Puoi anche lasciarlo vuoto.'); }
  if (!to.length) return err('Scegli almeno un\'azienda collegata.');
  const id = uid('rq_'); const r = { photos: (N.photos || []).slice(0, 3), num: 'RR-' + new Date().getFullYear() + '-' + num9(), from: co.id, by: m.id, to, macro: N.macro, sub, descr: String(N.descr || '').trim(), eer, qty: String(N.qty || '').trim(), unit: N.unit || 'kg', transport: !!N.transport, place: String(N.place || '').trim(), note: String(N.note || '').trim(), status: 'open', resp: {}, createdAt: nowISO() };
  put('reqs', id, r); log('Inviata la richiesta ' + r.num + ' (' + sub + ') a ' + to.map(coName).join(', '));
  U.nr = null; toast('Richiesta inviata a ' + to.length + ' aziend' + (to.length > 1 ? 'e' : 'a')); go('#/req/' + id);
};

/* fai / modifica quotazione */
function vMakeQuote(mode, id) {
  const co = myCo(); const m = me();
  if (!isG(co) || !canWrite(m)) return { h: header('t', 'Fai quotazione'), b: '<div class="warn">Solo i gestori ambientali con un ruolo abilitato inviano quotazioni.</div>' };
  if (!planOn(co)) return { h: header('t', 'Fai quotazione'), b: `<div class="card"><h3>Serve il piano per inviare</h3><span class="mut">Ricevere quotazioni e richieste è gratis. Per inviare quotazioni attiva il piano: ${eur(PRICE.m)} al mese o ${eur(PRICE.y)} all'anno, oppure usa un codice regalo.</span><button class="bt g" data-go="#/plan">Vai al piano</button></div>` };
  const key = mode + '/' + id;
  let r = null, old = null, to = '';
  if (mode === 'req') { r = get('reqs', id); if (!r) return { h: header('t', 'Fai quotazione'), b: '<div class="empty">Richiesta non trovata.</div>' }; to = r.from; }
  if (mode === 'edit') { old = get('quotes', id); if (!old) return { h: header('t', 'Modifica'), b: '<div class="empty">Quotazione non trovata.</div>' }; to = old.to; r = old.reqId ? get('reqs', old.reqId) : null; }
  if (mode === 'to') { to = id; }
  if (!U.mq || U.mq._k !== key) {
    const src = old || {};
    U.mq = { _k: key, dir: src.dir || 'offro', price: src.price || '', unit: src.unit || '€/kg', vat: src.vat || 'iva', transport: src.transport || 'escluso', tcost: src.tcost || '', vmode: src.validUntil ? 'date' : 'mod', validUntil: src.validUntil || '', note: src.note || '', macro: (r && r.macro) || src.macro || 'Metalli', sub: (r && r.sub) || src.sub || '', eer: (r && r.eer) || src.eer || '', descr: (r && r.descr) || src.descr || '' };
  }
  const Q = U.mq; const toCo = get('companies', to);
  return {
    h: header('t', mode === 'edit' ? 'Modifica quotazione' : 'Fai quotazione'), b: `
  <p class="sub">${mode === 'edit' ? 'Crea la versione V' + ((old.ver || 1) + 1) + ' per ' : 'Per '}<b>${esc(toCo ? toCo.name : '')}</b></p>
  ${Q.err ? `<div class="err">${esc(Q.err)}</div>` : ''}
  ${r ? `<div class="card"><dl class="dl"><dt>Rifiuto</dt><dd>${esc(r.sub)} · ${esc(r.macro)}${r.eer ? ' · ' + esc(r.eer) : ''}</dd><dt>Quantità</dt><dd>${r.qty ? esc(r.qty) + ' ' + esc(r.unit) : '—'}</dd><dt>Richiesta</dt><dd>${esc(r.num)}</dd></dl></div>`
      : `${fld('Macroarea', sel('mq', 'macro', MACRO.map(x => x[0])), 1)}${fld('Rifiuto', inp('mq', 'sub', 'Es. Rame'), 1)}${fld('Codice EER (facoltativo)', inp('mq', 'eer', 'Es. 17 04 01'))}`}
  <div class="lb">Direzione economica</div><div class="seg"><button class="${Q.dir === 'offro' ? 'on' : ''}" data-act="mqSet" data-k="dir" data-v="offro">Offro · pago io</button><button class="${Q.dir === 'richiedo' ? 'on' : ''}" data-act="mqSet" data-k="dir" data-v="richiedo">Richiedo · chiedo compenso</button><button class="${Q.dir === 'gratuito' ? 'on' : ''}" data-act="mqSet" data-k="dir" data-v="gratuito">Gratuito · nessun compenso</button></div>
  ${Q.dir === 'gratuito' ? '<div class="info sm">Nessun prezzo: il ritiro o il conferimento avviene senza compenso per nessuna delle due parti. Eventuali costi di trasporto si indicano qui sotto.</div>' : `<div class="two">${fld('Prezzo', inp('mq', 'price', 'Es. 4,60', 'text', 'inputmode="decimal"'), 1)}${fld('Unità', sel('mq', 'unit', ['€/kg', '€/t', '€/pezzo', '€ a corpo']))}</div>
  <div class="lb">Regime IVA</div><div class="seg"><button class="${Q.vat !== 'esente' ? 'on' : ''}" data-act="mqSet" data-k="vat" data-v="iva">+ IVA</button><button class="${Q.vat === 'esente' ? 'on' : ''}" data-act="mqSet" data-k="vat" data-v="esente">Esente IVA</button></div>`}
  ${fld('Trasporto', sel('mq', 'transport', [['incluso', 'Incluso'], ['escluso', 'Escluso'], ['separato', 'Costo separato']], 'data-rr'))}
  ${Q.transport === 'separato' ? fld('Costo trasporto (€)', inp('mq', 'tcost', 'Es. 120', 'text', 'inputmode="decimal"')) : ''}
  <div class="lb">Validità</div><div class="seg"><button class="${Q.vmode !== 'date' ? 'on' : ''}" data-act="mqSet" data-k="vmode" data-v="mod">Fino a modifica</button><button class="${Q.vmode === 'date' ? 'on' : ''}" data-act="mqSet" data-k="vmode" data-v="date">Con scadenza</button></div>
  ${Q.vmode === 'date' ? fld('Valida fino al', inp('mq', 'validUntil', '', 'date')) : ''}
  ${fld('Note e condizioni', area('mq', 'note', 'Es. materiale pulito, ritiro entro 5 giorni'))}
  <div class="info"><b>Nessun «accetta».</b> Il destinatario conferma solo di aver ricevuto la quotazione. RifiutiPro non assegna e non decide.</div>
  <button class="bt g" data-act="mqSend">${mode === 'edit' ? 'Invia la nuova versione' : 'Invia quotazione'}</button>` };
}
ACT.mqSet = el => { U.mq[el.dataset.k] = el.dataset.v; render(); };
ACT.mqSend = () => {
  const { r: rt, a: mode, b: id } = route(); const Q = U.mq; const co = myCo(); const m = me();
  const err = t => { Q.err = t; render(); window.scrollTo(0, 0); };
  const price = Q.dir === 'gratuito' ? '0' : String(Q.price).replace(',', '.').trim(); if (Q.dir !== 'gratuito' && (!price || !isFinite(Number(price)) || Number(price) < 0)) return err('Inserisci un prezzo valido.');
  if (Q.vmode === 'date' && !Q.validUntil) return err('Indica la data di scadenza.');
  let eer = ''; if (String(Q.eer || '').trim()) { eer = eerNorm(Q.eer); if (!eer) return err('Codice EER non valido.'); }
  const base = { dir: Q.dir, price, unit: Q.unit, vat: Q.vat === 'esente' ? 'esente' : 'iva', transport: Q.transport, tcost: Q.transport === 'separato' ? String(Q.tcost).replace(',', '.') : '', validUntil: Q.vmode === 'date' ? Q.validUntil : '', note: String(Q.note || '').trim(), updatedAt: nowISO() };
  if (mode === 'edit') {
    const old = get('quotes', id); const hist = (old.hist || []).concat([{ ver: old.ver || 1, price: old.price, unit: old.unit, at: old.updatedAt || old.createdAt }]);
    patch('quotes', id, Object.assign(base, { ver: (old.ver || 1) + 1, hist, seenAt: null, confirmedAt: null, confirmedBy: null }));
    log('Modificata la quotazione ' + old.num + ' (V' + ((old.ver || 1) + 1) + ')'); U.mq = null; toast('Nuova versione inviata'); return go('#/quote/' + id);
  }
  const r = mode === 'req' ? get('reqs', id) : null; const to = r ? r.from : id;
  const qid = uid('q_');
  const q = Object.assign({ num: 'RQ-' + new Date().getFullYear() + '-' + num9(), from: co.id, to, by: m.id, reqId: r ? r.id : null, macro: r ? r.macro : Q.macro, sub: r ? r.sub : String(Q.sub || '').trim(), eer: r ? r.eer : eer, descr: r ? r.descr : '', ver: 1, status: 'sent', createdAt: nowISO(), hist: [] }, base);
  if (!q.sub) return err('Indica il rifiuto.');
  put('quotes', qid, q); if (r) patch('reqs', r.id, { resp: { [co.id]: 'quoted' } });
  log('Inviata la quotazione ' + q.num + ' a ' + coName(to) + ' (' + q.sub + ', ' + money(price) + ' ' + q.unit + ')');
  U.mq = null; toast('Quotazione inviata'); go('#/quote/' + qid);
};
