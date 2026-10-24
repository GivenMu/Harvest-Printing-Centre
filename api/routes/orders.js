// Replaces WhatsApp ordering. Body: { "items": [ { "serviceId": "business-cards", "quantity": 2 } ] }
// Prices are read from the services collection, never trusted from the app.
const express = require('express');
const { db, admin } = require('../firebase');
const requireAuth = require('../middleware/auth');
const v = require('../validators');

const router = express.Router();
router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const items = req.body && req.body.items;
    if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
      return res.status(400).json({ error: 'items must be a non-empty array' });
    }
    const lines = [];
    let total = 0;
    let requiresQuote = false;
    for (const it of items) {
      if (!it || !v.isNonEmptyString(it.serviceId, 100) || !v.isPositiveInt(it.quantity)) {
        return res.status(400).json({ error: 'Each item needs a serviceId and a positive whole quantity' });
      }
      const doc = await db.collection('services').doc(it.serviceId).get();
      if (!doc.exists) return res.status(400).json({ error: `Unknown service: ${it.serviceId}` });
      const s = doc.data();
      const unitPrice = typeof s.price === 'number' ? s.price : null;
      if (unitPrice === null) requiresQuote = true; else total += unitPrice * it.quantity;
      lines.push({ serviceId: doc.id, name: s.name, quantity: it.quantity, unitPrice });
    }
    const data = {
      userId: req.user.uid,
      customerName: req.user.name,
      customerEmail: req.user.email,
      items: lines,
      total,
      requiresQuote,
      status: 'Pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const ref = await db.collection('orders').add(data);
    res.status(201).json({ id: ref.id, ...data, createdAt: undefined });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const snap = await db.collection('orders').where('userId', '==', req.user.uid).get();
    res.status(200).json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) { next(err); }
});

module.exports = router;
