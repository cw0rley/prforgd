/**
 * Generate Apple Client Secret JWT for Supabase
 *
 * Usage: node scripts/generate-apple-secret.js
 *
 * Before running, fill in the values below:
 * - TEAM_ID: Found at top right of https://developer.apple.com/account
 * - KEY_ID: From the key you created (visible at Keys page)
 * - CLIENT_ID: Your Services ID (e.g., com.prforgd.web)
 * - PRIVATE_KEY_PATH: Path to your .p8 file
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ===== FILL THESE IN =====
const TEAM_ID = 'YOUR_TEAM_ID';       // e.g., 'ABC123DEF4'
const KEY_ID = 'YOUR_KEY_ID';         // e.g., 'XYZ789'
const CLIENT_ID = 'com.prforgd.web';  // Your Services ID
const PRIVATE_KEY_PATH = './AuthKey.p8'; // Path to your downloaded .p8 file
// ==========================

function base64url(data) {
  return Buffer.from(data)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function generateAppleClientSecret() {
  const privateKey = fs.readFileSync(
    path.resolve(__dirname, PRIVATE_KEY_PATH),
    'utf8'
  );

  const now = Math.floor(Date.now() / 1000);
  const exp = now + 86400 * 180; // 6 months (max allowed by Apple)

  const header = {
    alg: 'ES256',
    kid: KEY_ID,
    typ: 'JWT',
  };

  const payload = {
    iss: TEAM_ID,
    iat: now,
    exp: exp,
    aud: 'https://appleid.apple.com',
    sub: CLIENT_ID,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  const sign = crypto.createSign('SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKey);

  // Convert DER signature to raw r||s format for ES256
  const r = signature.slice(4, 4 + signature[3]);
  let rPadded = r;
  if (r.length > 32) rPadded = r.slice(r.length - 32);
  if (r.length < 32) rPadded = Buffer.concat([Buffer.alloc(32 - r.length), r]);

  const sOffset = 4 + signature[3] + 2;
  const s = signature.slice(sOffset);
  let sPadded = s;
  if (s.length > 32) sPadded = s.slice(s.length - 32);
  if (s.length < 32) sPadded = Buffer.concat([Buffer.alloc(32 - s.length), s]);

  const rawSig = Buffer.concat([rPadded, sPadded]);
  const encodedSignature = base64url(rawSig);

  const jwt = `${signingInput}.${encodedSignature}`;

  console.log('\n=== Apple Client Secret (JWT) ===\n');
  console.log(jwt);
  console.log('\n=== Copy the above into Supabase → Authentication → Providers → Apple → Secret Key ===');
  console.log(`\nExpires: ${new Date(exp * 1000).toLocaleDateString()} (6 months)`);
  console.log('You will need to regenerate this before it expires.\n');
}

if (TEAM_ID === 'YOUR_TEAM_ID' || KEY_ID === 'YOUR_KEY_ID') {
  console.log('\n⚠️  Edit this file first!\n');
  console.log('Open scripts/generate-apple-secret.js and fill in:');
  console.log('  - TEAM_ID (from Apple Developer account, top right)');
  console.log('  - KEY_ID (from the key you created)');
  console.log('  - CLIENT_ID (your Services ID)');
  console.log('  - PRIVATE_KEY_PATH (path to your .p8 file)\n');
  console.log('Then put your .p8 file in the scripts/ folder and run again.');
  process.exit(1);
}

generateAppleClientSecret();
