const B=require('../server/billing.cjs');
module.exports=B.wrap(async(req,res)=>{
 B.method(req,'POST');B.checkOrigin(req);const c=B.config();const u=await B.user(req);
 if(await B.rpc('lugha_lesson_restriction',{p_user:u.id},req))return res.status(403).json({allowed:false,reason:'suspended'});
 if(!c.enabled)return res.status(200).json({allowed:true,status:'preview'});
 const body=req.body || {};
 if(typeof body.sessionId!=='string'||!/^[-a-zA-Z0-9]{8,80}$/.test(body.sessionId)||typeof body.profileId!=='string'||!/^[-a-zA-Z0-9]{5,80}$/.test(body.profileId)||typeof body.language!=='string'||!/^[a-z]{2}$/.test(body.language))throw new B.HttpError(400,'Session de leçon invalide.');
 const access=await B.rpc('lugha_reserve_lesson',{p_user:u.id,p_session:body.sessionId,p_language:body.language,p_profile:body.profileId},req);
 res.status(access.allowed?200:403).json(access);
});
