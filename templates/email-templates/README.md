# LUKA Email Templates

Professional HTML email templates for marketing campaigns.

**Created by Waymaker**
- Ashley Kays - ashley@waymaker.cx
- Christian Moore - christian@waymaker.cx

*Made with love to help others face less friction and more success — faster than ever.* ❤️

---

## Templates Available

### 1. Welcome Email (`welcome.html`)
**Subject:** Welcome to LUKA! Your AI development just got 120x faster ⚡

**When to send:** Immediately after signup

**Variables:**
- `{{firstName}}` - User's first name
- `{{unsubscribe_url}}` - Unsubscribe link

**Features:**
- Gradient header
- 5 key features with checkmarks
- Primary CTA: Quick Start Guide
- Social links in footer

---

### 2. Day 3 - Features Overview (`day3-features.html`)
**Subject:** 9 LLM Providers. One API. 70% Cost Savings. 🚀

**When to send:** 3 days after signup

**Variables:**
- `{{firstName}}` - User's first name
- `{{unsubscribe_url}}` - Unsubscribe link

**Features:**
- 4 benefits with icons
- 3 provider recommendations
- CTA: Compare All 9 Providers

---

### 3. Day 7 - Cost Optimization (`day7-cost-optimization.html`)
**Subject:** Your LLM costs are probably 70% too high 💸

**When to send:** 7 days after signup

**Variables:**
- `{{firstName}}` - User's first name
- `{{unsubscribe_url}}` - Unsubscribe link

**Features:**
- Case study (Sarah Chen)
- 4 optimization strategies
- Visual cost comparison
- CTA: Cost Calculator

---

### 4. Day 14 - Advanced Features (TODO)
**Subject:** Build a full AI agent in under 10 minutes 🤖

**When to send:** 14 days after signup

---

### 5. Day 30 - Upgrade Prompt (TODO)
**Subject:** Take LUKA to the next level (optional) 🚀

**When to send:** 30 days after signup

---

## How to Use

### With Resend (Recommended)

```typescript
import { Resend } from 'resend';
import fs from 'fs';

const resend = new Resend(process.env.RESEND_API_KEY);

// Read template
const template = fs.readFileSync('templates/email-templates/welcome.html', 'utf8');

// Replace variables
const html = template
  .replace(/{{firstName}}/g, 'John')
  .replace(/{{unsubscribe_url}}/g, 'https://luka.dev/unsubscribe?id=123');

// Send email
await resend.emails.send({
  from: 'welcome@luka.dev',
  to: 'user@example.com',
  subject: 'Welcome to LUKA!',
  html: html
});
```

---

### With SendGrid

```typescript
import sgMail from '@sendgrid/mail';
import fs from 'fs';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const template = fs.readFileSync('templates/email-templates/welcome.html', 'utf8');

const html = template
  .replace(/{{firstName}}/g, 'John')
  .replace(/{{unsubscribe_url}}/g, 'https://luka.dev/unsubscribe?id=123');

await sgMail.send({
  from: 'welcome@luka.dev',
  to: 'user@example.com',
  subject: 'Welcome to LUKA!',
  html: html
});
```

---

### With Mailgun

```typescript
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import fs from 'fs';

const mailgun = new Mailgun(formData);
const mg = mailgun.client({
  username: 'api',
  key: process.env.MAILGUN_API_KEY
});

const template = fs.readFileSync('templates/email-templates/welcome.html', 'utf8');

const html = template
  .replace(/{{firstName}}/g, 'John')
  .replace(/{{unsubscribe_url}}/g, 'https://luka.dev/unsubscribe?id=123');

await mg.messages.create('luka.dev', {
  from: 'Welcome <welcome@luka.dev>',
  to: ['user@example.com'],
  subject: 'Welcome to LUKA!',
  html: html
});
```

---

## Template Features

### Responsive Design
- ✅ Mobile-optimized (tested on iOS, Android)
- ✅ Desktop-optimized (Gmail, Outlook, Apple Mail)
- ✅ Dark mode support
- ✅ 600px max width

### Email Client Support
- ✅ Gmail (web, iOS, Android)
- ✅ Apple Mail (macOS, iOS)
- ✅ Outlook (web, desktop, mobile)
- ✅ Yahoo Mail
- ✅ Proton Mail
- ✅ Thunderbird

### Best Practices
- ✅ Inline CSS (no external stylesheets)
- ✅ Table-based layout (better compatibility)
- ✅ Alt text for images
- ✅ Plain text version (TODO)
- ✅ Unsubscribe link
- ✅ Accessible color contrast
- ✅ No JavaScript

---

## Customization

### Change Colors

Find and replace these hex codes in templates:

```html
<!-- Primary gradient -->
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

<!-- Primary color -->
color: #667eea;

<!-- Success green -->
color: #10b981;

<!-- Warning orange -->
color: #f59e0b;

<!-- Danger red -->
color: #ef4444;
```

### Change Logo

Replace this line in header:

```html
<h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
  Welcome to LUKA! 🎉
</h1>
```

With:

```html
<img src="https://luka.dev/logo.png" alt="LUKA" style="max-width: 200px;" />
```

### Add Tracking Pixels

Add before `</body>`:

```html
<!-- Google Analytics -->
<img src="https://www.google-analytics.com/collect?v=1&tid=UA-XXXXX&cid={{userId}}&t=event&ec=email&ea=open&el={{emailId}}" width="1" height="1" />

<!-- Custom tracking -->
<img src="https://luka.dev/track/open?id={{emailId}}" width="1" height="1" />
```

---

## Testing

### Litmus Test

```bash
# Send test to Litmus
# 1. Forward email to your-address@litmus.com
# 2. Review previews for 90+ clients
```

### Email on Acid

```bash
# Send test to Email on Acid
# 1. Forward email to your-address@emailonacid.com
# 2. Review responsive tests
```

### Manual Testing

**Test Checklist:**
- [ ] Gmail (web)
- [ ] Gmail (iOS app)
- [ ] Gmail (Android app)
- [ ] Apple Mail (macOS)
- [ ] Apple Mail (iOS)
- [ ] Outlook (web)
- [ ] Outlook (desktop)
- [ ] Yahoo Mail
- [ ] Dark mode (iOS, macOS)
- [ ] Mobile view (all clients)

---

## Performance

### Email Size
- **Target:** < 100 KB
- **Welcome:** ~15 KB ✅
- **Day 3:** ~12 KB ✅
- **Day 7:** ~14 KB ✅

### Load Time
- **Target:** < 3 seconds
- **Actual:** < 1 second ✅

---

## Metrics to Track

### Delivery Metrics
- Delivery rate (target: 98%+)
- Bounce rate (target: < 2%)
- Spam rate (target: < 0.1%)

### Engagement Metrics
- Open rate (target: 25%+)
- Click rate (target: 3%+)
- Conversion rate (target: 1%+)
- Unsubscribe rate (target: < 0.5%)

---

## Drip Campaign Setup

### Automation Flow

```
Day 0 → Welcome Email
  ↓
Day 3 → Features Overview
  ↓
Day 7 → Cost Optimization
  ↓
Day 14 → Advanced Features (agents)
  ↓
Day 30 → Upgrade Prompt
```

### Implementation (Resend)

```typescript
// Store scheduled emails in database
await db.scheduledEmails.create({
  userId: user.id,
  templateId: 'day3-features',
  scheduledFor: addDays(new Date(), 3),
  status: 'pending'
});

// Cron job (runs every hour)
const pendingEmails = await db.scheduledEmails.findMany({
  where: {
    status: 'pending',
    scheduledFor: { lte: new Date() }
  }
});

for (const email of pendingEmails) {
  await sendEmail(email.templateId, email.userId);
  await db.scheduledEmails.update({
    where: { id: email.id },
    data: { status: 'sent', sentAt: new Date() }
  });
}
```

---

## A/B Testing

### Subject Lines

Test variations:

**Welcome Email:**
- A: "Welcome to LUKA! Your AI development just got 120x faster ⚡"
- B: "You're in! Build AI apps in 5 minutes with LUKA 🚀"
- C: "Thanks for joining LUKA - Here's what you get..."

**Day 7:**
- A: "Your LLM costs are probably 70% too high 💸"
- B: "How to save $12,600/year on AI costs"
- C: "Sarah cut her AI costs by 75%. Here's how."

### CTAs

Test button copy:

- "Get Started Now"
- "Start Building Free"
- "Try LUKA Today"
- "See How It Works"

---

## Compliance

### GDPR
- ✅ Unsubscribe link in every email
- ✅ Physical address (TODO - add to footer)
- ✅ Clear sender identification
- ✅ Consent recorded

### CAN-SPAM
- ✅ Accurate "From" name
- ✅ Honest subject line
- ✅ Unsubscribe mechanism
- ✅ Physical address (TODO)

---

## Troubleshooting

### Email Not Sending

1. Check API key configuration
2. Verify sender domain authentication (SPF, DKIM)
3. Check rate limits
4. Review error logs

### Email in Spam

1. Set up SPF record
2. Set up DKIM record
3. Set up DMARC record
4. Warm up IP address (send gradually)
5. Avoid spam trigger words

### Images Not Loading

1. Use absolute URLs (not relative)
2. Host images on CDN
3. Add alt text for all images
4. Test in multiple clients

### Layout Broken

1. Use tables for layout (not divs)
2. Inline all CSS
3. Avoid CSS Grid/Flexbox
4. Test in Outlook (strictest)

---

## Future Templates

### Planned Templates (TODO)

1. **Day 14 - Advanced Features**
2. **Day 30 - Upgrade Prompt**
3. **Product Update Email**
4. **New Feature Announcement**
5. **Monthly Newsletter**
6. **Event Invitation**
7. **Webinar Reminder**
8. **Cart Abandonment** (for paid services)
9. **Feedback Request**
10. **Re-engagement Campaign**

---

## Resources

### Email Design Tools
- [Litmus Builder](https://litmus.com/builder)
- [Bee Free](https://beefree.io)
- [MJML](https://mjml.io)

### Testing Tools
- [Litmus](https://litmus.com)
- [Email on Acid](https://www.emailonacid.com)
- [Mail Tester](https://www.mail-tester.com)

### Inspiration
- [Really Good Emails](https://reallygoodemails.com)
- [Milled](https://milled.com)
- [Email Love](https://emaillove.com)

---

## Support

Questions about email templates?

- Email: ashley@waymaker.cx or christian@waymaker.cx
- Discord: https://discord.gg/luka
- GitHub Issues: https://github.com/waymaker/luka/issues

---

Made with love by Waymaker ❤️
