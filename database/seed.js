// Seeds Firestore with the catalogue plus simulated bookings and enquiries.
// Every collection ends up with at least 10 documents (the Task 2 requirement).
//
// Usage:
//   1. Firebase console > Project settings > Service accounts > Generate new private key.
//   2. Save the file as database/serviceAccountKey.json (it is in .gitignore: never commit it),
//      or set the FIREBASE_SERVICE_ACCOUNT environment variable to the JSON text.
//   3. cd database && npm install && node seed.js
//
// It is safe to run again: each document has a fixed ID, so it overwrites itself.
const fs = require('fs');
const admin = require('firebase-admin');

let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  credential = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else if (fs.existsSync(__dirname + '/serviceAccountKey.json')) {
  credential = require('./serviceAccountKey.json');
} else {
  console.error('No credentials found. See the instructions at the top of seed.js.');
  process.exit(1);
}
admin.initializeApp({ credential: admin.credential.cert(credential) });
const db = admin.firestore();
const ts = (iso) => admin.firestore.Timestamp.fromDate(new Date(iso));

// ---------- services (prices are the ones shown on the website) ----------
const services = [
  ['business-cards',  'Business Cards',      'Business Printing',   'Professional business cards.', 300, 'R300 for 100', 'business-card.jpeg'],
  ['golf-tshirts',    'Golf T-Shirts',       'Branded Clothing',    'Branded golf shirts for companies, events and uniforms.', 200, 'R200', 'golf-tshirt.jpeg'],
  ['round-neck-tshirts','Round Neck T-Shirts','Branded Clothing',   'Custom round neck shirts for promotions and teams.', 150, 'R150', 'round-neck-tshirt.jpeg'],
  ['invoice-books',   'Invoice Books',       'Business Printing',   'Invoice and quotation books for your business.', 150, 'From R150', 'invoice-quotation-books.jpeg'],
  ['books',           'Books',               'Business Printing',   'Printed books and booklets.', 100, 'From R100', 'books.jpeg'],
  ['gift-bags',       'Gift Bags',           'Packaging',           'Gift bags that keep your products on-brand.', 11, 'From R11', 'gift-bag.jpeg'],
  ['plastic-bags',    'Plastic Bags',        'Packaging',           'Personalised plastic bags.', 5, 'From R5', 'personalised-plastic-bags.jpeg'],
  ['programmes',      'Programmes',          'Event Printing',      'Customised wedding programmes and event prints.', null, null, 'customised-programmes.jpeg'],
  ['acrylic-signs',   'Acrylic Sign',        'Signage',             'Acrylic signs that improve business visibility.', 2500, 'From R2500', 'acrylic-sign.jpeg'],
  ['3d-signage',      '3D Signage',          'Signage',             '3D signage for a strong first impression.', 3500, 'From R3500', '3d-signage.jpeg'],
  ['lanyards',        'Lanyards',            'Promotional Displays','Printed lanyards for staff and events.', 30, 'R30 each', 'lanyard.jpeg'],
  ['flags',           'Flags',               'Promotional Displays','Telescopic flags for events and public visibility.', null, null, 'telescopic-flag.jpeg'],
  ['gazebos',         'Gazebos',             'Promotional Displays','Branded gazebos for events and outdoor marketing.', 2500, 'From R2500', 'gazebos.jpeg'],
  ['photo-canvas',    'Photo Canvas',        'Promotional Displays','Canvas prints and large-format branding.', null, null, 'photo-canvas.jpeg'],
].map(([id, name, category, description, price, priceLabel, imageFile], i) => ({
  id, data: { name, category, description, price, priceLabel, imageFile, sortOrder: i + 1 },
}));

// ---------- portfolio (same pictures and captions as portfolio.html) ----------
const portfolio = [
  ['round-neck-tshirt.jpeg', 'Branded Clothing', 'Branded shirt', 'round-neck-tshirts'],
  ['acrylic-sign.jpeg', 'Acrylic Signs', 'Acrylic sign', 'acrylic-signs'],
  ['telescopic-flag.jpeg', 'Telescopic Flags', 'Telescopic flags', 'flags'],
  ['3d-signage.jpeg', '3D Signage', '3D signage', '3d-signage'],
  ['gift-bag.jpeg', 'Gift Bags', 'Gift bags', 'gift-bags'],
  ['photo-canvas.jpeg', 'Photo Canvas', 'Canvas', 'photo-canvas'],
  ['gazebos.jpeg', 'Gazebos', 'Gazebo', 'gazebos'],
  ['business-card.jpeg', 'Business Cards', 'Business cards', 'business-cards'],
  ['invoice-quotation-books.jpeg', 'Invoice and quotation books', 'Invoice and quotation books', 'invoice-books'],
  ['golf-tshirt.jpeg', 'Golf T-shirts', 'Golf T-shirts', 'golf-tshirts'],
  ['books.jpeg', 'Books', 'Books', 'books'],
  ['lanyard.jpeg', 'Lanyards', 'Lanyards', 'lanyards'],
  ['personalised-plastic-bags.jpeg', 'Personalised Plastic Bags', 'Personalised plastic bags', 'plastic-bags'],
  ['customised-programmes.jpeg', 'Customised Programmes', 'Customised wedding programmes', 'programmes'],
].map(([imageFile, title, alt, serviceId], i) => ({
  id: 'portfolio-' + String(i + 1).padStart(2, '0'),
  data: { title, alt, imageFile, serviceId, sortOrder: i + 1, uploadDate: ts('2026-10-18T08:00:00Z') },
}));

// ---------- simulated bookings (clearly marked with source: "seed") ----------
const people = [
  ['Thandi Mokoena', '0820000001'], ['Sipho Dlamini', '0820000002'], ['Naledi Khumalo', '0820000003'],
  ['Pieter van Wyk', '0820000004'], ['Lerato Sithole', '0820000005'], ['Ayanda Zulu', '0820000006'],
  ['Kabelo Molefe', '0820000007'], ['Zanele Ndlovu', '0820000008'], ['Johan Botha', '0820000009'],
  ['Palesa Mahlangu', '0820000010'],
];
const statuses = ['Pending', 'Confirmed', 'Completed'];
const bookings = people.map(([name, phone], i) => {
  const s = services[i % services.length];
  return {
    id: 'seed-booking-' + String(i + 1).padStart(2, '0'),
    data: {
      name, phone, email: `sample${String(i + 1).padStart(2, '0')}@example.com`,
      service: s.data.name, serviceId: s.id, quantity: (i + 1) * 10,
      date: `2026-11-${String(i + 5).padStart(2, '0')}`,
      message: 'Simulated booking for testing.',
      status: statuses[i % 3], source: 'seed', createdAt: ts(`2026-10-${String(i + 1).padStart(2, '0')}T09:00:00Z`),
    },
  };
});

// ---------- simulated contact enquiries ----------
const contacts = people.map(([name, phone], i) => ({
  id: 'seed-contact-' + String(i + 1).padStart(2, '0'),
  data: {
    name, phone, email: `sample${String(i + 1).padStart(2, '0')}@example.com`,
    service: services[(i + 3) % services.length].data.name,
    message: 'Simulated enquiry: please send me a quote.',
    status: i % 2 ? 'Replied' : 'New', source: 'seed',
    createdAt: ts(`2026-10-${String(i + 3).padStart(2, '0')}T11:30:00Z`),
  },
}));

async function load(name, docs) {
  const batch = db.batch();
  docs.forEach(({ id, data }) => batch.set(db.collection(name).doc(id), data));
  await batch.commit();
  console.log(`${name}: ${docs.length} documents written`);
}

(async () => {
  await load('services', services);
  await load('portfolio', portfolio);
  await load('bookings', bookings);
  await load('contacts', contacts);
  console.log('Done. Check each collection in the Firebase console for 10+ documents.');
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
