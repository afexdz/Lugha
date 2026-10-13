const B=require('../server/billing.cjs');
module.exports=B.wrap(async(req,res)=>{
 const c=B.config();const u=await B.user(req);
 if(!await B.rpc('lugha_is_admin',{p_user:u.id},req))throw new B.HttpError(403,'Accès réservé à la gestion des paiements.');
 if(req.method==='GET')return res.status(200).json(await B.rpc('lugha_pending_payments',{},req));
 B.method(req,'POST');B.checkOrigin(req);
 const b=req.body || {};
 if(typeof b.paymentId!=='string'||!/^[a-f0-9-]{36}$/i.test(b.paymentId)||!['approve','reject'].includes(b.action)||typeof b.reason!=='string'||b.reason.length>300)throw new B.HttpError(400,'Décision invalide.');
 if(b.action==='reject'&&b.reason.trim().length<3)throw new B.HttpError(400,'Indique un motif de refus.');
 if(b.action==='approve'&&b.receivedVerified!==true)throw new B.HttpError(400,'Vérifie le virement réellement reçu avant d’activer l’accès.');
 res.status(200).json(await B.rpc('lugha_review_payment',{p_payment:b.paymentId,p_admin:u.id,p_approve:b.action==='approve',p_reason:b.reason.trim()},req));
});
