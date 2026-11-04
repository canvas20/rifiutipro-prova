import json, os, shutil
from PIL import Image
eer=json.load(open('eer.json'))
codes=eer['codes']
for c in [["160122",0,0,"componenti non specificati altrimenti"],["160306",0,0,"rifiuti organici, diversi da quelli di cui alla voce 16 03 05"]]:
    if c[0] not in [x[0] for x in codes]: codes.append(c)
codes.sort(key=lambda x:x[0])
data={'ch':eer['ch'],'codes':codes}
logo=open('wordmark.svg').read().strip()
css=open('app.css').read()
js='\n'.join(open(f).read() for f in ['core.js','screens1.js','screens2.js','screens3.js','screens4.js'])
def page(site):
    head='<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png"><meta name="apple-mobile-web-app-capable" content="yes"><script src="config.js"></script>' if site else ''
    return f'''<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#0057F5"><meta name="color-scheme" content="light"><title>RifiutiPro prova</title>{head}<style>{css}</style></head><body><div id="app"></div><script>window.__EER__={json.dumps(data,ensure_ascii=False)};window.__LOGO__={json.dumps(logo)};</script><script>{js}</script></body></html>'''
open('index.html','w').write(page(False))
os.makedirs('site',exist_ok=True)
open('site/index.html','w').write(page(True))
if not os.path.exists('site/config.js'):
    open('site/config.js','w').write('// Incollare qui la configurazione Firebase. Se resta vuota, i dati restano solo sul dispositivo.\nwindow.FIREBASE_CONFIG = null;\n')
json.dump({"name":"RifiutiPro (prova)","short_name":"RifiutiPro","start_url":"./","scope":"./","display":"standalone","background_color":"#F1F6FE","theme_color":"#0057F5","lang":"it","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any maskable"}]},open('site/manifest.webmanifest','w'),ensure_ascii=False,indent=1)
open('site/sw.js','w').write("""const C='rifiutipro-v2';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','index.html','manifest.webmanifest','icon-192.png'])));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim();});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request)));});
""")
ic=Image.open('/home/claude/ReQuoto/brand/v3/rifiutipro/AppIcon-1024.png').convert('RGB')
ic.resize((512,512),Image.LANCZOS).save('site/icon-512.png'); ic.resize((192,192),Image.LANCZOS).save('site/icon-192.png')
print(len(page(False)))
