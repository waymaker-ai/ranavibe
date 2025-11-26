# LUKA Cost Calculator

Interactive web app for comparing LLM provider costs across all 9 providers supported by LUKA.

**Created by Waymaker**
- Ashley Kays - ashley@waymaker.cx
- Christian Moore - christian@waymaker.cx

*Made with love to help others face less friction and more success — faster than ever.* ❤️

---

## Features

- ✅ Compare all 9 LLM providers (OpenAI, Anthropic, Google Gemini, xAI, Mistral, Cohere, Together.ai, Groq, Ollama)
- ✅ Real-time cost calculation
- ✅ Visual cost comparison chart
- ✅ Savings calculator (vs. single provider)
- ✅ Multimodal provider highlighting
- ✅ Responsive design
- ✅ Embeddable widget

---

## Quick Deploy

### Deploy to Vercel

```bash
cd templates/cost-calculator
vercel --prod
```

Or click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/waymaker/luka/tree/main/templates/cost-calculator)

### Deploy to Netlify

```bash
cd templates/cost-calculator
netlify deploy --prod --dir=.
```

Or click:

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/waymaker/luka/tree/main/templates/cost-calculator)

### Deploy to GitHub Pages

```bash
# Push to gh-pages branch
git subtree push --prefix templates/cost-calculator origin gh-pages
```

---

## Usage

### Standalone

Open `index.html` in a browser or deploy to any static hosting provider.

### Embed in Your Site

```html
<iframe
  src="https://calculator.luka.dev"
  width="100%"
  height="800px"
  frameborder="0"
  title="LUKA Cost Calculator"
></iframe>
```

### Customize

Edit the `providers` array in `index.html` to update pricing or add new providers:

```javascript
const providers = [
  {
    name: 'GPT-4o',
    provider: 'OpenAI',
    inputCost: 0.005,
    outputCost: 0.015,
    multimodal: true
  },
  // ... add more
];
```

---

## Configuration

### Environment Variables

None required - this is a static site with client-side JavaScript only.

### Customization Options

**Colors (in `<style>` section):**
```css
--primary-color: #667eea;
--secondary-color: #764ba2;
--success-color: #10b981;
--warning-color: #f59e0b;
```

**Default Values (in JavaScript):**
```javascript
// Default calculation values
document.getElementById('requests').value = 10000;
document.getElementById('inputTokens').value = 500;
document.getElementById('outputTokens').value = 300;
```

---

## Analytics Integration

Add analytics tracking:

```html
<!-- Add before </head> -->
<script defer data-domain="calculator.luka.dev" src="https://plausible.io/js/script.js"></script>

<!-- Or Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## SEO Optimization

Already includes:

- ✅ Meta tags (title, description, keywords)
- ✅ Open Graph tags (Facebook, LinkedIn)
- ✅ Twitter Card tags
- ✅ Schema.org markup (SoftwareApplication)
- ✅ Canonical URL
- ✅ Responsive viewport
- ✅ Semantic HTML

---

## Performance

- **Page Size:** ~12 KB (HTML + inline CSS/JS)
- **Dependencies:** Chart.js (CDN)
- **Load Time:** < 1 second
- **Lighthouse Score:** 95+

---

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

---

## License

MIT License - Free to use, modify, and distribute.

---

## Links

- **LUKA Framework:** https://waymaker.cx/luka
- **Documentation:** https://waymaker.cx/luka/docs
- **GitHub:** https://github.com/waymaker/luka
- **Discord:** https://discord.gg/luka

---

## Support

Questions or issues?

- Email: ashley@waymaker.cx or christian@waymaker.cx
- Discord: Join our community
- GitHub Issues: https://github.com/waymaker/luka/issues

---

Made with love by Waymaker ❤️
