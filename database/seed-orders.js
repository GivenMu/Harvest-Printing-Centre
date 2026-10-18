// Adds 10 simulated orders so the "orders" collection has at least 10 documents.
// Prices are copied from the services collection, the same way the API does it.
//
// Usage (PowerShell, from the database folder):
//   $env:FIREBASE_SERVICE_ACCOUNT = Get-Content "C:/path/to/your-key.json" -Raw
//   node seed-orders.js
//
// Safe to run again: each document has a fixed ID, so it overwrites itself.
// Seeded orders carry source: "seed" so they can be deleted before the real launch.
const fs = require('fs');
const admin = require('firebase-admin');

let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else if (fs.existsSync(__dirname + '/serviceAccountKey.json')) {
  credential = require('./serviceAccountKey.json');
} else {
  console.error('No credentials found. See the instructions at the top of this file.');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(credential) });
const db = admin.firestore();
const ts = (iso) => admin.firestore.Timestamp.fromDate(new Date(iso));

// [serviceId, quantity] pairs per order
const plans = [
  [['business-cards', 2]],
  [['golf-tshirts', 10], ['lanyards', 20]],
  [['round-neck-tshirts', 15]],
  [['invoice-books', 3], ['books', 5]],
  [['gift-bags', 100]],
  [['plastic-bags', 200], ['gift-bags', 50]],
  [['programmes', 1]],
  [['acrylic-signs', 1]],
  [['3d-signage', 1], ['business-cards', 1]],
  [['gazebos', 2], ['flags', 2]],
];
const statuses = ['Pending', 'Confirmed', 'Completed'];

(async () => {
  const snap = await db.collection('services').get();
  const services = {};
  snap.docs.forEach((d) => (services[d.id] = d.data()));
  if (Object.keys(services).length === 0) {
    console.error('The services collection is empty. Run seed.js first.');
    process.exit(1);
  }

  const batch = db.batch();
  plans.forEach((plan, i) => {
    let total = 0;
    let requiresQuote = false;
    const items = plan.map(([serviceId, quantity]) => {
      const s = services[serviceId];
      if (!s) throw new Error('Unknown service in plan: ' + serviceId);
      const unitPrice = typeof s.price === 'number' ? s.price : null;
      if (unitPrice === null) requiresQuote = true; else total += unitPrice * quantity;
      return { serviceId, name: s.name, quantity, unitPrice };
    });
    const id = 'seed-order-' + String(i + 1).padStart(2, '0');
    batch.set(db.collection('orders').doc(id), {
      userId: 'seed-user-' + String((i % 3) + 1),
      items, total, requiresQuote,
      status: statuses[i % 3],
      source: 'seed',
      createdAt: ts(`2026-10-${String(i + 8).padStart(2, '0')}T10:00:00Z`),
    });
  });
  await batch.commit();
  console.log(`orders: ${plans.length} documents written`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
