/* ================= PREZZI, CODICI REGALO E INVITI ================= */
const PRICE = { m: 9.99, y: 99.99 };                       // annuale: 2 mesi gratis (confermato)
const APP_URL = 'https://canvas20.github.io/rifiutipro-prova/';
const eur = v => money(v) + ' €';
function promoCfg() { const g = D.settings.promo || {}; return { perCo: g.perCo != null ? +g.perCo : 5, chain: !!g.chain, days: g.days != null ? +g.days : 365 }; }
function newCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let s = ''; for (let i = 0; i < 8; i++) s += A[Math.floor(Math.random() * A.length)]; return 'RP-' + s.slice(0, 4) + '-' + s.slice(4); }
function codeId(c) { return String(c || '').trim().toUpperCase().replace(/\s+/g, ''); }
function myGiftCodes(co) { return all('promo').filter(p => p.kind === 'referral' && p.ownerCo === co.id).sort((a, b) => String(a.code).localeCompare(String(b.code))); }
function promoMail(p, fromName) {
  const subj = 'Un anno di RifiutiPro in regalo';
  const body = `Buongiorno${p.toName ? ' ' + p.toName : ''},\n\nle regaliamo un anno di abbonamento a RifiutiPro, l'app per collegarsi con impianti, trasportatori e intermediari e scambiare quotazioni in modo riservato.\n\n1. Apra dal telefono ${APP_URL} e la aggiunga alla schermata Home (Safari > Condividi > Aggiungi alla schermata Home)\n2. Si registri come Gestore ambientale o Visualizzatore\n3. Inserisca il codice regalo durante la registrazione, oppure in Profilo > Il tuo piano:\n\n   ${p.code}\n\nIl codice vale un anno di abbonamento (valore ${eur(PRICE.y)}) ed è utilizzabile una sola volta.\n\nCordiali saluti\n${fromName || 'Soluzione Rifiuti S.r.l.'}`;
  return 'mailto:' + encodeURIComponent(p.toEmail || '') + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
}
function promoShareText(p, fromName) { return `Ti regalo un anno di RifiutiPro, l'app per le quotazioni nel settore rifiuti. Apri ${APP_URL} e inserisci il codice ${p.code} durante la registrazione o in Profilo > Il tuo piano. ${fromName ? '— ' + fromName : ''}`; }
/* applica un codice (regalo di Soluzione Rifiuti, o regalato da un'azienda) a un'azienda */
function redeemCode(raw, co) {
  const c = codeId(raw);
  if (!c) return { ok: false, msg: 'Scrivi il codice.' };
  if (c === 'PROVA2026') {
    if (co.plan && co.plan.promo === c) return { ok: false, msg: 'Codice già usato.' };
    const base = planOn(co) ? new Date(co.plan.until) : new Date(); base.setDate(base.getDate() + 30);
    patch('companies', co.id, { plan: { type: (co.plan && co.plan.type) || 'promo', until: base.toISOString(), promo: c } }); log('Applicato il codice promozionale ' + c + ' (+30 giorni)', co.id);
    return { ok: true, msg: 'Codice valido: 30 giorni gratis aggiunti al piano.' };
  }
  const p = get('promo', c);
  if (!p) return { ok: false, msg: 'Codice non valido. Controlla di averlo scritto bene (es. RP-AB12-CD34).' };
  if (p.usedBy) return { ok: false, msg: p.usedBy === co.id ? 'Hai già usato questo codice.' : 'Questo codice è già stato usato da un\'altra azienda.' };
  if (p.ownerCo === co.id) return { ok: false, msg: 'Questo è uno dei tuoi codici da regalare: dallo a un cliente.' };
  if (p.expires && new Date(p.expires) < new Date()) return { ok: false, msg: 'Codice scaduto.' };
  const cfg = promoCfg(); const days = +p.days || cfg.days;
  const base = planOn(co) ? new Date(co.plan.until) : new Date(); base.setDate(base.getDate() + days);
  patch('companies', co.id, { plan: { type: 'regalo', until: base.toISOString(), promo: c } });
  patch('promo', c, { usedBy: co.id, usedByMid: meId() || '', usedAt: nowISO() });
  log(`Applicato il codice regalo ${c}: ${days} giorni di abbonamento${p.ownerCo ? ' (regalo di ' + coName(p.ownerCo) + ')' : ''}`, co.id);
  if (p.ownerCo) log(`${co.name} ha usato il tuo codice regalo ${c}`, p.ownerCo);
  let extra = '';
  const gen = cfg.perCo > 0 && (p.kind === 'gift' || cfg.chain) && !myGiftCodes(co).length;
  if (gen) { for (let i = 0; i < cfg.perCo; i++) { const k = newCode(); put('promo', k, { code: k, kind: 'referral', ownerCo: co.id, from: c, days: cfg.days, createdAt: nowISO() }); } extra = ` In più hai ${cfg.perCo} codici da regalare ai tuoi clienti e contatti: li trovi in Profilo › Il tuo piano.`; log(`Ricevuti ${cfg.perCo} codici regalo da distribuire`, co.id); }
  return { ok: true, msg: `Codice valido: ${days === 365 ? 'un anno' : days + ' giorni'} di abbonamento aggiunto, fino al ${fDate(base.toISOString())}.${extra}` };
}

/* ---------- schermata «Il tuo piano» ---------- */
function vPlan() {
  const co = myCo(); const on = planOn(co); const k = fv('pl', 'k', 'y');
  const mine = myGiftCodes(co); const free = mine.filter(p => !p.usedBy);
  return {
    h: header('t', 'Il tuo piano', { back: '#/profile' }), t: 'profile', b: `<h2 class="ttl">Ricevere è gratis, inviare costa poco</h2>
  <div class="card"><div class="row"><b class="sp">Ricevi quotazioni</b>${stx('n', 'Attivo')}</div><span class="sm mut">Gratis, sempre. Ricevi le richieste e le quotazioni dei tuoi collegamenti.</span></div>
  ${isG(co) ? `<div class="card"><div class="row"><b class="sp">Invia quotazioni</b>${on ? stx('n', 'Attivo fino al ' + fDate(co.plan.until)) : stx('x', 'Non attivo')}</div>
   <div class="two"><button class="opt ${k === 'm' ? 'on' : ''}" data-act="plK" data-k="m" style="flex-direction:column;align-items:flex-start"><b>Mensile</b><span class="price">${eur(PRICE.m)}</span><span class="d">al mese</span></button><button class="opt ${k === 'y' ? 'on' : ''}" data-act="plK" data-k="y" style="flex-direction:column;align-items:flex-start"><b>Annuale</b><span class="price">${eur(PRICE.y)}</span><span class="d">all'anno · 2 mesi gratis</span></button></div>
   <span class="sm">✓ Quotazioni illimitate · ✓ Rispondi alle richieste · ✓ Report ed esportazioni</span>
   <button class="bt g" data-act="plBuy">Attiva il ${k === 'm' ? 'mensile' : 'annuale'} (simulazione)</button>
   <div class="demo">In prova non c'è nessun pagamento: il piano si attiva subito. Nella versione definitiva passa dall'App Store (Apple).</div></div>` : ''}
  <div class="card"><b>Hai un codice regalo o promozionale?</b><div class="row">${inp('pl', 'code', 'Es. RP-AB12-CD34', 'text', 'autocapitalize="characters" style="text-transform:uppercase"')}<button class="bt s" data-act="plCode">Applica</button></div>${fv('pl', 'msg') ? `<div class="${fv('pl', 'ok') ? 'ok' : 'err'}">${esc(fv('pl', 'msg'))}</div>` : ''}<span class="hint">Un codice regalo vale un anno di abbonamento. Codice di prova: PROVA2026 (30 giorni).</span></div>
  ${mine.length ? `<div class="card" style="border:2px solid var(--green)"><h3>🎁 Regala RifiutiPro</h3><span class="sm">Hai <b>${free.length} codic${free.length === 1 ? 'e' : 'i'}</b> da regalare a clienti e contatti: ognuno vale <b>un anno di abbonamento</b> (${eur(PRICE.y)}).</span>
   ${mine.map(p => { const used = !!p.usedBy; return `<div style="border-top:1px solid var(--line);padding-top:8px;display:flex;flex-direction:column;gap:6px"><div class="row"><b class="mono sp" style="font-size:17px;${used ? 'text-decoration:line-through;opacity:.6' : ''}">${esc(p.code)}</b>${used ? stx('n', 'Usato da ' + coName(p.usedBy)) : p.sentTo ? stx('w', 'Inviato a ' + p.sentTo) : stx('x', 'Da regalare')}</div>${used ? '' : `<div class="row" style="gap:6px;flex-wrap:wrap"><button class="bt gh s" data-act="pcMail" data-id="${esc(p.code)}">✉️ Email</button><button class="bt gh s" data-act="pcShare" data-id="${esc(p.code)}">Condividi</button><button class="bt gh s" data-act="pcCopy" data-id="${esc(p.code)}">Copia</button></div>`}</div>`; }).join('')}
   <span class="hint">Il codice si usa una sola volta. Ti avvisiamo quando un cliente lo usa.</span></div>` : ''}
  ${on && co.plan.promo ? `<p class="hint">Ultimo codice usato: ${esc(co.plan.promo)}</p>` : ''}` };
}
ACT.plBuy = () => { const co = myCo(); const k = fv('pl', 'k', 'y'); const base = planOn(co) ? new Date(co.plan.until) : new Date(); base.setDate(base.getDate() + (k === 'm' ? 30 : 365)); patch('companies', co.id, { plan: { type: k === 'm' ? 'mensile' : 'annuale', until: base.toISOString(), promo: (co.plan && co.plan.promo) || '' } }); log('Attivato il piano ' + (k === 'm' ? 'mensile (' + eur(PRICE.m) + ')' : 'annuale (' + eur(PRICE.y) + ')') + ' – simulazione'); toast('Piano attivo'); };
ACT.plCode = () => { const r = redeemCode(fv('pl', 'code'), myCo()); setF('pl', 'ok', r.ok); setF('pl', 'msg', r.msg); if (r.ok) setF('pl', 'code', ''); render(); };
function askRecipient(p, cb) {
  modal(`<h3 style="margin:0">A chi regali il codice ${esc(p.code)}?</h3>${fld('Nome o azienda (facoltativo)', '<input class="in" id="pcname" placeholder="Es. Officina Rossi">')}${fld('Email (facoltativa)', '<input class="in" id="pcmail" type="email" placeholder="nome@azienda.it">')}<div class="two"><button class="bt gh" data-act="mClose">Annulla</button><button class="bt" id="pcok">Continua</button></div>`);
  document.getElementById('pcok').onclick = () => { const n = document.getElementById('pcname').value.trim(), e = document.getElementById('pcmail').value.trim(); closeOverlays(); cb(n, e); };
}
ACT.pcMail = el => { const p = get('promo', el.dataset.id); askRecipient(p, (n, e) => { patch('promo', p.code, { sentTo: n || e || 'email', sentAt: nowISO() }); log('Regalato il codice ' + p.code + (n ? ' a ' + n : '')); location.href = promoMail(Object.assign({}, p, { toName: n, toEmail: e }), myCo().name); }); };
ACT.pcShare = async el => { const p = get('promo', el.dataset.id); const t = promoShareText(p, myCo().name); try { if (navigator.share) { await navigator.share({ title: 'Un anno di RifiutiPro in regalo', text: t }); patch('promo', p.code, { sentTo: 'condiviso', sentAt: nowISO() }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } location.href = 'https://wa.me/?text=' + encodeURIComponent(t); };
ACT.pcCopy = el => { const p = get('promo', el.dataset.id); const t = promoShareText(p, myCo().name); try { navigator.clipboard.writeText(t); toast('Copiato: incollalo dove vuoi'); } catch (e) { toast(p.code); } };
/* invito in Home */
function giftInvite() { const co = myCo(); if (!co) return ''; const free = myGiftCodes(co).filter(p => !p.usedBy && !p.sentTo); if (!free.length) return ''; return `<a class="wide" href="#/plan" style="background:linear-gradient(135deg,#0BA862,#056F47)"><span class="vi" style="color:#056F47;font-size:24px">🎁</span><span><b>Hai ${free.length} codic${free.length === 1 ? "e" : "i"} regalo da 1 anno</b><small>Regalali ai tuoi clienti e contatti</small></span><span class="ar">›</span></a>`; }

/* ---------- backoffice: codici regalo ---------- */
function adminCodes() {
  const P = all('promo'); const cfg = promoCfg();
  const gifts = P.filter(p => p.kind === 'gift').sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const refs = P.filter(p => p.kind === 'referral');
  const flt = fv('pc', 'f', 'all');
  const L = gifts.filter(p => flt === 'all' || (flt === 'free' ? !p.usedBy : !!p.usedBy));
  return `<div class="kp"><div><span>Codici regalo creati</span><b>${gifts.length}</b></div><div><span>Usati</span><b>${gifts.filter(p => p.usedBy).length}</b></div><div><span>Codici dei clienti</span><b>${refs.length}</b></div><div><span>Usati dai loro contatti</span><b>${refs.filter(p => p.usedBy).length}</b></div></div>
  <div class="card"><h3>Crea codici regalo</h3><span class="sm mut">Ogni codice vale ${cfg.days} giorni di abbonamento (un anno = ${eur(PRICE.y)}). Chi lo usa riceve ${cfg.perCo} codici da regalare ai propri clienti.</span>
   <div class="two">${fld('Quanti', inp('pc', 'n', '1', 'number', 'min="1" max="50"'))}${fld('Destinatario (facoltativo)', inp('pc', 'name', 'Es. Ecologia Rossi Srl'))}</div>${fld('Email del destinatario (facoltativa)', inp('pc', 'email', 'nome@azienda.it', 'email'))}
   <button class="bt g" data-act="pcGen">Crea</button></div>
  <div class="card"><h3>Regole</h3><div class="two">${fld('Codici da regalare per ogni cliente', inp('pc', 'per', String(cfg.perCo), 'number', 'min="0" max="20"'))}${fld('Durata di ogni codice (giorni)', inp('pc', 'days', String(cfg.days), 'number', 'min="1" max="730"'))}</div><label class="cbx"><input type="checkbox" data-f="pc.chain" ${fv('pc', 'chain', cfg.chain) ? 'checked' : ''}><span class="sm">Anche chi riceve un codice da un cliente ottiene a sua volta i codici da regalare (passaparola senza fine)</span></label><button class="bt gh s" data-act="pcCfg">Salva le regole</button></div>
  <div class="row"><div class="chips sp">${[['all', 'Tutti'], ['free', 'Da usare'], ['used', 'Usati']].map(([k, l]) => chip(flt === k, 'pcF', l, `data-k="${k}"`)).join('')}</div><button class="bt gh s" data-act="pcCsv">Esporta CSV</button></div>
  <div class="list">${L.map(p => `<div class="card"><div class="row"><b class="mono sp" style="font-size:17px">${esc(p.code)}</b>${p.usedBy ? stx('n', 'Usato') : p.sentAt ? stx('w', 'Inviato') : stx('x', 'Da inviare')}</div><span class="xs mut">${p.toName ? esc(p.toName) + ' · ' : ''}${p.toEmail ? esc(p.toEmail) + ' · ' : ''}creato ${fDT(p.createdAt)}${p.usedBy ? ' · usato da <b>' + esc(coName(p.usedBy)) + '</b> il ' + fDT(p.usedAt) + ' · codici dei suoi clienti usati: ' + refs.filter(r => r.ownerCo === p.usedBy && r.usedBy).length + '/' + refs.filter(r => r.ownerCo === p.usedBy).length : ''}</span>${p.usedBy ? '' : `<div class="row" style="gap:6px"><button class="bt gh s" data-act="pcAdmMail" data-id="${esc(p.code)}">✉️ Invia per email</button><button class="bt gh s" data-act="pcAdmCopy" data-id="${esc(p.code)}">Copia testo</button><button class="bt rd s" data-act="pcDel" data-id="${esc(p.code)}">Elimina</button></div>`}</div>`).join('') || '<div class="empty">Nessun codice.</div>'}</div>`;
}
ACT.pcF = el => { setF('pc', 'f', el.dataset.k); render(); };
ACT.pcGen = () => { const n = Math.max(1, Math.min(50, parseInt(fv('pc', 'n', '1'), 10) || 1)); const name = String(fv('pc', 'name')).trim(), email = String(fv('pc', 'email')).trim(); const cfg = promoCfg(); const made = []; for (let i = 0; i < n; i++) { const k = newCode(); made.push(k); put('promo', k, { code: k, kind: 'gift', days: cfg.days, toName: name, toEmail: email, createdBy: meId(), createdAt: nowISO() }); } setF('pc', 'n', '1'); setF('pc', 'name', ''); setF('pc', 'email', ''); toast(n === 1 ? 'Creato ' + made[0] : 'Creati ' + n + ' codici'); render(); };
ACT.pcCfg = () => { const per = Math.max(0, Math.min(20, parseInt(fv('pc', 'per', '5'), 10) || 0)); const days = Math.max(1, Math.min(730, parseInt(fv('pc', 'days', '365'), 10) || 365)); const cur = clone(D.settings.promo || {}); put('settings', 'promo', Object.assign(cur, { perCo: per, days, chain: !!fv('pc', 'chain', false) })); toast('Regole salvate'); };
ACT.pcAdmMail = el => { const p = get('promo', el.dataset.id); patch('promo', p.code, { sentAt: nowISO() }); location.href = promoMail(p, 'Soluzione Rifiuti S.r.l.'); };
ACT.pcAdmCopy = el => { const p = get('promo', el.dataset.id); const t = decodeURIComponent(promoMail(p, 'Soluzione Rifiuti S.r.l.').split('&body=')[1]); try { navigator.clipboard.writeText(t); toast('Testo dell\'email copiato'); } catch (e) { toast(p.code); } };
ACT.pcDel = el => confirmBox('Eliminare il codice ' + el.dataset.id + '?', 'Non potrà più essere usato.', 'Elimina', () => del('promo', el.dataset.id), 1);
ACT.pcCsv = () => { const rows = [['Codice', 'Tipo', 'Destinatario', 'Email', 'Creato', 'Inviato', 'Usato da', 'Usato il', 'Azienda che lo regala']]; all('promo').forEach(p => rows.push([p.code, p.kind === 'gift' ? 'regalo Soluzione Rifiuti' : 'regalato da un cliente', p.toName || p.sentTo || '', p.toEmail || '', (p.createdAt || '').slice(0, 10), (p.sentAt || '').slice(0, 10), p.usedBy ? coName(p.usedBy) : '', (p.usedAt || '').slice(0, 10), p.ownerCo ? coName(p.ownerCo) : ''])); download('RifiutiPro_codici_regalo.csv', '﻿' + rows.map(r => r.map(x => '"' + String(x ?? '').replace(/"/g, '""') + '"').join(';')).join('\n'), 'text/csv'); };
