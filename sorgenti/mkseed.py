import json, datetime
now=datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
def t(h=0,d=0): return (now-datetime.timedelta(hours=h,days=d)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
until=(now+datetime.timedelta(days=365)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
W1=[{'m':'Metalli','s':'Ferro','rows':[{'d':'Rottame ferroso misto','e':'17 04 05'},{'d':'Ferro da veicoli','e':'16 01 17'}]},
    {'m':'Metalli','s':'Rame','rows':[{'d':'Cavi elettrici','e':'17 04 11'},{'d':'Rame in pezzi','e':'17 04 01'}]},
    {'m':'Metalli','s':'Alluminio','rows':[{'d':'Profili e lattine','e':'17 04 02'}]},
    {'m':'Carta e cartone','s':'Cartone','rows':[{'d':'Imballaggi in cartone','e':'15 01 01'}]}]
W2=[{'m':'Plastica','s':'Imballaggi in plastica','rows':[{'d':'Film e cassette','e':'15 01 02'}]},
    {'m':'Metalli','s':'Rame','rows':[{'d':'Rame e ottone','e':'17 04 01'}]},
    {'m':'RAEE','s':'Cavi','rows':[]}]
W3=[{'m':'Inerti ed edilizia','s':'Misti da demolizione','rows':[{'d':'Macerie miste','e':'17 09 04'}]}]
C={
 'co_demo_recuperi':{'kind':'gestore','priv':False,'types':['impianto','trasportatore'],'name':'Recuperi Demo Srl','piva':'01234567890','cf':'','addr':'Via della Prova 1','city':'Priolo Gargallo','prov':'SR','phone':'0931 000001','email':'info@recuperi-demo.esempio.invalid','pres':'Impianto di recupero metalli e carta, con servizio di trasporto (azienda fittizia di prova).','pin':'482915','createdAt':t(d=20),'waste':W1,'auth':{'impianto':{'tipo':'Art. 208 d.lgs. 152/2006 (autorizzazione unica)','num':'DDS 000/2024','ente':'Regione Siciliana','scad':'2030-06-30'},'trasportatore':{'albo':'PA/000001','cat':'4, 5'},'intermediario':{'albo':''},'declared':True,'declAt':t(d=20)},'plan':{'type':'annuale','until':until,'promo':''}},
 'co_demo_ecologia':{'kind':'gestore','priv':False,'types':['impianto'],'name':'Ecologia Demo Srl','piva':'01234567891','cf':'','addr':'Zona industriale, lotto 0','city':'Catania','prov':'CT','phone':'095 000002','email':'info@ecologia-demo.esempio.invalid','pres':'Impianto di selezione plastica e metalli non ferrosi (azienda fittizia).','pin':'731406','createdAt':t(d=18),'waste':W2,'auth':{'declared':False},'plan':{'type':'mensile','until':until,'promo':''}},
 'co_demo_trasporti':{'kind':'gestore','priv':False,'types':['trasportatore','intermediario'],'name':'Trasporti Demo Srl','piva':'01234567892','cf':'','addr':'Via del Porto 0','city':'Augusta','prov':'SR','phone':'0931 000003','email':'info@trasporti-demo.esempio.invalid','pres':'Trasporto e intermediazione di rifiuti (azienda fittizia).','pin':'265874','createdAt':t(d=15),'waste':W3,'auth':{'declared':False},'plan':None},
 'co_demo_officina':{'kind':'visualizzatore','priv':False,'types':[],'name':'Officina Demo Snc','piva':'01234567893','cf':'','addr':'Via dei Motori 0','city':'Catania','prov':'CT','phone':'095 000004','email':'officina@officina-demo.esempio.invalid','pres':'','pin':'590321','createdAt':t(d=12),'waste':[],'auth':{},'plan':None},
}
M={
 'm_demo_anna':{'co':'co_demo_recuperi','name':'Anna','surname':'Prova','email':'anna.prova@esempio.invalid','role':'admin','status':'active','emailOk':True,'createdAt':t(d=20)},
 'm_demo_davide':{'co':'co_demo_recuperi','name':'Davide','surname':'Prova','email':'davide.prova@esempio.invalid','role':'editor','status':'active','emailOk':True,'createdAt':t(d=19)},
 'm_demo_luca':{'co':'co_demo_recuperi','name':'Luca','surname':'Prova','email':'luca.prova@esempio.invalid','role':'autista','status':'active','emailOk':True,'createdAt':t(d=19)},
 'm_demo_giulia':{'co':'co_demo_recuperi','name':'Giulia','surname':'Prova','email':'giulia.prova@esempio.invalid','role':'ufficio','status':'pending','emailOk':True,'createdAt':t(h=5)},
 'm_demo_marco':{'co':'co_demo_ecologia','name':'Marco','surname':'Prova','email':'marco.prova@esempio.invalid','role':'admin','status':'active','emailOk':True,'createdAt':t(d=18)},
 'm_demo_paolo':{'co':'co_demo_trasporti','name':'Paolo','surname':'Prova','email':'paolo.prova@esempio.invalid','role':'admin','status':'active','emailOk':True,'createdAt':t(d=15)},
 'm_demo_carla':{'co':'co_demo_officina','name':'Carla','surname':'Prova','email':'carla.prova@esempio.invalid','role':'admin','status':'active','emailOk':True,'createdAt':t(d=12)},
}
L={
 'ln_demo_1':{'a':'co_demo_ecologia','b':'co_demo_recuperi','status':'active','msg':'Buongiorno, collaboriamo sui metalli?','interests':['Metalli'],'createdAt':t(d=10),'acceptedAt':t(d=10)},
 'ln_demo_2':{'a':'co_demo_officina','b':'co_demo_recuperi','status':'active','msg':'Siamo un\'officina di Catania, ci servono ritiri periodici.','interests':['Metalli'],'createdAt':t(d=8),'acceptedAt':t(d=8)},
 'ln_demo_3':{'a':'co_demo_officina','b':'co_demo_ecologia','status':'active','msg':'','interests':[],'createdAt':t(d=7),'acceptedAt':t(d=7)},
 'ln_demo_4':{'a':'co_demo_trasporti','b':'co_demo_recuperi','status':'pending','msg':'Buongiorno, siamo trasportatori ad Augusta. Possiamo collegarci?','interests':['Metalli','Inerti ed edilizia'],'createdAt':t(h=3)},
}
R={
 'rq_demo_1':{'num':'RR-2026-000000001','from':'co_demo_officina','by':'m_demo_carla','to':['co_demo_recuperi','co_demo_ecologia'],'macro':'Metalli','sub':'Rame','descr':'Cavi elettrici da ristrutturazione, già separati','eer':'17 04 11','qty':'350','unit':'kg','transport':True,'place':'Catania (CT)','note':'Ritiro entro fine mese.','status':'open','resp':{'co_demo_ecologia':'quoted'},'createdAt':t(h=26)},
 'rq_demo_2':{'num':'RR-2026-000000002','from':'co_demo_ecologia','by':'m_demo_marco','to':['co_demo_recuperi'],'macro':'Metalli','sub':'Ferro','descr':'Rottame ferroso misto','eer':'17 04 05','qty':'2','unit':'t','transport':False,'place':'Catania (CT)','note':'','status':'open','resp':{},'createdAt':t(h=4)},
}
Q={
 'q_demo_1':{'num':'RQ-2026-000000003','from':'co_demo_ecologia','to':'co_demo_officina','by':'m_demo_marco','reqId':'rq_demo_1','macro':'Metalli','sub':'Rame','eer':'17 04 11','descr':'Cavi elettrici da ristrutturazione, già separati','ver':1,'status':'sent','dir':'offro','price':'4.60','unit':'€/kg','vat':'iva','transport':'escluso','tcost':'','validUntil':'','note':'Materiale pulito, ritiro entro 5 giorni.','createdAt':t(h=20),'updatedAt':t(h=20),'hist':[]},
}
CH={
 'co_demo_ecologia__co_demo_officina':{'a':'co_demo_ecologia','b':'co_demo_officina','msgs':[{'co':'co_demo_officina','mid':'m_demo_carla','name':'Carla Prova','text':'Buongiorno, i cavi sono già spelati?','at':t(h=19)},{'co':'co_demo_ecologia','mid':'m_demo_marco','name':'Marco Prova','text':'Buongiorno Carla, no: li ritiriamo così come sono.','at':t(h=18)}],'read':{'co_demo_officina':t(h=19),'co_demo_ecologia':t(h=18)}},
}
LG={
 'co_demo_recuperi':{'items':[{'at':t(d=8),'mid':'m_demo_anna','who':'Anna Prova','t':'Accettato il collegamento con Officina Demo Snc'},{'at':t(d=10),'mid':'m_demo_anna','who':'Anna Prova','t':'Accettato il collegamento con Ecologia Demo Srl'}]},
}

def fut(d): return (now+datetime.timedelta(days=d)).strftime('%Y-%m-%dT%H:%M:%S.000Z')
def day(d): return (now+datetime.timedelta(days=d)).strftime('%Y-%m-%d')
for cid,nm,city,prov in [('co_demo_noleggio','Noleggio Demo Srl','Siracusa','SR'),('co_demo_studio','Studio Ambiente Prova','Siracusa','SR'),('co_demo_lab','Laboratorio Demo Srl','Catania','CT'),('co_demo_legale','Studio Legale Demo','Catania','CT')]:
    C[cid]={'kind':'visualizzatore','priv':False,'types':[],'name':nm,'piva':'0123456789'+str(len(C)%10),'cf':'','addr':'','city':city,'prov':prov,'phone':'','email':'','pres':'','pin':'1'+str(10000+len(C))[-5:],'createdAt':t(d=9),'waste':[],'auth':{},'plan':None}
C['co_staff']={'kind':'staff','priv':False,'types':[],'name':'Soluzione Rifiuti S.r.l. (staff)','piva':'','cf':'','addr':'','city':'Siracusa','prov':'SR','phone':'','email':'','pres':'','pin':'000000','createdAt':t(d=30),'waste':[],'auth':{},'plan':None}
M['m_demo_staff']={'co':'co_staff','name':'Staff','surname':'Prova','email':'staff.prova@esempio.invalid','role':'admin','status':'active','emailOk':True,'sa':True,'createdAt':t(d=30)}
AD={
 'ad_demo_1':{'co':'co_demo_noleggio','kind':'big','title':'Cassoni scarrabili a noleggio','text':'Consegna in 48 ore a Siracusa e Catania','cta':'Scopri','phone':'0931 000010','email':'noleggio@esempio.invalid','web':'','img':'','zone':{'lvl':'prov','prov':'SR'},'months':3,'until':fut(80),'paid':267.3,'status':'active','taps':4,'createdAt':t(d=9),'feat':False,'cat':'','grafica':'','brief':''},
 'ad_demo_2':{'co':'co_demo_lab','kind':'big','title':'Analisi rifiuti in 5 giorni','text':'Caratterizzazione e omologhe in tutta la Sicilia','cta':'Contatta','phone':'095 000011','email':'lab@esempio.invalid','web':'','img':'','zone':{'lvl':'reg','reg':'Sicilia'},'months':1,'until':fut(25),'paid':99,'status':'active','taps':2,'createdAt':t(d=5),'feat':False,'cat':'','grafica':'','brief':''},
 'ad_demo_3':{'co':'co_demo_studio','kind':'small','title':'Studio Ambiente Prova','text':'Consulenza AUA, AIA e MUD · Siracusa','cta':'','phone':'0931 000012','email':'studio@esempio.invalid','web':'','img':'','zone':{'lvl':'prov','prov':'SR'},'months':12,'until':fut(300),'paid':144,'status':'active','taps':1,'createdAt':t(d=8),'feat':False,'cat':'','grafica':'','brief':''},
 'ad_demo_4':{'co':'co_demo_studio','kind':'card','cat':'Consulenti ambientali','title':'Studio Ambiente Prova','text':'Pratiche AUA e AIA, MUD, classificazione dei rifiuti, formazione. Studio fittizio di prova.','cta':'Contatta','phone':'0931 000012','email':'studio@esempio.invalid','web':'','img':'','zone':{'lvl':'prov','prov':'SR'},'months':12,'until':fut(300),'paid':230.4,'status':'active','taps':3,'createdAt':t(d=8),'feat':True,'grafica':'','brief':''},
 'ad_demo_5':{'co':'co_demo_legale','kind':'card','cat':'Avvocati','title':'Studio Legale Demo','text':'Diritto ambientale e amministrativo per le imprese dei rifiuti. Studio fittizio di prova.','cta':'Contatta','phone':'095 000013','email':'legale@esempio.invalid','web':'','img':'','zone':{'lvl':'reg','reg':'Sicilia'},'months':3,'until':fut(70),'paid':67.5,'status':'active','taps':0,'createdAt':t(d=6),'feat':False,'grafica':'','brief':''},
 'ad_demo_6':{'co':'co_demo_noleggio','kind':'card','cat':'Noleggio mezzi e cassoni','title':'Noleggio Demo Srl','text':'Cassoni scarrabili, compattatori e press-container. Azienda fittizia di prova.','cta':'Chiama','phone':'0931 000010','email':'noleggio@esempio.invalid','web':'','img':'','zone':{'lvl':'prov','prov':'SR'},'months':1,'until':fut(20),'paid':9,'status':'active','taps':1,'createdAt':t(d=9),'feat':False,'grafica':'','brief':''},
 'ad_demo_7':{'co':'co_demo_lab','kind':'card','cat':'Laboratori di analisi','title':'Laboratorio Demo Srl','text':'Analisi di caratterizzazione e omologhe. Azienda fittizia di prova.','cta':'Richiedi preventivo','phone':'095 000011','email':'lab@esempio.invalid','web':'','img':'','zone':{'lvl':'reg','reg':'Sicilia'},'months':1,'until':fut(25),'paid':25,'status':'review','taps':0,'createdAt':t(h=2),'feat':False,'grafica':'','brief':''},
}
EV={
 'ev_demo_1':{'co':'co_demo_recuperi','type':'ritiro','title':'Ritiro rame da Officina Demo','date':day(0),'time':'10:30','place':'Catania (CT)','who':'m_demo_luca','note':'Portare cassone da 10 m³','done':False,'by':'m_demo_anna','createdAt':t(d=1)},
 'ev_demo_2':{'co':'co_demo_recuperi','type':'consegna','title':'Consegna cassone a Ecologia Demo','date':day(2),'time':'08:00','place':'Catania (CT)','who':'m_demo_luca','note':'','done':False,'by':'m_demo_anna','createdAt':t(d=1)},
 'ev_demo_3':{'co':'co_demo_recuperi','type':'appuntamento','title':'Incontro con Trasporti Demo','date':day(5),'time':'15:00','place':'Augusta','who':'m_demo_anna','note':'','done':False,'by':'m_demo_anna','createdAt':t(d=1)},
}
DC={
 'dc_demo_1':{'co':'co_demo_recuperi','title':'Iscrizione Albo Gestori Ambientali','cat':'Iscrizione Albo','expiry':day(20),'remind':'30','note':'Rinnovo da avviare','file':'','by':'m_demo_anna','createdAt':t(d=10)},
 'dc_demo_2':{'co':'co_demo_recuperi','title':'Autorizzazione unica art. 208','cat':'Autorizzazione','expiry':'2030-06-30','remind':'90','note':'','file':'','by':'m_demo_anna','createdAt':t(d=10)},
}
ST={'global':{'banner':{'title':'Versione di prova','text':'Fase 2: Vetrina, annunci, Codice EER da foto, agenda, documenti, formulari, listini, report e backoffice.','type':'info'}}}

seed={'ads':AD,'events':EV,'docs':DC,'settings':ST,'companies':C,'members':M,'links':L,'reqs':R,'quotes':Q,'chats':CH,'logs':LG}
json.dump(seed,open('seed.json','w'),ensure_ascii=False,indent=1)
print(sum(len(v) for v in seed.values()),'docs')
