// Public, read-only. Data lives in the Firestore "services" collection.
const express = require('express');
const { db } = require('../firebase');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const snap = await db.collection('services').get();
    const services = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    res.status(200).json(services);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await db.collection('services').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Service not found' });
    res.status(200).json({ id: doc.id, ...doc.data() });
  } catch (err) { next(err); }
});

module.exports = router;
