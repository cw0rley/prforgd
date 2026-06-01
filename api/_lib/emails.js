const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'PRForgd <noreply@prforgd.com>';

const BRAND = {
  bg: '#001228',
  card: '#001E3D',
  border: '#002B52',
  green: '#7FFF3B',
  text: '#FFFFFF',
  muted: '#8AAFC4',
};

function layout(content) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;padding:40px;">
        <tr><td>
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:900;letter-spacing:3px;color:${BRAND.green};text-align:center;">PRFORGD</h1>
          ${content}
        </td></tr>
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:${BRAND.muted};text-align:center;">
        PRForgd — Track your Hero WODs, chase your PRs.
      </p>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendWelcomeEmail(email) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to PRForgd',
    html: layout(`
      <h2 style="margin:24px 0 8px;font-size:20px;color:${BRAND.text};text-align:center;">Welcome, Athlete</h2>
      <p style="margin:0 0 24px;font-size:15px;color:${BRAND.muted};line-height:1.6;text-align:center;">
        You're in. PRForgd is your home for tracking Hero WODs, Girl WODs, and benchmark workouts.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;font-size:14px;color:${BRAND.text};">&#10003; Browse 200+ WODs</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:${BRAND.text};">&#10003; Log workouts & track PRs</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:${BRAND.text};">&#10003; Watch 130+ movement demos</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:${BRAND.text};">&#10003; Generate random WODs</td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
        <tr><td align="center">
          <a href="https://prforgd.com" style="display:inline-block;background:${BRAND.green};color:${BRAND.bg};font-size:16px;font-weight:800;letter-spacing:2px;text-decoration:none;padding:14px 32px;border-radius:8px;">GET STARTED</a>
        </td></tr>
      </table>
    `),
  });
}

async function sendSubscriptionConfirmation(email, plan) {
  const planLabel = plan === 'yearly' ? '$19.99/year' : '$1.99/month';
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Subscription Confirmed — PRForgd',
    html: layout(`
      <h2 style="margin:24px 0 8px;font-size:20px;color:${BRAND.text};text-align:center;">You're Unlimited</h2>
      <p style="margin:0 0 24px;font-size:15px;color:${BRAND.muted};line-height:1.6;text-align:center;">
        Your <strong style="color:${BRAND.text};">${planLabel}</strong> subscription is active. Here's what you unlocked:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:8px 0;font-size:14px;color:${BRAND.text};">&#10003; Unlimited workout logging</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:${BRAND.text};">&#10003; PR tracking across all workouts</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:${BRAND.text};">&#10003; Cloud sync across all devices</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:${BRAND.text};">&#10003; Custom WOD builder & scanner</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:${BRAND.text};">&#10003; CSV & JSON data export</td></tr>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
        <tr><td align="center">
          <a href="https://prforgd.com" style="display:inline-block;background:${BRAND.green};color:${BRAND.bg};font-size:16px;font-weight:800;letter-spacing:2px;text-decoration:none;padding:14px 32px;border-radius:8px;">START LOGGING</a>
        </td></tr>
      </table>
    `),
  });
}

async function sendCancellationEmail(email) {
  return resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Subscription Canceled — PRForgd',
    html: layout(`
      <h2 style="margin:24px 0 8px;font-size:20px;color:${BRAND.text};text-align:center;">We're Sorry to See You Go</h2>
      <p style="margin:0 0 16px;font-size:15px;color:${BRAND.muted};line-height:1.6;text-align:center;">
        Your subscription has been canceled. You'll keep access until the end of your current billing period.
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:${BRAND.muted};line-height:1.6;text-align:center;">
        After that, you can still browse all WODs and watch movement videos on the free tier.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td align="center">
          <a href="https://prforgd.com/paywall" style="display:inline-block;background:${BRAND.green};color:${BRAND.bg};font-size:16px;font-weight:800;letter-spacing:2px;text-decoration:none;padding:14px 32px;border-radius:8px;">RESUBSCRIBE</a>
        </td></tr>
      </table>
    `),
  });
}

module.exports = { sendWelcomeEmail, sendSubscriptionConfirmation, sendCancellationEmail };
