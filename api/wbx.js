const B=require('../server/billing.cjs');
module.exports=B.wrap(async(req,res)=>{
 const u=await B.user(req);
 if(!await B.rpc('lugha_is_admin',{p_user:u.id},req))throw new B.HttpError(403,'Ce compte n’est pas autorisé à accéder à cet espace.');
 if(req.method==='GET'){
  const url=new URL(req.url,'https://www.lugha.world');const section=url.searchParams.get('section') || 'overview';
  if(section==='overview'){
   const days=Number(url.searchParams.get('days') || 30);if(![7,30,90].includes(days))throw new B.HttpError(400,'Période invalide.');
   return res.status(200).json(await B.rpc('lugha_wbx_overview',{p_days:days},req));
  }
  if(section==='users'){
   const page=Number(url.searchParams.get('page') || 0),search=url.searchParams.get('search') || '';
   if(!Number.isInteger(page)||page<0||page>100000||search.length>100)throw new B.HttpError(400,'Recherche invalide.');
   return res.status(200).json(await B.rpc('lugha_wbx_users',{p_page:page,p_search:search},req));
  }
  if(section==='payments'){
   const status=url.searchParams.get('status') || 'pending';if(!['pending','approved','rejected'].includes(status))throw new B.HttpError(400,'Statut invalide.');
   return res.status(200).json(await B.rpc('lugha_wbx_payments',{p_status:status},req));
  }
  if(section==='audit')return res.status(200).json(await B.rpc('lugha_wbx_audit',{},req));
  throw new B.HttpError(400,'Section invalide.');
 }
 B.method(req,'POST');B.checkOrigin(req);const b=req.body || {};
 if(typeof b.userId!=='string'||!/^[a-f0-9-]{36}$/i.test(b.userId)||!['suspend','restore'].includes(b.action)||typeof b.reason!=='string'||b.reason.trim().length<3||b.reason.length>300)throw new B.HttpError(400,'Choisis une action et indique un motif.');
 res.status(200).json(await B.rpc('lugha_wbx_manage_user',{p_user:b.userId,p_suspend:b.action==='suspend',p_reason:b.reason.trim()},req));
});
