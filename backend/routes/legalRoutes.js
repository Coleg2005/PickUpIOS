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

      <p><a href="/terms">Terms of Service</a></p>
    </div>
  </body>
</html>`);
});

// Public terms of service page: https://pickupiosbackend.me/terms
// App Store guideline 1.2 requires UGC apps to publish terms with a
// zero-tolerance policy for objectionable content, which users agree to at
// sign-up (see the register screen).
const TERMS_EFFECTIVE_DATE = 'July 15, 2026';

router.get('/terms', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>PickUp — Terms of Service</title>
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
      <h1>PickUp Terms of Service</h1>
      <div class="date">Effective ${TERMS_EFFECTIVE_DATE}</div>

      <p>These terms govern your use of PickUp, a mobile app for finding and organizing pick-up sports games. By creating an account or using the app, you agree to these terms. If you do not agree, do not use the app.</p>

      <h2>Eligibility and your account</h2>
      <ul>
        <li>You must be at least 13 years old to use PickUp.</li>
        <li>You are responsible for your account and for keeping your password secure. Provide accurate information and do not impersonate anyone.</li>
        <li>One account per person. Do not share, sell, or transfer your account.</li>
      </ul>

      <h2>Community rules — zero tolerance for objectionable content</h2>
      <p>PickUp has a <strong>zero-tolerance policy for objectionable content and abusive behavior</strong>. You may not post, share, or send:</p>
      <ul>
        <li>Harassment, bullying, threats, or hate speech of any kind;</li>
        <li>Sexually explicit, violent, or otherwise objectionable content;</li>
        <li>Spam, scams, or misleading content;</li>
        <li>Content that impersonates another person;</li>
        <li>Other people's personal information without their consent;</li>
        <li>Anything illegal, or that encourages illegal activity.</li>
      </ul>
      <p>Violations may result in content being removed and your account being suspended or permanently banned without notice.</p>

      <h2>Moderation, reporting, and blocking</h2>
      <ul>
        <li>You can <strong>report</strong> any user, game, or message from within the app. We review reports and act on objectionable content, including removing content and ejecting the users responsible.</li>
        <li>You can <strong>block</strong> any user at any time; blocked users cannot invite you to games, and their messages are hidden from you.</li>
        <li>We may remove any content or restrict any account that we believe violates these terms or puts other users at risk.</li>
      </ul>

      <h2>Your content</h2>
      <p>You keep ownership of the content you post (messages, games, profile information, photos). By posting it, you grant us a non-exclusive, royalty-free license to store, display, and transmit that content as needed to operate the app. You are solely responsible for the content you post.</p>

      <h2>Physical activity and meeting other users</h2>
      <p>PickUp helps people organize real-world sports games. <strong>You participate at your own risk.</strong></p>
      <ul>
        <li>Sports involve inherent risk of injury. You are responsible for judging your own fitness to participate and for playing safely.</li>
        <li>We do not vet users, venues, or games, and we are not responsible for the conduct of any user, online or offline. Use common sense and caution when meeting people you met through the app.</li>
        <li>Venue information is provided by third parties and may be inaccurate. Confirm that a venue is open, safe, and permitted for your use.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Do not attempt to disrupt or misuse the service — including probing or breaching security, scraping data, reverse engineering the app, sending automated requests, or interfering with other users' use of the app.</p>

      <h2>Termination</h2>
      <p>You can stop using PickUp at any time and delete your account in the app under Profile. We may suspend or terminate your account if you violate these terms. Sections that by their nature should survive termination (such as disclaimers and limitations of liability) survive.</p>

      <h2>Disclaimers</h2>
      <p>PickUp is provided "as is" and "as available," without warranties of any kind, express or implied. We do not guarantee that the app will be uninterrupted, error-free, or secure, or that any game will take place as listed.</p>

      <h2>Limitation of liability</h2>
      <p>To the maximum extent permitted by law, PickUp and its operator are not liable for any indirect, incidental, special, consequential, or punitive damages, or for any personal injury, property damage, or losses arising from your use of the app, your participation in any game, or your interactions with other users.</p>

      <h2>Changes to these terms</h2>
      <p>We may update these terms from time to time. If we make material changes, we will update this page and the effective date above. Continuing to use the app after changes take effect means you accept the updated terms.</p>

      <h2>Contact</h2>
      <p>Questions about these terms: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>

      <p><a href="/privacy">Privacy Policy</a></p>
    </div>
  </body>
</html>`);
});

export default router;
