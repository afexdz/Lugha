const B=require('../server/billing.cjs');
module.exports=B.wrap(async(req,res)=>{
 B.method(req,'GET');const c=B.config();const u=await B.user(req);
 const access=await B.rpc('lugha_access',{p_user:u.id},req);
 const isAdmin=await B.rpc('lugha_is_admin',{p_user:u.id},req);
 res.status(200).json({...access,isAdmin,billingEnabled:c.enabled,paymentEnabled:c.enabled,plan:B.PLAN});
});
