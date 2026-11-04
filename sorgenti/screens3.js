ACT.nrTo = el => { U.nr.to[el.dataset.id] = !U.nr.to[el.dataset.id]; render(); };

/* ============ AZIENDE ============ */
function coRow(c) {
  const me_ = myCo(); const l = linkBetween(me_.id, c.id);
  const st = !l ? '' : l.status === 'active' ? stx('n', 'Collegata') : (l.a === me_.id ? stx('w', 'Richiesta inviata') : stx('c', 'Ti ha chiesto'));
  return `<a class="li" data-go="#/company/${c.id}">${avatar(c, 1)}<span class="sp"><b>${esc(c.name)}</b><span class="s">${esc(coTypes(c))} · ${esc(c.city)} (${esc(c.prov)})</span>${coMacros(c).length ? `<span class="s">${coMacros(c).slice(0, 4).map(x => `<span class="tag">${esc(x)}</span>`).join('')}</span>` : ''}</span>${st}</a>`;
}
function vCompanies(tab) {
  const co = myCo(); tab = tab || 'linked';
  let b = '';
  if (tab === 'linked') { const P = partners(co.id); b = P.length ? `<div class="list">${P.map(coRow).join('')}</div>` : '<div class="empty">Nessuna azienda collegata. Cercale e invia una richiesta di collegamento.</div><button class="bt" data-go="#/companies/search">Cerca aziende</button>'; }
  else if (tab === 'req') {
    const inc = linkReqsToMe(); const out = all('links').filter(l => l.status === 'pending' && l.a === co.id);
    b = `<div class="sec">Ricevute</div>${inc.length ? `<div class="list">${inc.map(l => { const c = get('companies', l.a); return `<div class="card"><div class="row">${avatar(c, 1)}<span class="sp"><b>${esc(c.name)}</b><div class="mut sm">${esc(coTypes(c))} · ${esc(c.city)} (${esc(c.prov)})</div></span></div>${l.msg ? `<div class="sm">«${esc(l.msg)}»</div>` : ''}${(l.interests || []).length ? `<div>${l.interests.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : ''}<div class="two"><button class="bt gh s" data-act="linkNo" data-id="${l.id}">Rifiuta</button><button class="bt g s" data-act="linkYes" data-id="${l.id}">Accetta collegamento</button></div><a href="#/company/${c.id}" class="sm">Vedi profilo</a></div>`; }).join('')}</div>` : '<div class="empty">Nessuna richiesta ricevuta.</div>'}
    <div class="sec">Inviate</div>${out.length ? `<div class="list">${out.map(l => coRow(get('companies', l.b))).join('')}</div>` : '<div class="empty">Nessuna richiesta inviata.</div>'}`;
  } else {
    const S = U.cs || (U.cs = { q: '', type: '', prov: '', macro: '' });
    const q = String(fv('cs', 'q')).toLowerCase().trim(); const type = fv('cs', 'type'); const prov = String(fv('cs', 'prov')).toUpperCase().trim(); const macro = fv('cs', 'macro'); const eer = String(fv('cs', 'eer')).replace(/\D/g, '');
    const L = all('companies').filter(c => c.id !== co.id && c.kind === 'gestore')
      .filter(c => !q || (c.name + ' ' + c.city).toLowerCase().includes(q))
      .filter(c => !type || (c.types || []).includes(type))
      .filter(c => !prov || c.prov === prov)
      .filter(c => !macro || coMacros(c).includes(macro))
      .filter(c => !eer || coEers(c).some(e => e.replace(/\D/g, '').startsWith(eer)))
      .sort((a, b) => (b.prov === co.prov) - (a.prov === co.prov) || a.name.localeCompare(b.name));
    b = `${adSmall()}<div class="sr">${IC.search}<input data-f="cs.q" data-live value="${esc(fv('cs', 'q'))}" placeholder="Nome o comune"></div>
    <div class="two">${sel('cs', 'type', [['', 'Tutti i tipi'], ['impianto', 'Impianto'], ['trasportatore', 'Trasportatore'], ['intermediario', 'Intermediario']])}${sel('cs', 'macro', [['', 'Tutti i rifiuti']].concat(MACRO.map(x => x[0])))}</div>
    <div class="two"><input class="in" data-f="cs.prov" data-live maxlength="2" placeholder="Provincia (es. SR)" value="${esc(fv('cs', 'prov'))}" style="text-transform:uppercase"><input class="in mono" data-f="cs.eer" data-live placeholder="Codice EER" value="${esc(fv('cs', 'eer'))}"></div>
    <span class="hint">${L.length === 1 ? '1 gestore ambientale trovato' : L.length + ' gestori ambientali trovati'} · prima quelli della tua provincia. Nessun filtro per chilometri.</span>
    ${L.length ? `<div class="list">${L.map(coRow).join('')}</div>` : '<div class="empty">Nessuna azienda con questi filtri.</div>'}`;
  }
  const nr = linkReqsToMe().length;
  return { h: header('home'), t: 'companies', b: `<h2 class="ttl">Aziende</h2><div class="seg"><a href="#/companies/linked" class="${tab === 'linked' ? 'on' : ''}">Collegate</a><a href="#/companies/req" class="${tab === 'req' ? 'on' : ''}">Richieste${nr ? ' (' + nr + ')' : ''}</a><a href="#/companies/search" class="${tab === 'search' ? 'on' : ''}">Cerca</a></div>${b}` };
}
ACT.linkYes = el => { const l = get('links', el.dataset.id); patch('links', l.id, { status: 'active', acceptedAt: nowISO(), acceptedBy: meId() }); log('Accettato il collegamento con ' + coName(l.a)); log(coName(l.b) + ' ha accettato il collegamento', l.a); toast('Collegamento attivo'); };
ACT.linkNo = el => { const l = get('links', el.dataset.id); confirmBox('Rifiutare la richiesta?', 'L\'altra azienda potrà inviarne una nuova più avanti.', 'Rifiuta', () => { del('links', l.id); log('Rifiutato il collegamento con ' + coName(l.a)); }); };

function vCompany(id) {
  const c = get('companies', id); const co = myCo(); const m = me();
  if (!c) return { h: header('t', 'Azienda', { back: '#/companies' }), b: '<div class="empty">Azienda non trovata.</div>' };
  if (c.id === co.id) { go('#/coedit'); return { b: '' }; }
  const l = linkBetween(co.id, c.id); const on = l && l.status === 'active';
  let act = '';
  if (on) act = `<div class="two">${isG(c) && canWrite(m) ? `<button class="bt g" data-act="reqTo" data-id="${c.id}">Richiedi quotazione</button>` : ''}<button class="bt gh" data-go="#/chat/${c.id}">${IC.chat} Chat</button></div>${isG(co) && canWrite(m) ? `<button class="bt ln" data-go="#/makequote/to/${c.id}">Invia una quotazione</button>` : ''}<a href="#" class="sm" data-act="unlink" data-id="${l.id}" style="color:var(--red);text-align:center">Interrompi collegamento</a>`;
  else if (l && l.a === co.id) act = `<div class="info">Richiesta di collegamento inviata il ${fDT(l.createdAt)}. In attesa di risposta.</div><button class="bt gh" data-act="linkCancel" data-id="${l.id}">Annulla richiesta</button>`;
  else if (l) act = `<div class="info">${esc(c.name)} ti ha chiesto di collegarvi${l.msg ? ': «' + esc(l.msg) + '»' : '.'}</div><div class="two"><button class="bt gh" data-act="linkNo" data-id="${l.id}">Rifiuta</button><button class="bt g" data-act="linkYes" data-id="${l.id}">Accetta</button></div>`;
  else act = canWrite(m) ? `<button class="bt" data-go="#/linkreq/${c.id}">Invia richiesta di collegamento</button>` : '';
  const auth = c.auth || {}; const ad = auth.declared;
  const W = {}; (c.waste || []).forEach(w => (W[w.m] = W[w.m] || []).push(w));
  return {
    h: header('t', 'Profilo azienda', { back: '#/companies' }), t: 'companies', b: `
  <div class="card" style="align-items:center;text-align:center">${avatar(c).replace('class="av', 'style="width:72px;height:72px;font-size:26px;border-radius:20px" class="av')}<b style="font-size:20px">${esc(c.name)}</b><div class="mut">${esc(c.city)} (${esc(c.prov)})</div><div>${isG(c) ? (c.types || []).map(t => `<span class="tag g">${TYPES[t]}</span>`).join('') : '<span class="tag">Visualizzatore</span>'}${ad ? '<span class="tag">Dati autorizzativi dichiarati</span>' : ''}</div>${c.pres ? `<p class="sm" style="margin:0">${esc(c.pres)}</p>` : ''}</div>
  ${act}${favBtn('companies', c.id)}
  <div class="card"><h3>Contatti</h3>${on ? `<dl class="dl"><dt>Indirizzo</dt><dd>${esc(c.addr || '—')}, ${esc(c.city)} (${esc(c.prov)})</dd><dt>Telefono</dt><dd>${c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : '—'}</dd><dt>Email</dt><dd>${esc(c.email || '—')}</dd>${c.piva ? `<dt>P. IVA</dt><dd>${esc(c.piva)}</dd>` : ''}</dl>` : `<div class="lock">${IC.lock} Telefono, email e indirizzo sono visibili solo dopo il collegamento.</div>`}</div>
  ${isG(c) ? `<div class="card"><h3>Rifiuti trattati</h3>${Object.keys(W).length ? Object.keys(W).map(mc => `<div><b class="sm">${esc(mc)}</b><div>${W[mc].map(w => `<span class="tag">${esc(w.s)}</span>${(w.rows || []).filter(r => r.e || r.d).map(r => `<span class="tag g mono">${esc(r.e || '')} ${esc(r.d || '')}</span>`).join('')}`).join('')}</div></div>`).join('') : '<span class="mut sm">Non ancora indicati.</span>'}</div>` : ''}
  ${isG(c) && ad ? `<div class="card"><h3>Autorizzazioni dichiarate</h3>${auth.impianto && auth.impianto.num ? `<div class="sm"><b>Impianto:</b> ${esc(auth.impianto.tipo)} n. ${esc(auth.impianto.num)}${auth.impianto.ente ? ', ' + esc(auth.impianto.ente) : ''}${auth.impianto.scad ? ', scade il ' + fDate(auth.impianto.scad) : ''}</div>` : ''}${auth.trasportatore && auth.trasportatore.albo ? `<div class="sm"><b>Trasportatore:</b> Albo n. ${esc(auth.trasportatore.albo)}${auth.trasportatore.cat ? ', cat. ' + esc(auth.trasportatore.cat) : ''}</div>` : ''}${auth.intermediario && auth.intermediario.albo ? `<div class="sm"><b>Intermediario:</b> Albo n. ${esc(auth.intermediario.albo)}</div>` : ''}<span class="hint">Dati dichiarati dall'azienda sotto la propria responsabilità.</span></div>` : ''}
  ${!on ? '' : `<p class="hint">Il collegamento è reciproco e si può interrompere in ogni momento.</p>`}` };
}
ACT.reqTo = el => { U.nr = { macro: 'Metalli', sub: '', unit: 'kg', to: { [el.dataset.id]: true }, _pre: 1 }; go('#/newreq'); };
ACT.unlink = el => { const l = get('links', el.dataset.id); const other = l.a === myCo().id ? l.b : l.a; confirmBox('Interrompere il collegamento?', 'Non vedrete più i contatti reciproci e non potrete scambiare nuove richieste. Le quotazioni già inviate restano nello storico.', 'Interrompi', () => { del('links', l.id); log('Interrotto il collegamento con ' + coName(other)); }, 1); };
ACT.linkCancel = el => { const l = get('links', el.dataset.id); del('links', l.id); log('Annullata la richiesta di collegamento a ' + coName(l.b)); };

function vLinkReq(id) {
  const c = get('companies', id); const co = myCo();
  if (!U.lr || U.lr._id !== id) U.lr = { _id: id, msg: `Buongiorno, siamo ${co.name}. Possiamo collegarci?`, int: {} };
  const L = U.lr; const opts = (coMacros(c).length ? coMacros(c) : MACRO.map(x => x[0])).slice(0, 10);
  return {
    h: header('t', 'Richiesta di collegamento', { back: '#/company/' + id }), b: `
  <p class="sub">Presentati a <b>${esc(c.name)}</b></p>
  <div class="co">${avatar(c, 1)}<span class="sp"><b>${esc(c.name)}</b><div class="mut sm">${esc(coTypes(c))} · ${esc(c.city)} (${esc(c.prov)})</div></span></div>
  ${L.err ? `<div class="err">${esc(L.err)}</div>` : ''}
  ${fld('Messaggio (facoltativo)', area('lr', 'msg'), 0, 'Da 10 a 500 caratteri. Non inserire dati personali di terzi.')}
  <div class="lb">Rifiuti di interesse</div><div class="chips">${opts.map(o => chip(L.int[o], 'lrInt', o, `data-k="${esc(o)}"`)).join('')}</div>
  <div class="info"><b>Cosa vedrà l'altra azienda:</b> nome, città, rifiuti trattati e il tuo messaggio. Telefono ed email restano nascosti finché non accetta.</div>
  <div class="two"><button class="bt gh" data-go="#/company/${id}">Annulla</button><button class="bt" data-act="lrSend">Invia richiesta</button></div>` };
}
ACT.lrInt = el => { const k = el.dataset.k; U.lr.int[k] = !U.lr.int[k]; render(); };
ACT.lrSend = () => {
  const { a: id } = route(); const L = U.lr; const co = myCo(); const msg = String(L.msg || '').trim();
  if (msg && (msg.length < 10 || msg.length > 500)) { L.err = 'Il messaggio deve avere tra 10 e 500 caratteri.'; return render(); }
  if (linkBetween(co.id, id)) return go('#/company/' + id);
  put('links', uid('ln_'), { a: co.id, b: id, status: 'pending', msg, interests: Object.keys(L.int).filter(k => L.int[k]), createdAt: nowISO(), by: meId() });
  log('Inviata richiesta di collegamento a ' + coName(id)); U.lr = null; toast('Richiesta inviata'); go('#/company/' + id);
};

/* ============ CHAT ============ */
function vChats() {
  const co = myCo();
  const P = partners(co.id);
  const rows = P.map(p => { const c = D.chats[chatKey(co.id, p.id)]; const last = c && c.msgs && c.msgs[c.msgs.length - 1]; const unread = last && last.co !== co.id && (!c.read || !c.read[co.id] || c.read[co.id] < last.at); return { p, last, unread }; })
    .sort((a, b) => String(b.last ? b.last.at : '').localeCompare(String(a.last ? a.last.at : '')));
  return { h: header('home'), t: isField(me()) ? 'chat' : 'home', b: `<h2 class="ttl">Chat</h2><p class="sub">Con le aziende collegate</p>${rows.length ? `<div class="list">${rows.map(({ p, last, unread }) => `<a class="li" data-go="#/chat/${p.id}">${avatar(p, 1)}<span class="sp"><b>${esc(p.name)}</b><span class="s">${last ? esc((last.co === co.id ? 'Tu: ' : '') + last.text).slice(0, 70) : 'Nessun messaggio'}</span></span>${unread ? stx('n', 'Nuovo') : last ? `<span class="xs mut">${fDT(last.at)}</span>` : ''}</a>`).join('')}</div>` : '<div class="empty">La chat si apre con le aziende collegate.</div>'}` };
}
function vChat(id) {
  const co = myCo(); const c = get('companies', id);
  if (!c || !linked(co.id, id)) return { h: header('t', 'Chat', { back: '#/chats' }), b: '<div class="empty">La chat è disponibile solo tra aziende collegate.</div>' };
  const key = chatKey(co.id, id); const ch = D.chats[key]; const msgs = (ch && ch.msgs) || [];
  const last = msgs[msgs.length - 1];
  if (last && last.co !== co.id && (!ch.read || !ch.read[co.id] || ch.read[co.id] < last.at)) setTimeout(() => patch('chats', key, { read: { [co.id]: last.at } }), 0);
  return {
    h: header('t', c.name, { back: '#/chats' }), b: `<div class="msgs">${msgs.length ? msgs.map(x => `<div class="msg ${x.co === co.id ? 'me' : ''}">${esc(x.text)}<small>${esc(x.name)} · ${fDT(x.at)}</small></div>`).join('') : '<div class="empty">Scrivi il primo messaggio.</div>'}</div>
  <div class="cbar"><input class="in" data-f="chat.t" data-enter="chatSend" placeholder="Scrivi un messaggio" value="${esc(fv('chat', 't'))}"><button class="bt s" data-act="chatSend" aria-label="Invia" style="width:52px">${IC.send.replace('<svg', '<svg width="20" height="20"')}</button></div>`,
    after: () => { const el = document.querySelector('.msgs'); if (el && msgs.length) window.scrollTo(0, document.body.scrollHeight); }, top: 1
  };
}
ACT.chatSend = () => {
  const { a: id } = route(); const co = myCo(); const m = me(); const t = String(fv('chat', 't')).trim(); if (!t) return;
  const key = chatKey(co.id, id); const cur = D.chats[key] ? clone(D.chats[key]) : { a: [co.id, id].sort()[0], b: [co.id, id].sort()[1], msgs: [], read: {} };
  const at = nowISO(); cur.msgs = (cur.msgs || []).concat([{ co: co.id, mid: m.id, name: memName(m.id), text: t.slice(0, 2000), at }]).slice(-300); cur.read = Object.assign({}, cur.read, { [co.id]: at });
  setF('chat', 't', ''); put('chats', key, cur);
};

/* ============ CODICI EER ============ */
function vEer() {
  const q = String(fv('eq', 'q')).toLowerCase().trim(); const qd = q.replace(/\s/g, '');
  const L = EER.codes.filter(c => !q || c[0].startsWith(qd) || c[3].toLowerCase().includes(q));
  const byCh = {}; L.forEach(c => (byCh[c[0].slice(0, 2)] = byCh[c[0].slice(0, 2)] || []).push(c));
  const chs = Object.keys(byCh).sort();
  return {
    h: header('home'), t: 'eer', b: `<h2 class="ttl">Codici EER</h2><p class="sub">Elenco europeo dei rifiuti · codici più usati nel settore</p>
  <div class="sr">${IC.search}<input data-f="eq.q" data-live value="${esc(fv('eq', 'q'))}" placeholder="Codice (con o senza spazi) o parola"></div>
  <a class="wide w-teal" href="#/fotoeer"><span class="vi">${IC.cam}</span><span><b>Non trovi il codice?</b><small>Codice EER da foto</small></span><span class="ar">›</span></a>
  ${chs.map(ch => `<div class="sec">${ch} · ${esc((EER.ch[ch] || '').slice(0, 70))}${(EER.ch[ch] || '').length > 70 ? '…' : ''}</div><div class="list">${byCh[ch].map(c => `<a class="li" data-go="#/eercode/${c[0]}"><span class="mono" style="font-weight:800;min-width:78px">${eerNorm(c[0])}${c[1] ? '*' : ''}</span><span class="sp sm">${esc(c[3])}</span>${c[1] ? stx('r', 'Pericoloso') : ''}</a>`).join('')}</div>`).join('') || '<div class="empty">Nessun codice trovato.</div>'}
  ${adSmall()}<p class="hint">Il prototipo contiene i codici più usati: la versione definitiva caricherà l'elenco ufficiale completo (Decisione 2000/532/CE come modificata dalla 2014/955/UE). La classificazione resta responsabilità del produttore del rifiuto.</p>` };
}
function vEerCode(code) {
  const c = eerFind(code); if (!c) return { h: header('t', 'Codice EER', { back: '#/eer' }), b: '<div class="empty">Codice non trovato.</div>' };
  const n = eerNorm(c[0]) + (c[1] ? '*' : ''); const co = myCo(); const m = me();
  const who = all('companies').filter(x => x.kind === 'gestore' && x.id !== co.id && coEers(x).some(e => e.replace(/\D/g, '') === c[0]));
  return {
    h: header('t', 'Codice EER', { back: '#/eer' }), t: 'eer', b: `<div class="card"><span class="mono" style="font-size:30px;font-weight:800">${n}</span><b>${esc(c[3])}</b><div>${c[1] ? stx('r', 'Pericoloso') : stx('n', 'Non pericoloso')} ${c[2] ? stx('w', 'Voce a specchio') : ''}</div><span class="sm mut">Capitolo ${c[0].slice(0, 2)}: ${esc(EER.ch[c[0].slice(0, 2)] || '')}</span>${c[2] ? '<div class="warn">Voce a specchio: la scelta tra la versione pericolosa e quella non pericolosa dipende dalla presenza di sostanze pericolose (di solito serve un\'analisi).</div>' : ''}</div>
  ${!isField(m) && canWrite(m) ? `<button class="bt g" data-act="reqEer" data-c="${c[0]}">Richiedi quotazione con questo codice</button>` : ''}
  ${!isField(m) ? `<div class="card"><h3>Aziende che lo trattano</h3>${who.length ? `<div class="list">${who.map(coRow).join('')}</div>` : '<span class="mut sm">Nessuna azienda ha ancora indicato questo codice.</span>'}</div>` : ''}` };
}
ACT.reqEer = el => { const c = eerFind(el.dataset.c); U.nr = { macro: 'Metalli', sub: '__altro', subx: c[3].slice(0, 60), unit: 'kg', to: {}, eer: eerNorm(c[0]) + (c[1] ? '*' : '') }; go('#/newreq'); };

/* ============ PROFILO e IMPOSTAZIONI ============ */
function vProfile() {
  const m = me(); const co = myCo(); const g = isG(co);
  const it = (href, ic, t, s) => `<a class="li" href="${href}">${ic.replace('<svg', '<svg width="24" height="24" style="color:var(--blue);flex:none"')}<span class="sp"><b>${t}</b>${s ? `<span class="s">${s}</span>` : ''}</span><span class="chev">›</span></a>`;
  const pend = memberReqs().length;
  return {
    h: header('home'), t: 'profile', b: `<div class="co">${avatar(co)}<span class="sp"><b>${esc(memName(m.id))}</b><div class="mut sm">${esc(m.email)}</div><div class="mut sm">${esc(ROLES[m.role])} · ${esc(co.name)}</div></span></div>
  <div class="list">
  ${it('#/me', IC.user, 'Il mio account', 'Nome, email')}
  ${canWrite(m) ? it('#/coedit', IC.building, 'Profilo azienda', 'Dati, attività, presentazione') : ''}
  ${g && canWrite(m) ? it('#/waste', IC.list, 'Rifiuti trattati', (co.waste || []).length + ' sottocategorie') : ''}
  ${g && canWrite(m) ? it('#/auth', IC.shield, 'Autorizzazioni', co.auth && co.auth.declared ? 'Dati dichiarati' : 'Facoltative · da completare') : ''}
  ${canTeam(m) ? it('#/team', IC.people, 'Team e accessi', 'PIN aziendale' + (pend ? ' · ' + pend + ' richieste in attesa' : '')) : ''}
  ${canWrite(m) || canTeam(m) ? it('#/logs', IC.book, 'Registro attività', 'Accessi e operazioni') : ''}
  ${g && !isField(m) ? it('#/plan', IC.card, 'Il tuo piano', planOn(co) ? 'Attivo fino al ' + fDate(co.plan.until) : 'Ricevi gratis · invio non attivo') : ''}
  ${it('#/guide', IC.help, 'Guida alla prova', 'Come provare l\'app con Alessio')}
  ${it('#/privacy', IC.lock, 'Privacy, notifiche e password', 'Preferenze, esporta i dati, cancellazione')}${it('#/help', IC.help, 'Aiuto e assistenza', 'Domande frequenti, scrivi all\'assistenza')}
  </div>
  <button class="bt gh" data-act="logout">${IC.out.replace('<svg', '<svg width="20" height="20"')} Esci</button>${ftr()}` };
}
function vMyAccount() {
  const m = me();
  if (!U.ma || U.ma._id !== m.id) U.ma = { _id: m.id, name: m.name, surname: m.surname };
  return { h: header('t', 'Il mio account', { back: '#/profile' }), t: 'profile', b: `${fld('Nome', inp('ma', 'name'))}${fld('Cognome', inp('ma', 'surname'))}${fld('Email', `<input class="in" value="${esc(m.email)}" disabled>`, 0, 'Per cambiare email serve una nuova verifica (fase 2).')}<button class="bt" data-act="maSave">Salva</button>` };
}
ACT.maSave = () => { const m = me(); patch('members', m.id, { name: String(U.ma.name).trim() || m.name, surname: String(U.ma.surname).trim() }); toast('Salvato'); go('#/profile'); };
function vCoEdit() {
  const co = myCo(); const m = me(); const g = isG(co);
  if (!U.ce || U.ce._id !== co.id) U.ce = { _id: co.id, name: co.name, piva: co.piva, cf: co.cf, addr: co.addr, city: co.city, prov: co.prov, phone: co.phone, email: co.email, pres: co.pres, types: (co.types || []).slice() };
  const C = U.ce;
  return {
    h: header('t', 'Profilo azienda', { back: '#/profile' }), t: 'profile', b: `${C.err ? `<div class="err">${esc(C.err)}</div>` : ''}
  <div class="info">Tipo di account: <b>${g ? 'Gestore ambientale' : (co.priv ? 'Privato (Visualizzatore)' : 'Visualizzatore')}</b></div>
  ${fld(co.priv ? 'Nome e cognome' : 'Ragione sociale', inp('ce', 'name'), 1)}${co.priv ? '' : fld('Partita IVA', inp('ce', 'piva'), 1)}${fld('Codice fiscale', inp('ce', 'cf'))}
  ${fld('Indirizzo', inp('ce', 'addr'))}<div class="two">${fld('Comune', inp('ce', 'city'), 1)}${fld('Provincia', inp('ce', 'prov', '', 'text', 'maxlength="2"'), 1)}</div>
  <div class="two">${fld('Telefono', inp('ce', 'phone', '', 'tel'))}${fld('Email aziendale', inp('ce', 'email', '', 'email'))}</div>
  ${g ? `<div class="lb">Attività</div><div class="chips">${Object.keys(TYPES).map(k => chip(C.types.includes(k), 'ceType', TYPES[k], `data-k="${k}"`)).join('')}</div>` : ''}
  ${fld('Presentazione', area('ce', 'pres', 'Chi siete, cosa fate, orari…'))}
  ${logoBox()}
  <button class="bt" data-act="ceSave" ${canWrite(m) ? '' : 'disabled'}>Salva</button>` };
}
ACT.ceType = el => { const t = U.ce.types; const i = t.indexOf(el.dataset.k); if (i >= 0) t.splice(i, 1); else t.push(el.dataset.k); render(); };
ACT.ceSave = () => {
  const C = U.ce; const co = myCo(); const g = isG(co); const f = k => String(C[k] || '').trim();
  if (!f('name')) { C.err = 'Il nome è obbligatorio.'; return render(); }
  if (!co.priv && !/^\d{11}$/.test(f('piva'))) { C.err = 'La Partita IVA ha 11 cifre.'; return render(); }
  if (!f('city') || !/^[A-Za-z]{2}$/.test(f('prov'))) { C.err = 'Comune e provincia (2 lettere) sono obbligatori.'; return render(); }
  if (g && !C.types.length) { C.err = 'Scegli almeno un\'attività.'; return render(); }
  patch('companies', co.id, { logo: C.logo || co.logo || '', name: f('name'), piva: f('piva'), cf: f('cf'), addr: f('addr'), city: f('city'), prov: f('prov').toUpperCase(), phone: f('phone'), email: f('email'), pres: f('pres'), types: g ? C.types.slice() : [] });
  log('Aggiornato il profilo azienda'); U.ce = null; toast('Profilo salvato'); go('#/profile');
};
function vWaste() {
  const co = myCo();
  if (!U.waste || U.waste._id !== co.id) { U.waste = { _id: co.id }; wInit('waste', co.waste || []); }
  return { h: header('t', 'Rifiuti che tratti', { back: '#/profile' }), t: 'profile', b: `${U.waste.err ? `<div class="err">${esc(U.waste.err)}</div>` : ''}${wasteEditor('waste')}<button class="bt g" data-act="wSave">Salva</button><p class="hint">Le aziende che ti cercano vedono macroaree, sottocategorie, descrizioni e codici EER che indichi qui.</p>` };
}
ACT.wSave = () => { const co = myCo(); const w = wasteFromForm('waste'); if (w.err) { U.waste.err = w.err; return render(); } patch('companies', co.id, { waste: w.list }); log('Aggiornati i rifiuti trattati (' + w.list.length + ' sottocategorie)'); U.waste = null; toast('Rifiuti trattati salvati'); go('#/profile'); };
function vAuth() {
  const co = myCo(); const a = co.auth || {};
  if (!U.au || U.au._id !== co.id) U.au = { _id: co.id, imp_tipo: (a.impianto || {}).tipo || '', imp_num: (a.impianto || {}).num || '', imp_ente: (a.impianto || {}).ente || '', imp_scad: (a.impianto || {}).scad || '', tr_albo: (a.trasportatore || {}).albo || '', tr_cat: (a.trasportatore || {}).cat || '', int_albo: (a.intermediario || {}).albo || '', decl: !!a.declared, afiles: (a.files || []).slice() };
  return { h: header('t', 'Autorizzazioni', { back: '#/profile' }), t: 'profile', b: `<div class="info">Sezione facoltativa. ${a.declared ? 'Dichiarazione resa il ' + fDT(a.declAt) + '.' : ''}</div>${U.au.err ? `<div class="err">${esc(U.au.err)}</div>` : ''}${authForm('au', co.types || [])}<button class="bt" data-act="auSave" ${authFilled('au') && !fv('au', 'decl') ? 'disabled' : ''}>Salva</button>` };
}
ACT.auSave = () => { const co = myCo(); if (authFilled('au') && !fv('au', 'decl')) { U.au.err = 'Spunta la dichiarazione di responsabilità.'; return render(); } patch('companies', co.id, { auth: authFromForm('au') }); log('Aggiornate le autorizzazioni'); U.au = null; toast('Salvato'); go('#/profile'); };

function vTeam() {
  const co = myCo(); const m = me();
  if (!canTeam(m)) return { h: header('t', 'Team e accessi', { back: '#/profile' }), b: '<div class="warn">Solo amministratore e uffici gestiscono il team.</div>' };
  const mem = all('members').filter(x => x.co === co.id);
  const pend = mem.filter(x => x.status === 'pending'); const act = mem.filter(x => x.status !== 'pending');
  const roleOpts = r => Object.keys(ROLES).map(k => `<option value="${k}" ${r === k ? 'selected' : ''}>${ROLES[k]}</option>`).join('');
  return {
    h: header('t', 'Team e accessi', { back: '#/profile' }), t: 'profile', b: `
  <div class="card" style="text-align:center"><b>PIN aziendale per registrarsi</b><div class="pin">${esc(String(co.pin).slice(0, 3))} ${esc(String(co.pin).slice(3))}</div><span class="sm mut">Dallo a dipendenti e colleghi: lo inseriscono in «Registrati con il PIN aziendale» insieme a nome, cognome ed email. Si trova sempre qui: Profilo › Team e accessi.</span><div class="two"><button class="bt gh s" data-act="pinCopy">Copia</button><button class="bt ln s" data-act="pinNew">Nuovo PIN</button></div><span class="hint">«Nuovo PIN»: quello attuale smette subito di funzionare; chi è già registrato non perde l'accesso.</span></div>
  <div class="sec">Richieste di accesso</div>${pend.length ? pend.map(x => `<div class="card"><div class="row"><span class="av sm ${avc(x.id)}">${esc(initials(memName(x.id)))}</span><span class="sp"><b>${esc(memName(x.id))}</b><div class="xs mut">${esc(x.email)} · ${fDT(x.createdAt)}</div></span></div><div class="fl"><label>Ruolo o reparto</label><select class="in" id="role_${x.id}">${roleOpts(x.role || 'operatore')}</select></div><div class="two"><button class="bt gh s" data-act="memNo" data-id="${x.id}">Rifiuta</button><button class="bt g s" data-act="memYes" data-id="${x.id}">Approva</button></div></div>`).join('') : '<div class="empty">Nessuna richiesta in attesa.</div>'}
  <div class="sec">Membri</div><div class="list">${act.map(x => `<div class="card"><div class="row"><span class="av sm ${avc(x.id)}">${esc(initials(memName(x.id)))}</span><span class="sp"><b>${esc(memName(x.id))}${x.id === m.id ? ' <span class="tag">Tu</span>' : ''}</b><div class="xs mut">${esc(x.email)}${x.lastLogin ? ' · ultimo accesso ' + fDT(x.lastLogin) : ''}</div></span>${x.status === 'suspended' ? stx('r', 'Sospeso') : ''}</div>
   ${x.id === m.id ? `<span class="sm mut">${ROLES[x.role]}</span>` : `<div class="fl"><label>Ruolo o reparto</label><select class="in" data-act-change="memRole" data-id="${x.id}">${roleOpts(x.role)}</select></div><div class="two">${x.status === 'suspended' ? `<button class="bt ln s" data-act="memUnsusp" data-id="${x.id}">Riattiva accesso</button>` : `<button class="bt gh s" data-act="memSusp" data-id="${x.id}">Sospendi</button>`}<button class="bt rd s" data-act="memDel" data-id="${x.id}">Rimuovi</button></div>`}</div>`).join('')}</div>
  <a class="li" href="#/logs">${IC.book.replace('<svg', '<svg width="22" height="22" style="color:var(--blue)"')}<span class="sp"><b>Registro attività</b><span class="s">Accessi e operazioni di tutti</span></span><span class="chev">›</span></a>
  <p class="hint">Ruoli: Amministratore (tutto), Visualizza e modifica, Solo visualizzazione, Uffici (gestiscono anche gli accessi), Operatori e Autisti (menu ridotto, senza prezzi).</p>` };
}
document.addEventListener('change', e => { const a = e.target.getAttribute && e.target.getAttribute('data-act-change'); if (a === 'memRole') { const x = get('members', e.target.dataset.id); patch('members', x.id, { role: e.target.value }); log('Ruolo di ' + memName(x.id) + ' cambiato in ' + ROLES[e.target.value]); toast('Ruolo aggiornato'); } });
ACT.pinCopy = () => { const co = myCo(); try { navigator.clipboard.writeText(co.pin); toast('PIN copiato'); } catch (e) { toast('PIN: ' + co.pin); } };
ACT.pinNew = () => confirmBox('Generare un nuovo PIN?', 'Il PIN attuale smette subito di funzionare.', 'Nuovo PIN', () => { const co = myCo(); patch('companies', co.id, { pin: newPin() }); log('Generato un nuovo PIN aziendale'); });
ACT.memYes = el => { const x = get('members', el.dataset.id); const r = (document.getElementById('role_' + x.id) || {}).value || 'operatore'; patch('members', x.id, { status: 'active', role: r, approvedBy: meId(), approvedAt: nowISO() }); log('Approvato l\'accesso di ' + memName(x.id) + ' come ' + ROLES[r]); toast('Accesso approvato'); };
ACT.memNo = el => { const x = get('members', el.dataset.id); confirmBox('Rifiutare la richiesta?', esc(memName(x.id)) + ' non potrà accedere.', 'Rifiuta', () => { del('members', x.id); log('Rifiutata la richiesta di accesso di ' + memName(x.id)); }); };
ACT.memSusp = el => { const x = get('members', el.dataset.id); patch('members', x.id, { status: 'suspended' }); log('Sospeso l\'accesso di ' + memName(x.id)); };
ACT.memUnsusp = el => { const x = get('members', el.dataset.id); patch('members', x.id, { status: 'active' }); log('Riattivato l\'accesso di ' + memName(x.id)); };
ACT.memDel = el => { const x = get('members', el.dataset.id); confirmBox('Rimuovere ' + memName(x.id) + '?', 'Perde l\'accesso all\'azienda. Le sue operazioni restano nel registro.', 'Rimuovi', () => { log('Rimosso ' + memName(x.id) + ' dal team'); del('members', x.id); }, 1); };
function vLogs() {
  const co = myCo(); const L = (D.logs[co.id] && D.logs[co.id].items) || [];
  return { h: header('t', 'Registro attività', { back: '#/profile' }), t: 'profile', b: `<p class="sub">Accessi e operazioni di tutti i membri di ${esc(co.name)}. Visibile solo alla tua azienda.</p>${L.length ? `<div class="card">${L.map(l => `<div class="row sm" style="border-bottom:1px solid var(--line);padding-bottom:8px"><span class="sp">${esc(l.t)}<div class="xs mut">${esc(l.who || '—')}</div></span><span class="xs mut" style="white-space:nowrap">${fDT(l.at)}</span></div>`).join('')}</div>` : '<div class="empty">Ancora vuoto.</div>'}<p class="hint">Conserva le ultime 300 operazioni (nella versione definitiva: 5 anni).</p>` };
}
function vPlan() {
  const co = myCo(); const on = planOn(co);
  return {
    h: header('t', 'Il tuo piano', { back: '#/profile' }), t: 'profile', b: `<h2 class="ttl">Ricevere è gratis, inviare costa poco</h2>
  <div class="card"><div class="row"><b class="sp">Ricevi quotazioni</b>${stx('n', 'Attivo')}</div><span class="sm mut">Gratis, sempre. Ricevi le richieste e le quotazioni dei tuoi collegamenti.</span></div>
  <div class="card"><div class="row"><b class="sp">Invia quotazioni</b>${on ? stx('n', 'Attivo fino al ' + fDate(co.plan.until)) : stx('x', 'Non attivo')}</div>
   <div class="two"><button class="opt ${fv('pl', 'k', 'y') === 'm' ? 'on' : ''}" data-act="plK" data-k="m" style="flex-direction:column;align-items:flex-start"><b>Mensile</b><span class="price">5,00 €</span><span class="d">al mese</span></button><button class="opt ${fv('pl', 'k', 'y') === 'y' ? 'on' : ''}" data-act="plK" data-k="y" style="flex-direction:column;align-items:flex-start"><b>Annuale</b><span class="price">50,00 €</span><span class="d">all'anno · risparmi 10 €</span></button></div>
   <span class="sm">✓ Quotazioni illimitate · ✓ Rispondi alle richieste · ✓ Report ed esportazioni</span>
   <button class="bt g" data-act="plBuy">Attiva il ${fv('pl', 'k', 'y') === 'm' ? 'mensile' : 'annuale'} (simulazione)</button>
   <div class="demo">In prova non c'è nessun pagamento: il piano si attiva subito. Nella versione definitiva passa dall'App Store (Apple).</div></div>
  <div class="card"><b>Hai un codice promozionale?</b><div class="row">${inp('pl', 'code', 'Es. PROVA2026')}<button class="bt s" data-act="plCode">Applica</button></div>${fv('pl', 'msg') ? `<div class="${fv('pl', 'ok') ? 'ok' : 'err'}">${esc(fv('pl', 'msg'))}</div>` : ''}<span class="hint">Codice di prova: PROVA2026 (30 giorni gratis).</span></div>
  ${on && co.plan.promo ? `<p class="hint">Codice usato: ${esc(co.plan.promo)}</p>` : ''}` };
}
ACT.plK = el => { setF('pl', 'k', el.dataset.k); render(); };
ACT.plBuy = () => { const co = myCo(); const k = fv('pl', 'k', 'y'); const base = planOn(co) ? new Date(co.plan.until) : new Date(); base.setDate(base.getDate() + (k === 'm' ? 30 : 365)); patch('companies', co.id, { plan: { type: k === 'm' ? 'mensile' : 'annuale', until: base.toISOString(), promo: (co.plan && co.plan.promo) || '' } }); log('Attivato il piano ' + (k === 'm' ? 'mensile (5,00 €)' : 'annuale (50,00 €)') + ' – simulazione'); toast('Piano attivo'); };
ACT.plCode = () => { const co = myCo(); const c = String(fv('pl', 'code')).trim().toUpperCase(); if (c !== 'PROVA2026') { setF('pl', 'ok', false); setF('pl', 'msg', 'Codice non valido o scaduto.'); return render(); } if (co.plan && co.plan.promo === c) { setF('pl', 'ok', false); setF('pl', 'msg', 'Codice già usato.'); return render(); } const base = planOn(co) ? new Date(co.plan.until) : new Date(); base.setDate(base.getDate() + 30); patch('companies', co.id, { plan: { type: (co.plan && co.plan.type) || 'promo', until: base.toISOString(), promo: c } }); log('Applicato il codice promozionale ' + c + ' (+30 giorni)'); setF('pl', 'ok', true); setF('pl', 'msg', 'Codice valido: 30 giorni gratis aggiunti al piano.'); render(); };

/* ============ registrazione dipendente con PIN ============ */
function vRegEmp() {
  const E = U.re || (U.re = {});
  return {
    h: header('logo', '', { back: '#/' }), b: `<h2 class="ttl">Crea account</h2><p class="sub">Dipendente o collega con PIN aziendale</p>${E.err ? `<div class="err">${esc(E.err)}</div>` : ''}
  <div class="two">${fld('Nome', inp('re', 'name'), 1)}${fld('Cognome', inp('re', 'surname'), 1)}</div>
  ${fld('Email (serve per accedere)', inp('re', 'email', 'nome@azienda.it', 'email'), 1)}
  ${fld('Password', inp('re', 'pw', 'Min. 10, lettere e numeri', 'password'), 1, 'In prova la password non viene salvata.')}
  ${fld('PIN aziendale', inp('re', 'pin', '6 cifre', 'text', 'inputmode="numeric" maxlength="7"'), 1, 'Il PIN lo dà l\'amministrazione o l\'ufficio (Profilo › Team e accessi): lega il tuo account alla tua azienda. Dopo l\'approvazione entri con la tua email.')}
  ${cbx('re', 'tos', 'Accetto i Termini di servizio <b>(obbligatorio)</b>')}${cbx('re', 'priv', 'Ho letto l\'Informativa privacy <b>(obbligatorio)</b>')}
  <button class="bt" data-act="reSend">Continua</button>${ftr()}` };
}
ACT.reSend = () => {
  const f = k => String(fv('re', k)).trim(); const err = t => { U.re.err = t; render(); window.scrollTo(0, 0); };
  if (!f('name') || !f('surname')) return err('Inserisci nome e cognome.');
  const em = f('email').toLowerCase(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return err('Email non valida.');
  if (all('members').some(m => (m.email || '').toLowerCase() === em)) return err('Questa email è già registrata.');
  const pw = fv('re', 'pw'); if (pw.length < 10 || !/[a-z]/i.test(pw) || !/\d/.test(pw)) return err('Password: almeno 10 caratteri, una lettera e un numero.');
  const pin = f('pin').replace(/\D/g, ''); const co = all('companies').find(c => String(c.pin) === pin);
  if (!co) return err('PIN aziendale non valido. Chiedilo di nuovo all\'amministratore.');
  if (!fv('re', 'tos') || !fv('re', 'priv')) return err('Accetta Termini e Informativa privacy.');
  const id = uid('m_'); put('members', id, { co: co.id, name: f('name'), surname: f('surname'), email: em, role: 'operatore', status: 'pending', emailOk: true, createdAt: nowISO() });
  log('Richiesta di accesso con PIN da ' + f('name') + ' ' + f('surname'), co.id);
  setMe(id); U.re = null; go('#/home');
};

/* ============ fase 2 e guida ============ */
const SOON = {
  fotoeer: ['Codice EER da foto', 'Scatti o carichi la foto del rifiuto, rispondi ad al massimo 3 domande (attività che lo ha prodotto, processo, solo se serve composizione) e ricevi il codice proposto con motivazione, codici confrontati e verifiche. È sempre una proposta: decide chi produce il rifiuto.'],
  vetrina: ['VETRINA', 'Consulenti ambientali, avvocati, noleggi, attrezzature, laboratori della tua zona (provincia, regione, Italia), con schede e spazi «In evidenza».'],
  annunci: ['I miei annunci', 'Acquisto e gestione in autonomia di spazi pubblicitari grandi e piccoli e delle schede Vetrina, con caricamento di immagine o testo.'],
  agenda: ['Agenda', 'Calendario dell\'azienda con ritiri, consegne e scadenze, assegnabili ai membri del team.'],
  documenti: ['Documenti e scadenze', 'Archivio di autorizzazioni, iscrizioni, contratti con avviso prima della scadenza.'],
  formulari: ['Formulari xFIR', 'Scanner dei formulari con lettura dei dati principali. RifiutiPro non sostituisce FIR, RENTRI o MUD.'],
  listini: ['Listini riservati', 'Listini di prezzi riservati per singolo cliente collegato, mai pubblici.'],
  preferiti: ['Preferiti', 'Aziende e quotazioni salvate per ritrovarle in fretta.'],
  prezzi: ['Prezzi di mercato', 'Prezzi indicativi da una fonte pubblica esterna, mai dalle quotazioni delle aziende.'],
  report: ['Report e statistiche', 'Numeri per periodo, rifiuto e azienda, con esportazione in Excel e PDF.'],
  privacy: ['Privacy, notifiche e password', 'Cambio password, preferenze delle notifiche, esportazione e cancellazione dei dati.'],
};
function vSoon(k) { const s = SOON[k] || ['In arrivo', 'Questa funzione arriva nella fase 2.']; return { h: header('t', s[0]), t: 'home', b: `<div class="card"><span style="font-size:40px">🛠️</span><h3>${esc(s[0])}</h3><span class="mut">${esc(s[1])}</span><span class="tag" style="align-self:flex-start">Fase 2</span></div><p class="hint">Il disegno completo è nel mockup V.5. In questa prima versione di prova ci sono registrazione, Home, aziende e collegamenti, richieste e quotazioni, chat, codici EER, rifiuti trattati, team con PIN e piano.</p>` }; }
function vGuide() {
  return {
    h: header('t', 'Guida alla prova', { back: me() ? '#/profile' : '#/' }), b: `
  <div class="card"><h3>Cos'è</h3><span class="sm">La prima versione funzionante di RifiutiPro (fase 1). I dati sono <b>condivisi</b> tra chi apre questa pagina su claude.ai: se tu invii una richiesta, Alessio la vede arrivare.</span></div>
  <div class="card"><h3>Prova in due, in 5 minuti</h3><ol class="sm" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px">
   <li><b>Giuseppe</b>: Accedi › Accesso rapido › <b>Carla Prova</b> (Officina Demo Snc, Visualizzatore).</li>
   <li><b>Alessio</b>: Accedi › Accesso rapido › <b>Anna Prova</b> (Recuperi Demo Srl, Gestore ambientale).</li>
   <li>Carla: Home › <b>Richiedi quotazione</b> › scegli Recuperi Demo › Invia.</li>
   <li>Anna: la richiesta compare in Home e nella campanella › <b>Fai quotazione</b> › Invia.</li>
   <li>Carla: Quotazioni › apri › <b>Ho ricevuto e visualizzato</b>. Poi scrivetevi in <b>Chat</b>.</li></ol></div>
  <div class="card"><h3>Altre cose da provare</h3><ul class="sm" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">
   <li>Registrare una nuova azienda (6 passi, email simulata alla fine).</li>
   <li>Cerca aziende › Invia richiesta di collegamento › l'altra azienda accetta.</li>
   <li>Profilo › Team e accessi: leggi il PIN, poi da un altro dispositivo «Registrati con il PIN aziendale» e approva la richiesta.</li>
   <li>Profilo › Rifiuti trattati: macroaree, sottocategorie, riquadri descrizione + EER, nuove voci.</li>
   <li>Il tuo piano: attiva (simulazione) o usa il codice <b>PROVA2026</b>.</li>
   <li>Entra come <b>Luca Prova</b> (autista) per vedere il menu ridotto.</li></ul></div>
  <div class="card"><h3>Da sapere</h3><ul class="sm" style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:4px">
   <li>Solo dati fittizi: niente email vere, niente pagamenti, password non salvate.</li>
   <li>Ogni dispositivo ricorda con quale utente sei entrato: per cambiare, menu › Esci.</li>
   <li>Il backoffice di Soluzione Rifiuti si prova entrando come <b>Staff Prova</b>: approva gli annunci, verifica le aziende, risponde all'assistenza.</li>
   <li>Sul telefono: apri la pagina e usa «Aggiungi alla schermata Home» per averla come un'app.</li></ul></div>
  <p class="ftr">${APPV} · ${modeTxt()}</p>` };
}

