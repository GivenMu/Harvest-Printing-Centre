// Protects routes: the app sends "Authorization: Bearer <Firebase ID token>".
const { admin } = require('../firebase');

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: 'Missing or malformed Authorization header' });

  try {
    const decoded = await admin.auth().verifyIdToken(match[1]);
    req.user = { uid: decoded.uid, email: decoded.email || null };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
