// Firebase Admin setup. Used for (1) verifying login tokens and (2) reading/writing Firestore.
const admin = require('firebase-admin');

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Hosted (Render): the key is stored as an environment variable.
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
    });
  } else {
    // Local: falls back to GOOGLE_APPLICATION_CREDENTIALS if set.
    admin.initializeApp();
  }
}

// The Android app signs users in to its own Firebase project, so its tokens are
// checked against that project too. Checking a token only needs the project ID.
// Comma-separated list; set MOBILE_FIREBASE_PROJECT_IDS to "" to turn this off.
const mobileProjectIds = (process.env.MOBILE_FIREBASE_PROJECT_IDS ?? 'harvest-printing-centre-a7eb8')
  .split(',').map((id) => id.trim()).filter(Boolean);

const extraAuths = mobileProjectIds.map((projectId) => {
  const name = `mobile-${projectId}`;
  const app = admin.apps.find((a) => a && a.name === name)
    || admin.initializeApp({ ...admin.app().options, projectId }, name);
  return app.auth();
});

const db = admin.firestore();
module.exports = { admin, db, extraAuths };
