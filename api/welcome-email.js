const { sendWelcomeEmail } = require('./_lib/emails');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify the request is from Supabase (shared secret)
  const authHeader = req.headers['authorization'];
  if (authHeader !== `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { type, record } = req.body;

  // Supabase sends this when a user confirms their email
  if (type === 'INSERT' && record?.email) {
    try {
      await sendWelcomeEmail(record.email);
    } catch (err) {
      console.error('Failed to send welcome email:', err);
    }
  }

  return res.status(200).json({ received: true });
};
