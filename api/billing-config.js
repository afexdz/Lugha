module.exports=(req,res)=>{
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'Méthode non autorisée.'});
 res.status(200).json({enabled:process.env.BILLING_ENABLED==='true'});
};
