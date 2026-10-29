// In-memory mailer: records every message instead of sending it, so tests read the code from the "email".
// Same interface as the real mailer passed to createApp({ mailer }).
export function createFakeMailer() {
  const messages = [];
  let sendFailures = 0;
  return {
    messages,
    async sendVerificationCode({ to, code, purpose }) {
      if (sendFailures > 0) {
        sendFailures -= 1;
        throw new Error('SMTP unavailable');
      }
      messages.push({ to, code, purpose });
    },
    // The code in the newest message to `to` (optionally for one purpose). Throws if there is none.
    lastCodeFor(to, purpose) {
      const message = messages.findLast(
        (m) => m.to === to && (purpose === undefined || m.purpose === purpose),
      );
      if (!message)
        throw new Error(`No verification code was sent to ${to}${purpose ? ` for ${purpose}` : ''}`);
      return message.code;
    },
    failNextSends(count) {
      sendFailures = count;
    },
  };
}
