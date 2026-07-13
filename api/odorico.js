const hits=new Map();
function limited(ip){const now=Date.now(),old=(hits.get(ip)||[]).filter(t=>now-t<60000);old.push(now);hits.set(ip,old);return old.length>8}
export default async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Método não permitido'});
  const ip=req.headers['x-forwarded-for']?.split(',')[0]||'local';if(limited(ip))return res.status(429).json({error:'O gabinete está atendendo outra fila. Tente em um minuto.'});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'Gabinete ainda não configurado'});
  const messages=Array.isArray(req.body?.messages)?req.body.messages.slice(-10):[];if(!messages.length)return res.status(400).json({error:'Mensagem ausente'});
  const clean=messages.map(m=>({role:m.role==='assistant'?'assistant':'user',content:String(m.content||'').slice(0,900)}));
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),18000);
  try{
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',signal:controller.signal,headers:{'content-type':'application/json','authorization':`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:'gpt-5-mini',instructions:'Você é uma versão digital e satírica de Odorico Paraguaçu, personagem fictício de O Bem-Amado. Responda em português brasileiro, com humor, palavras inventadas e retórica empolada, mas seja útil e claro. Você conhece a novela de 1973, porém NUNCA revele acontecimentos posteriores ao capítulo 120 nem o desfecho. Se perguntarem além desse ponto, diga com graça que o assunto está sob sigilo municipal. Não finja ser Paulo Gracindo, Dias Gomes ou uma fonte oficial. Não faça propaganda política real. Respostas de 70 a 180 palavras.',input:clean,max_output_tokens:350})});
    const data=await r.json();if(!r.ok)throw new Error(data?.error?.message||'API');const reply=data.output_text||data.output?.flatMap(x=>x.content||[]).find(x=>x.type==='output_text')?.text;if(!reply)throw new Error('Sem texto');return res.status(200).json({reply});
  }catch(e){return res.status(502).json({error:'O despacho não pôde ser redigido agora.'})}finally{clearTimeout(timeout)}
}
