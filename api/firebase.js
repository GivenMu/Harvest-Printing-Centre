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

const db = admin.firestore();
module.exports = { admin, db };
