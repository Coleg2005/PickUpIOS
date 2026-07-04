import { Router } from 'express';

const router = Router();

// Public privacy policy page. App Store Connect and Google Play both require
// a privacy policy URL: https://pickupiosbackend.me/privacy
// Keep this accurate — it must match what the app actually collects and the
// answers given in the App Store privacy questionnaire.
const EFFECTIVE_DATE = 'July 4, 2026';
const CONTACT_EMAIL = 'cole.garrison.005@gmail.com';

router.get('/privacy', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PickUp — Privacy Policy</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f5; margin: 0; padding: 24px 16px; color: #333; line-height: 1.6; }
      .card { background: white; border-radius: 16px; padding: 40px 32px; max-width: 720px; margin: 0 auto; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
      h1 { margin: 0 0 4px; font-size: 28px; color: #111; }
      .date { color: #888; font-size: 14px; margin-bottom: 28px; }
      h2 { font-size: 20px; color: #111; margin: 28px 0 8px; }
      p, li { font-size: 15px; color: #444; }
      ul { padding-left: 22px; }
      a { color: #007AFF; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>PickUp Privacy Policy</h1>
      <div class="date">Effective ${EFFECTIVE_DATE}</div>

      <p>PickUp is a mobile app for finding and organizing pick-up sports games. This policy describes what information the app collects, how it is used, and the choices you have.</p>

      <h2>Information we collect</h2>
      <ul>
        <li><strong>Account information:</strong> your username, email address, and password. Passwords are stored only as salted bcrypt hashes — we never store or see your actual password.</li>
        <li><strong>Profile information:</strong> an optional profile description and profile picture you choose to upload.</li>
        <li><strong>Location:</strong> when you grant permission, your device location is used to find nearby venues and games. Venue searches are processed through Foursquare. We store the locations of games you create, not a history of your movements.</li>
        <li><strong>Content you create:</strong> games you organize or join, chat messages in game groups, friend connections, and reports you submit.</li>
        <li><strong>Push notification tokens:</strong> a device token so we can send you notifications about your games, messages, and friend requests.</li>
      </ul>
      <p>We do not collect contacts, browsing history, advertising identifiers, or analytics profiles, and we do not show ads.</p>

      <h2>How we use your information</h2>
      <ul>
        <li>To operate the app: showing nearby games, connecting you with other players, delivering messages and notifications.</li>
        <li>To send account emails, such as password resets.</li>
        <li>To keep the community safe: reviewing reports, and enforcing blocks and account suspensions.</li>
      </ul>
      <p>We do not sell your information or share it with third parties for advertising.</p>

      <h2>Service providers</h2>
      <p>Your data is processed by the following infrastructure providers, solely to run the app:</p>
      <ul>
        <li><strong>DigitalOcean</strong> — application hosting</li>
        <li><strong>MongoDB Atlas</strong> — database hosting</li>
        <li><strong>Cloudinary</strong> — profile picture storage</li>
        <li><strong>SendGrid</strong> — account email delivery</li>
        <li><strong>Expo</strong> — push notification delivery</li>
        <li><strong>Foursquare</strong> — venue search (receives search coordinates, not your identity)</li>
      </ul>

      <h2>Security</h2>
      <p>All traffic between the app and our servers uses HTTPS. Passwords and password-reset tokens are stored hashed. Access to production systems is restricted.</p>

      <h2>Your choices and rights</h2>
      <ul>
        <li><strong>Location and notifications</strong> are optional — you can revoke either at any time in your device settings.</li>
        <li><strong>Blocking and reporting:</strong> you can block other users and report content from within the app.</li>
        <li><strong>Delete your account:</strong> available in the app under Profile. Deleting your account removes your profile, your games and their messages, and your notifications; your messages in other players' games are anonymized. Deletion is immediate and permanent.</li>
      </ul>

      <h2>Children</h2>
      <p>PickUp is not directed at children under 13, and we do not knowingly collect personal information from them. If you believe a child under 13 has created an account, contact us and we will delete it.</p>

      <h2>Changes to this policy</h2>
      <p>If we make material changes, we will update this page and the effective date above.</p>

      <h2>Contact</h2>
      <p>Questions or requests: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>
    </div>
  </body>
</html>`);
});

export default router;
