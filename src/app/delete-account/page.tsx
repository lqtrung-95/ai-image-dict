import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Delete Account — Snap Mandarin',
  description: 'How to request deletion of your Snap Mandarin account and data.',
};

const CONTACT_EMAIL = 'lqtrung.dev@gmail.com';

export default function DeleteAccountPage() {
  return (
    <>
      <style>{`
        :root { color-scheme: light dark; }
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #fff;
          color: #1a1a1a;
        }
        @media (prefers-color-scheme: dark) {
          body { background: #131313; color: #f0f0f0; }
          a { color: #76ffbb; }
          .card { background: #1e1e1e; border-color: #2a2a2a; }
          .step { background: #76ffbb22; border-color: #76ffbb44; }
          .step-num { background: #76ffbb; color: #131313; }
          .warning { background: #ff444422; border-color: #ff444444; }
        }
        .container { max-width: 640px; margin: 0 auto; padding: 48px 24px; }
        h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
        .subtitle { color: #666; margin-bottom: 40px; font-size: 15px; }
        @media (prefers-color-scheme: dark) { .subtitle { color: #999; } }
        .card {
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 24px;
        }
        h2 { font-size: 18px; font-weight: 600; margin: 0 0 16px; }
        p { line-height: 1.6; margin: 0 0 12px; }
        .step {
          background: #76ffbb11;
          border: 1px solid #76ffbb33;
          border-radius: 10px;
          padding: 16px 20px;
          margin-bottom: 12px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .step-num {
          background: #22c47a;
          color: #fff;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .step-text { font-size: 15px; line-height: 1.5; }
        .step-text strong { display: block; margin-bottom: 2px; }
        a { color: #22c47a; }
        .warning {
          background: #ff990011;
          border: 1px solid #ff990033;
          border-radius: 10px;
          padding: 14px 18px;
          font-size: 14px;
          line-height: 1.5;
          margin-top: 16px;
        }
        ul { padding-left: 20px; margin: 8px 0 0; }
        li { margin-bottom: 4px; line-height: 1.5; }
        .email-btn {
          display: inline-block;
          margin-top: 16px;
          background: #22c47a;
          color: #fff;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
        }
      `}</style>
      <div className="container">
        <h1>Delete Your Account</h1>
        <p className="subtitle">
          You can request deletion of your Snap Mandarin account and all associated data at any time.
        </p>

        <div className="card">
          <h2>How to request account deletion</h2>
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-text">
              <strong>Send an email to our support address</strong>
              Use the subject line: <em>Account Deletion Request</em>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-text">
              <strong>Include your registered email address</strong>
              This helps us locate and verify your account.
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-text">
              <strong>We will process your request within 7 days</strong>
              You will receive a confirmation email once your account has been deleted.
            </div>
          </div>
          <a className="email-btn" href={`mailto:${CONTACT_EMAIL}?subject=Account%20Deletion%20Request`}>
            Email us to delete account
          </a>
        </div>

        <div className="card">
          <h2>What data will be deleted</h2>
          <p>Upon deletion, we will permanently remove:</p>
          <ul>
            <li>Your account and login credentials</li>
            <li>All vocabulary words and learning history</li>
            <li>Photo analyses and captured images</li>
            <li>Practice session records and XP data</li>
            <li>Any feedback or messages you submitted</li>
          </ul>
          <div className="warning">
            ⚠️ <strong>This action is irreversible.</strong> Once deleted, your data cannot be recovered.
            Leaderboard entries associated with your account will also be removed.
          </div>
        </div>

        <div className="card">
          <h2>Contact</h2>
          <p>
            For any questions about your data or this process, email us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </div>
      </div>
    </>
  );
}
