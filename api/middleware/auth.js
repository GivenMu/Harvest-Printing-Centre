// Protects routes: the app sends "Authorization: Bearer <Firebase ID token>".
// Tokens from the website's project and from the Android app's project are both accepted.
const { admin, extraAuths = [] } = require('../firebase');

async function verify(token) {
  for (const auth of [admin.auth(), ...extraAuths]) {
    try {
      return await auth.verifyIdToken(token);
    } catch (err) {
      // Wrong project or bad token: try the next project.
    }
  }
  return null;
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) return res.status(401).json({ error: 'Missing or malformed Authorization header' });

  const decoded = await verify(match[1]);
  if (!decoded) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = { uid: decoded.uid, email: decoded.email || null, name: decoded.name || null };
  next();
}

module.exports = requireAuth;
