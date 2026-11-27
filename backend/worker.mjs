import { normalizePhone } from '../site/assets/phone.mjs';

const origins = new Set(['https://jsweb3.dev','https://www.jsweb3.dev']);
const services = new Set(['app','web','corporate','mini-program','dapp','integration']);
const uuid = /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/i;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (new URL(request.url).pathname !== '/brief') return new Response(null,{status:404});
    if (!origins.has(origin)) return new Response(null,{status:403});
    const headers = {'Access-Control-Allow-Origin':origin,'Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS','Cache-Control':'no-store','Vary':'Origin'};
    const respond = (status,ok=false) => Response.json({ok},{status,headers});
    if (request.method==='OPTIONS') return new Response(null,{status:204,headers});
    if (request.method!=='POST') return respond(405);
    if (request.headers.get('Content-Type')?.split(';')[0]!=='application/json') return respond(415);
    if (!env.BRIEF_LIMITER || !env.APPS_SCRIPT_URL || !env.INTAKE_SECRET) return respond(503);
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!(await env.BRIEF_LIMITER.limit({key:ip})).success) return respond(429);
    const reader = request.body?.getReader();
    if (!reader) return respond(400);
    const decoder = new TextDecoder();
    let size = 0;
    let body = '';
    let fields;
    try {
      for (;;) {
        const {done,value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 12288) {
          await reader.cancel();
          return respond(413);
        }
        body += decoder.decode(value,{stream:true});
      }
      fields = JSON.parse(body + decoder.decode());
    } catch { return respond(400); }
    if (!fields || typeof fields !== 'object') return respond(400);
    const name = typeof fields.name === 'string' ? fields.name.trim() : '';
    const description = typeof fields.description === 'string' ? fields.description.trim() : '';
    const phone = typeof fields.phone === 'string' && normalizePhone(fields.phone,fields.region);
    if (fields.website || fields.consent!=='on' || !uuid.test(fields.requestId) || !name || name.length>80 || !phone || description.length<8 || description.length>2000) return respond(400);
    try {
      const response = await fetch(env.APPS_SCRIPT_URL,{
        method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(20000),
        body:JSON.stringify({token:env.INTAKE_SECRET,requestId:fields.requestId,name,phone,description,lang:fields.lang==='en'?'en':'zh-CN',service:services.has(fields.service)?fields.service:''}),
      });
      if (response.ok && (await response.json()).ok) return respond(200,true);
    } catch { /* The visitor can retry with the same request ID. */ }
    return respond(502);
  },
};
