const B=require('../server/billing.cjs');
module.exports=B.wrap(async(req,res)=>{
 B.method(req,'POST');B.checkOrigin(req);const c=B.config();const u=await B.user(req);
 if(!c.enabled)throw new B.HttpError(503,'Les paiements ne sont pas encore ouverts.');
 const body=req.body || {};
 if(typeof body.reference!=='string'||!/^[-a-zA-Z0-9 /]{4,80}$/.test(body.reference.trim())||typeof body.transferDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(body.transferDate))throw new B.HttpError(400,'Indique la référence et la date du virement.');
 const date=new Date(body.transferDate+'T00:00:00Z');
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==body.transferDate||date>Date.now()||date<Date.now()-30*86400000)throw new B.HttpError(400,'La date doit correspondre à un virement effectué dans les 30 derniers jours.');
 const payment=await B.rpc('lugha_request_payment',{p_user:u.id,p_reference:body.reference.trim(),p_date:body.transferDate},req);
 res.status(200).json(payment);
});
