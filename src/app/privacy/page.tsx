import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Snap Mandarin',
  description: 'How Snap Mandarin collects, uses, and protects your data.',
};

// Static privacy policy served at /privacy. Linked from the App Store / Play
// Store listings and from inside the app. Plain, self-contained styling so it
// renders correctly regardless of the app theme.
const EFFECTIVE_DATE = 'June 15, 2026';
const CONTACT_EMAIL = 'lqtrung.dev@gmail.com';

export default function PrivacyPolicyPage() {
  return (
    <>
      <style>{`
        :root { color-scheme: light dark; }
        body {
          margin: 0;
          background: #ffffff;
          color: #1a1a1a;
        }
        @media (prefers-color-scheme: dark) {
          body {
            background: #111318;
            color: #e0e2e8;
          }
          .muted { color: #8a9490 !important; }
          a { color: #76ffbb; }
        }
      `}</style>
      <main
        style={{
          maxWidth: 760,
          margin: '0 auto',
          padding: '48px 24px 96px',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          lineHeight: 1.65,
          minHeight: '100vh',
        }}
      >
      <h1 style={{ fontSize: 32, marginBottom: 4 }}>Privacy Policy</h1>
      <p className="muted" style={{ color: '#666', marginTop: 0 }}>Last updated: {EFFECTIVE_DATE}</p>

      <p>
        Snap Mandarin (&quot;the app&quot;, &quot;we&quot;, &quot;us&quot;) helps you learn Chinese vocabulary
        by analyzing photos you take. This policy explains what we collect, why, and the
        choices you have. By using the app you agree to this policy.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account information.</strong> Your email address and, optionally, a display
          name and avatar image, used to create and manage your account.
        </li>
        <li>
          <strong>Photos you submit.</strong> When you analyze a photo, the image is sent to
          our AI processing providers to detect objects and generate vocabulary. Photos used
          for analysis are processed transiently and are not stored long-term unless you
          explicitly save the resulting analysis or story to your account.
        </li>
        <li>
          <strong>Learning data.</strong> Vocabulary you save, lists, courses you subscribe to,
          practice sessions, quiz attempts, streaks, and study statistics.
        </li>
        <li>
          <strong>Usage and device data.</strong> Basic technical data needed to operate the
          service (e.g. request counts for rate limiting, error logs, and approximate IP for
          abuse prevention).
        </li>
      </ul>

      <h2>How we use your information</h2>
      <ul>
        <li>Provide the core features: photo analysis, vocabulary, practice, and courses.</li>
        <li>Sync your data across devices and keep you signed in.</li>
        <li>Track learning progress, streaks, and send optional study reminders.</li>
        <li>Prevent abuse, enforce usage limits, and control operating costs.</li>
        <li>Diagnose and fix technical problems.</li>
      </ul>
      <p>We do not sell your personal data, and we do not use it for third-party advertising.</p>

      <h2>Third-party services</h2>
      <p>We rely on the following processors to deliver the service:</p>
      <ul>
        <li>
          <strong>Supabase</strong> — authentication, database, and file storage.
        </li>
        <li>
          <strong>OpenRouter</strong> — routes submitted photos and text to AI models
          (such as Meta Llama and DeepSeek) to generate vocabulary, translations, and
          example sentences.
        </li>
        <li>
          <strong>Google Text-to-Speech</strong> — generates audio pronunciation.
        </li>
      </ul>
      <p>
        These providers process data only to perform their function for us and are bound by
        their own privacy and security terms.
      </p>

      <h2>Notifications</h2>
      <p>
        If you enable study reminders, the app schedules local notifications on your device.
        You can turn them off at any time in the app&apos;s settings or your device settings.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your account and learning data until you delete it or your account. Photos
        submitted for analysis are not retained after processing unless you save them.
      </p>

      <h2>Your rights and choices</h2>
      <ul>
        <li>
          <strong>Access &amp; export.</strong> You can export all of your data from within the
          app (Profile → Export Data).
        </li>
        <li>
          <strong>Deletion.</strong> You can permanently delete your account and all associated
          data from within the app (Profile → Delete Account &amp; Data). This cannot be undone.
        </li>
        <li>
          <strong>Notifications.</strong> Opt out of reminders at any time.
        </li>
      </ul>

      <h2>Children&apos;s privacy</h2>
      <p>
        The app is not directed to children under 13 (or the minimum age required in your
        country). We do not knowingly collect data from children. If you believe a child has
        provided us data, contact us and we will delete it.
      </p>

      <h2>Security</h2>
      <p>
        We use industry-standard measures including encrypted transport (HTTPS) and
        row-level access controls so that you can only access your own data. No method of
        transmission or storage is completely secure, but we work to protect your information.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We may update this policy from time to time. Material changes will be reflected by the
        &quot;Last updated&quot; date above.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or your data? Email{' '}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      </main>
    </>
  );
}
