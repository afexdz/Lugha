const B = require('../server/billing.cjs');
module.exports = B.wrap(async (req, res) => {
  B.method(req, 'GET');
  const user = await B.user(req);
  const isAdmin = await B.rpc('lugha_is_admin', { p_user: user.id }, req);
  res.status(200).json({ isAdmin: isAdmin === true });
});
