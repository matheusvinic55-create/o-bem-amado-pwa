const CACHE='sucupira-v39';
const CORE=['/','/index.html','/buzios','/buzios/','/buzios/index.html','/manifest.webmanifest','/assets/capa-sucupira.webp','/assets/personagens/zeca-diabo.svg','/assets/personagens/dr-juarez.svg','/assets/personagens/telma.svg','/assets/personagens/donana.svg','/assets/personagens/gisa.svg','/assets/personagens/ceceu.svg','/assets/personagens/zora.svg','/icons/icon-192.png','/icons/icon-512.png'];

const CHAPTERS_141_151=`  const summaries=[
  [141,'08/08/1973','Gisa liga para Jairo para saber como ele está. Maestro Sabiá declara seu amor por Judicéia, Zelão tem uma visão e Juarez decide enfrentar a proibição do uso da fonte.'],
  [142,'09/08/1973','Juarez bebe água da fonte, incentiva o povo a fazer o mesmo e acaba espancado por jagunços do prefeito. Jaciara pede a Mestre Ambrósio que não revele um segredo a Zeca Diabo.'],
  [143,'10/08/1973','Zeca Diabo agride a irmã. Odorico descobre que a água da fonte é radioativa e, ao lado de Dirceu, continua espionando as confissões da igreja. Juarez e Telma constroem uma asa para Zelão.'],
  [144,'13/08/1973','Odorico e Dirceu ouvem a confissão de Emiliano Medrado sobre o sumiço do corpo. O prefeito atiça a rivalidade entre Cajazeiras e Medrados e promete ajudar os pescadores.'],
  [145,'14/08/1973','Cecéu volta a Sucupira. Cajazeiras e Medrados caem na armadilha de Odorico, Donana manda soldados vigiarem os Cajazeiras e Zeca Diabo vai à casa do coronel.'],
  [146,'15/08/1973','Hilário Cajazeira pede a Zeca Diabo que mate Emiliano Medrado. Cecéu dá uma surra em Jairo, enquanto os coronéis Medrado e Cajazeira ficam frente a frente.'],
  [147,'16/08/1973','A tensão aumenta em Sucupira. Dirceu se choca com os planos de Odorico, o prefeito faz uma proposta a Zeca Diabo e Anita procura Neco, com quem acaba se beijando.'],
  [148,'17/08/1973','Odorico escuta as confissões da própria irmã. Zeca Diabo se prepara para colocar em prática o plano do prefeito, Dirceu desabafa com Juarez e Telma se desentende com o médico.'],
  [149,'20/08/1973','Zeca Diabo espanca o filho do Coronel Cajazeira. Doutor Leão alerta Hilário sobre as armações de Odorico, e o coronel procura o prefeito jurando vingança contra os Medrado.'],
  [150,'21/08/1973','Coronel Cajazeira faz uma proposta a Zeca Diabo. Os coronéis Medrado e Cajazeira se enfrentam, enquanto Padre Honório descobre quem está escutando as confissões.'],
  [151,'22/08/1973','A população fica aterrorizada com a guerra entre Medrados e Cajazeiras. Zeca Diabo tenta convencer Odorico a encerrar o confronto, e Emiliano Medrado é baleado.']];
  const arcs=[[141,145,'141–145 · Fonte e armadilhas'],[146,151,'146–151 · Guerra em Sucupira']];let activeArc=0;`;

function upgradeIndex(html){
  html=html.replace('Capítulos 121 a 140.','Capítulos 141 a 151.');
  html=html.replace('Acompanhe por arcos de capítulos. O material para exatamente no 140, sem atravessar a margem dos spoilers.','Acompanhe por arcos de capítulos. O material para exatamente no 151, sem atravessar a margem dos spoilers.');
  html=html.replaceAll('capítulo 140','capítulo 151');
  html=html.replace(/  const summaries=\[[\s\S]*?\n  const arcs=\[\[121,126,[\s\S]*?\]\];let activeArc=0;/,CHAPTERS_141_151);
  return html;
}

async function upgradeResponse(response){
  const text=await response.text();
  const headers=new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');
  headers.delete('etag');
  return new Response(upgradeIndex(text),{status:response.status,statusText:response.statusText,headers});
}

self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).pathname.startsWith('/api/'))return;
  const path=new URL(e.request.url).pathname;
  const isIndex=path==='/'||path==='/index.html';
  e.respondWith(fetch(e.request).then(async r=>{
    const finalResponse=isIndex?await upgradeResponse(r):r;
    const copy=finalResponse.clone();
    caches.open(CACHE).then(c=>c.put(e.request,copy));
    return finalResponse;
  }).catch(async()=>{
    const cached=await caches.match(e.request)||await caches.match('/index.html');
    if(!cached)return cached;
    return isIndex?upgradeResponse(cached):cached;
  }));
});
