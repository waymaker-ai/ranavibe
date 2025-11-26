# Security Policy

## Reporting a Vulnerability

The RANA team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:
**security@waymaker.ai**

Include the following information:
- Type of vulnerability
- Step-by-step instructions to reproduce
- Potential impact
- Suggested fix (if any)

### What to Expect

- **Acknowledgment:** Within 24 hours
- **Initial Assessment:** Within 48 hours
- **Updates:** Every 48-72 hours until resolved
- **Resolution:** Target within 7 days for critical issues

### Responsible Disclosure

We ask that you:
- Give us reasonable time to fix the issue before public disclosure
- Make a good faith effort to avoid privacy violations and service disruption
- Don't exploit the vulnerability beyond what's necessary to demonstrate it

### Recognition

Security researchers who responsibly disclose vulnerabilities will be:
- Credited in our security advisories (unless you prefer to remain anonymous)
- Listed in our Hall of Fame (coming soon)
- Eligible for swag and rewards (significant vulnerabilities)

## Security Best Practices for Users

### Environment Variables
- Never commit `.env.local` to version control
- Rotate API keys regularly
- Use different keys for development and production
- Enable key restrictions where possible

### Database Security
- Always use Row Level Security (RLS) policies
- Never expose service keys client-side
- Regularly review access policies
- Use prepared statements (Prisma does this automatically)

### API Security
- Implement rate limiting (RANA includes this)
- Validate all inputs
- Use HTTPS in production
- Enable security headers (RANA configures this)

### Deployment Security
- Use environment-specific configurations
- Enable security features in production
- Regularly update dependencies
- Monitor for suspicious activity

## Security Features in RANA

RANA includes security by default:

- ✅ **Rate Limiting** - Upstash Ratelimit configured
- ✅ **Security Headers** - CSP, HSTS, X-Frame-Options
- ✅ **Input Validation** - Schema validation
- ✅ **SQL Injection Prevention** - Prisma parameterized queries
- ✅ **XSS Prevention** - React's built-in escaping
- ✅ **CSRF Protection** - Same-origin policy
- ✅ **Row Level Security** - Supabase RLS policies

Run security checks:
```bash
npx aads security:check
```

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | ✅ Yes             |
| 1.x.x   | ❌ No              |

## Security Updates

Security updates are released as soon as possible. We recommend:
- Enabling GitHub security alerts
- Regularly running `npm audit`
- Keeping RANA updated: `npx aads upgrade`

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security](https://nextjs.org/docs/pages/building-your-application/configuring/security)

---

**Thank you for helping keep RANA and our users safe! 🔒**
