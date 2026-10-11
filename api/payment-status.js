const B=require('../server/billing.cjs');
module.exports=B.wrap(async(req,res)=>{
 B.method(req,'GET');const u=await B.user(req);
 res.status(200).json(await B.rpc('lugha_payment_status',{p_user:u.id},req));
});
