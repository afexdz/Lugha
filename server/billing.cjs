'use strict';
const PLAN = Object.freeze({ id:'lugha-quarter', amount:2000, currency:'dzd', months:3, trialDays:3, trialLessons:3, profiles:1 });
class HttpError extends Error { constructor(status,message) { super(message); this.status=status; } }
function config() {
  const env=process.env;
  return { url:(env.SUPABASE_URL || 'https://rdbybcorqbbfshimgfnr.supabase.co').replace(/\/$/,''), key:env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Euo6P0bAB6DClY1obRXNrg_rKJstRHv', origin:env.APP_ORIGIN || 'https://www.lugha.world', enabled:env.BILLING_ENABLED==='true' };
}
async function request(url,opts) {
  const r=await fetch(url,{...opts,signal:AbortSignal.timeout(15000)});
  if(!r.ok) throw new HttpError(502,'Service momentanément indisponible. Réessaie dans un instant.');
  return r.json();
}
async function rpc(name,args,req) {
 const c=config();return request(`${c.url}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:c.key,Authorization:req.headers.authorization,'Content-Type':'application/json'},body:JSON.stringify(args)});
}
async function user(req) {
 const c=config();const token=/^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
 if(!token) throw new HttpError(401,'Connecte-toi pour continuer.');
 const r=await fetch(`${c.url}/auth/v1/user`,{headers:{apikey:c.key,Authorization:`Bearer ${token}`},signal:AbortSignal.timeout(15000)});
 if(!r.ok) throw new HttpError(401,'Reconnecte-toi pour continuer.');
 const u=await r.json();if(!u.id) throw new HttpError(401,'Session invalide.');return u;
}
function checkOrigin(req) {
 const c=config();if(req.headers.origin && req.headers.origin!==c.origin) throw new HttpError(403,'Origine invalide.');
}
function wrap(fn) {return async(req,res)=>{res.setHeader('Cache-Control','no-store');try {await fn(req,res);}catch(e){res.status(e.status || 500).json({error:e.status?e.message:'Une erreur est survenue.'});}};}
function method(req,allowed) {if(req.method!==allowed)throw new HttpError(405,'Méthode non autorisée.');}
module.exports={PLAN,HttpError,config,request,rpc,user,checkOrigin,wrap,method};
