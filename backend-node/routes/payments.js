const express = require('express');
const Stripe = require('stripe');
const pool = require('../config/db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

function configured(res, needsPrice = true) {
  if (stripe && process.env.APP_URL && (!needsPrice || process.env.STRIPE_PRICE_ID)) return true;
  res.status(503).json({ error: 'Payments are not configured.' });
  return false;
}

router.post('/checkout-session', requireAuth, async (req, res) => {
  if (!configured(res)) return;
  try {
    const [rows] = await pool.query('SELECT email, stripe_customer_id FROM users WHERE user_id = ?', [req.user.user_id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found.' });
    let customerId = rows[0].stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: rows[0].email, metadata: { user_id: String(req.user.user_id) } });
      customerId = customer.id;
      await pool.query('UPDATE users SET stripe_customer_id = ? WHERE user_id = ?', [customerId, req.user.user_id]);
    }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.APP_URL.replace(/\/$/, '')}/go-premium.html?payment=success`,
      cancel_url: `${process.env.APP_URL.replace(/\/$/, '')}/go-premium.html?payment=cancelled`,
      client_reference_id: String(req.user.user_id),
      metadata: { user_id: String(req.user.user_id) },
      allow_promotion_codes: true,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[payments checkout]', err);
    res.status(502).json({ error: 'Could not start checkout.' });
  }
});

router.post('/portal-session', requireAuth, async (req, res) => {
  if (!configured(res, false)) return;
  try {
    const [rows] = await pool.query('SELECT stripe_customer_id FROM users WHERE user_id = ?', [req.user.user_id]);
    if (!rows[0]?.stripe_customer_id) return res.status(409).json({ error: 'No billing account exists yet.' });
    const session = await stripe.billingPortal.sessions.create({ customer: rows[0].stripe_customer_id, return_url: `${process.env.APP_URL.replace(/\/$/, '')}/go-premium.html` });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[payments portal]', err);
    res.status(502).json({ error: 'Could not open billing management.' });
  }
});

async function webhook(req, res) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).send('Payments are not configured.');
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.warn('[payments webhook] invalid signature');
    return res.status(400).send('Invalid webhook signature.');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [seen] = await conn.query('SELECT event_id FROM payment_events WHERE event_id = ?', [event.id]);
    if (seen.length) {
      await conn.rollback();
      return res.json({ received: true, duplicate: true });
    }
    const object = event.data.object;
    if (event.type === 'checkout.session.completed') {
      await conn.query("UPDATE users SET subscription_type = 'Premium', subscription_status = 'active', stripe_customer_id = ?, stripe_subscription_id = ? WHERE user_id = ?", [object.customer, object.subscription, object.metadata?.user_id || object.client_reference_id]);
    } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const active = ['active', 'trialing'].includes(object.status);
      await conn.query('UPDATE users SET subscription_type = ?, subscription_status = ?, stripe_subscription_id = ?, subscription_current_period_end = FROM_UNIXTIME(?) WHERE stripe_customer_id = ?', [active ? 'Premium' : 'Free', active ? 'active' : (object.status === 'canceled' ? 'cancelled' : 'expired'), object.id, object.current_period_end || null, object.customer]);
    } else if (event.type === 'invoice.payment_failed') {
      await conn.query("UPDATE users SET subscription_type = 'Free', subscription_status = 'expired' WHERE stripe_customer_id = ?", [object.customer]);
    }
    await conn.query('INSERT INTO payment_events (event_id, event_type) VALUES (?, ?)', [event.id, event.type]);
    await conn.commit();
    res.json({ received: true });
  } catch (err) {
    await conn.rollback();
    console.error('[payments webhook]', err);
    res.status(500).json({ error: 'Webhook processing failed.' });
  } finally {
    conn.release();
  }
}

module.exports = { router, webhook };
