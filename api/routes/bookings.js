// Bookings belong to the logged-in user (userId = Firebase uid).
const express = require('express');
const { db, admin } = require('../firebase');
const requireAuth = require('../middleware/auth');
const v = require('../validators');

const router = express.Router();
router.use(requireAuth);

// Returns an error message, or null if the body is valid.
function validateBooking(b, partial = false) {
  const rules = {
    name: (x) => v.isNonEmptyString(x, 100),
    phone: v.isValidPhone,
    email: v.isValidEmail,
    service: (x) => v.isNonEmptyString(x, 100),
    quantity: v.isPositiveInt,
    date: v.isValidDate,
    message: (x) => typeof x === 'string' && x.length <= 1000,
  };
  const required = ['name', 'phone', 'email', 'service', 'quantity', 'date'];
  if (!b || typeof b !== 'object') return 'Body must be JSON';
  if (!partial) {
    for (const f of required) if (b[f] === undefined) return `${f} is required`;
  }
  for (const [f, ok] of Object.entries(rules)) {
    if (b[f] !== undefined && !ok(b[f])) return `${f} is invalid`;
  }
  return null;
}

const FIELDS = ['name', 'phone', 'email', 'service', 'serviceId', 'quantity', 'date', 'message'];
const pick = (b) => Object.fromEntries(FIELDS.filter((f) => b[f] !== undefined).map((f) => [f, b[f]]));

router.post('/', async (req, res, next) => {
  try {
    const error = validateBooking(req.body);
    if (error) return res.status(400).json({ error });
    const data = {
      ...pick(req.body),
      message: req.body.message || '',
      userId: req.user.uid,
      status: 'Pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await db.collection('bookings').add(data);
    res.status(201).json({ id: ref.id, ...data, createdAt: undefined });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const snap = await db.collection('bookings').where('userId', '==', req.user.uid).get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.status(200).json(list);
  } catch (err) { next(err); }
});

// Loads a booking only if it belongs to the caller.
async function ownBooking(id, uid) {
  const ref = db.collection('bookings').doc(id);
  const doc = await ref.get();
  if (!doc.exists || doc.data().userId !== uid) return null;
  return ref;
}

router.put('/:id', async (req, res, next) => {
  try {
    const error = validateBooking(req.body, true);
    if (error) return res.status(400).json({ error });
    const updates = pick(req.body);
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Nothing to update' });
    const ref = await ownBooking(req.params.id, req.user.uid);
    if (!ref) return res.status(404).json({ error: 'Booking not found' });
    await ref.update(updates);
    res.status(200).json({ id: req.params.id, ...updates });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ref = await ownBooking(req.params.id, req.user.uid);
    if (!ref) return res.status(404).json({ error: 'Booking not found' });
    await ref.delete();
    res.status(200).json({ deleted: req.params.id });
  } catch (err) { next(err); }
});

module.exports = router;
