# Security Policy

## Supported versions

OpenPOS is developed on a rolling basis. Only the latest commit on `main`
(and the installers/APK published in the newest GitHub Release) receives
security fixes. If you run an older desktop installer or APK, please update
from the [Downloads page](https://open-pos-deploy.vercel.app/unduh) first and
check whether the issue still exists.

## How authentication and sessions work here

This summary helps researchers understand what is intentional behavior and
what is a real finding:

- Short-lived JWT access tokens (about 15 minutes) plus rotating refresh
  tokens (about 7 days). Sessions live per browser tab, not in persistent
  shared storage.
- Email + password login uses an email-OTP second step. Password resets go
  through an email OTP and revoke every existing refresh token.
- Store owners can protect accounts with a 5-digit passcode. Switching to an
  admin account always requires it.
- Auth endpoints are rate limited (login, account switch, and password reset
  all return `429` when abused). Account recovery and OTP responses are
  intentionally generic so they cannot be used to enumerate registered emails.
- Role checks are enforced server side. The frontend hides admin screens, but
  that is only a convenience layer, so bypassing hidden UI alone is not a
  finding unless server data actually leaks.
- API and web responses carry standard hardening headers (`nosniff`,
  `DENY` framing, strict referrer and permissions policies).

Out of scope by design: the offline desktop and Android builds store all data
in device-local storage with no login screen. Anyone with access to the device
can read that local data, so please do not report that as a vulnerability.
Similarly, sideloaded APK updates are manual by design.

The backend API lives in a separate repository. If your finding is clearly
server side, you may still report it here and we will route it to the backend
maintainer.

## Reporting a vulnerability

Please do not open a public issue for suspected vulnerabilities. Use
[private vulnerability reporting](../../security/advisories/new) on this
repository so details stay hidden until a fix ships.

Include:

1. What you tested (URL or app version, account role used)
2. Steps to reproduce, ideally with request/response pairs
3. The impact as you see it (what an attacker gains, and what they need first)
4. Your environment (browser/OS/app build) if it matters

We aim to acknowledge new reports within 7 days. If you have not heard back
after 14 days, a polite follow-up is welcome. We will keep you updated while a
fix is prepared and will credit you in the release notes if you want it.

## Ground rules

- Test only against your own stores and accounts. Never access, modify, or
  delete other users' data.
- No denial-of-service testing, spam, or brute force beyond what is needed to
  demonstrate rate-limit behavior on your own account.
- Automated scanners are fine against your own local builds, but please keep
  them off the production site.
- Credentials, tokens, or personal data must never be committed to any public
  repository, including proof-of-concept code. If you spot a leaked secret in
  this repo, report it privately and we will rotate it.

Thank you for helping keep small businesses safe.
