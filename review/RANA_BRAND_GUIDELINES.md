# RANA Brand Guidelines
## Visual Identity & Logo Concepts

**Created by Waymaker** (Ashley Kays & Christian Moore)
*Made with love to help you succeed faster ❤️*

---

## 🐟 Brand Story

**RANA** is named after Ashley Kays' son — his nickname means "like a piranha" in their family.

This personal story makes RANA unique among developer frameworks:
- **React** has an atom (abstract)
- **Vue** has a V (generic)
- **Rails** has rails (industrial)
- **RANA** has a cute piranha (emotional, memorable)

**The brand personality:**
- **Fast** (like a piranha, like 5-minute setup)
- **Efficient** (like nature, like 70% cost savings)
- **Powerful** (small but mighty, 9 LLM providers)
- **Friendly** (cute mascot, approachable framework)
- **Trustworthy** (named after family, built with love)

---

## 🎨 Logo Concepts

### Primary Logo: Cute Piranha

**Concept:** A friendly, cartoonish piranha that looks fast and helpful (not scary!)

```
    ____
   /  o \     ← Big friendly eye
  |  ==  |    ← Tiny smile (not scary teeth!)
   \____/
     ||       ← Small fins (fast!)
    /  \
```

**Style:**
- **Rounded edges** (friendly, approachable)
- **Single eye visible** (playful, winking)
- **Small smile** (helpful, not aggressive)
- **Speed lines** (fast, efficient)
- **Gradient colors** (modern, tech)

**Color Palette:**
- **Primary:** Purple gradient (#667eea → #764ba2)
- **Accent:** Teal/cyan (#06b6d4) for water theme
- **Secondary:** Orange (#f59e0b) for energy

**Text Treatment:**
```
🐟 RANA
Rapid AI Native Architecture
```

### Alternate Logo 1: Text + Piranha Icon

```
┌────────────────────────┐
│  RANA 🐟               │  ← Horizontal layout
│  Rapid AI Native Arch. │
└────────────────────────┘
```

### Alternate Logo 2: Circular Badge

```
     ╭─────────╮
    ╱  🐟 RANA  ╲   ← Circle badge style
   │  Rapid AI   │
    ╲  Native    ╱
     ╰─────────╯
```

### Alternate Logo 3: Minimal

```
🐟 rana      ← Lowercase, modern, minimal
```

---

## 🎨 Color Palette

### Primary Colors

#### Purple Gradient (Brand Signature)
```css
--rana-purple-start: #667eea
--rana-purple-end: #764ba2

/* Usage */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

**Why purple?**
- Tech-forward (used by Twitch, Discord)
- Not overused in AI space (OpenAI green, Anthropic orange)
- Contrasts with blue ocean theme

#### Teal/Cyan (Water Theme)
```css
--rana-teal: #06b6d4
--rana-teal-light: #22d3ee
--rana-teal-dark: #0891b2
```

**Why teal?**
- Water theme (piranha habitat)
- Fresh, modern
- Good contrast with purple

### Secondary Colors

#### Orange (Energy/Speed)
```css
--rana-orange: #f59e0b
--rana-orange-light: #fbbf24
--rana-orange-dark: #d97706
```

**Why orange?**
- Energy, speed, efficiency
- Warning color for cost savings
- Complements purple

#### Green (Success)
```css
--rana-green: #10b981
--rana-green-light: #34d399
--rana-green-dark: #059669
```

**Why green?**
- Success, savings, optimization
- Cost reduction messaging
- Universal positive

### Neutral Colors

```css
/* Grays */
--rana-gray-50: #f9fafb
--rana-gray-100: #f3f4f6
--rana-gray-200: #e5e7eb
--rana-gray-300: #d1d5db
--rana-gray-400: #9ca3af
--rana-gray-500: #6b7280
--rana-gray-600: #4b5563
--rana-gray-700: #374151
--rana-gray-800: #1f2937
--rana-gray-900: #111827

/* Pure */
--rana-white: #ffffff
--rana-black: #000000
```

---

## 📐 Logo Usage Guidelines

### Minimum Size
- **Digital:** 120px wide (maintains legibility)
- **Print:** 1 inch wide

### Clear Space
- Minimum clear space = height of piranha icon on all sides
- No text, images, or other elements in clear space

### Backgrounds

**✅ Approved backgrounds:**
- White
- Light gray (#f3f4f6 or lighter)
- Purple gradient
- Teal
- Dark navy (#0f172a)

**❌ Do NOT use on:**
- Busy patterns
- Low-contrast backgrounds
- Competing gradients

### Logo Variations

**Light backgrounds:**
```
🐟 RANA (purple gradient text)
```

**Dark backgrounds:**
```
🐟 RANA (white text)
```

**Small sizes (< 120px):**
```
🐟  (icon only)
```

**Monochrome (when needed):**
```
[P] RANA  (grayscale piranha)
```

---

## 🎭 Mascot: Pira (The RANA Piranha)

**Name:** Pira (short for Piranha, sounds like "peer-uh")

**Personality:**
- **Helpful:** Always ready to optimize your code
- **Fast:** Zips through tasks in seconds
- **Friendly:** Never bites (developers)
- **Smart:** Knows which LLM provider to use
- **Efficient:** Saves you money and time

**Visual Characteristics:**
- **Big friendly eyes** (curious, helpful)
- **Small smile** (approachable, not scary)
- **Purple/teal gradient** (brand colors)
- **Speed lines** (fast, efficient)
- **Rounded edges** (friendly, modern)

**Mascot Uses:**
- Loading animations ("Pira is thinking...")
- Error messages ("Oops! Pira needs help")
- Success messages ("Pira saved you $X!")
- Tutorial guides ("Pira's tips")
- Community avatar

**Expressions:**

```
😊 Happy Pira (default)
🤔 Thinking Pira (loading)
😎 Cool Pira (success)
😅 Oops Pira (error)
🎉 Party Pira (achievement)
💤 Sleeping Pira (cache hit)
⚡ Speed Pira (optimization)
```

---

## ✍️ Typography

### Primary Font: Inter

**Why Inter?**
- Modern, clean, tech-forward
- Excellent legibility at all sizes
- Free, open source
- Variable font (performance)

**Usage:**
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Weights:**
- **Regular (400):** Body text
- **Medium (500):** Subheadings
- **Semi-Bold (600):** Headings
- **Bold (700):** Hero text, CTAs

### Monospace Font: JetBrains Mono

**Why JetBrains Mono?**
- Developer-focused
- Excellent code readability
- Free, open source
- Ligatures for code

**Usage:**
```css
font-family: 'JetBrains Mono', 'Fira Code', monospace;
```

### Font Sizes (Mobile-First)

```css
/* Base */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;
--text-5xl: 48px;
--text-6xl: 60px;
```

---

## 📝 Voice & Tone

### Brand Voice

**RANA speaks like:**
- **A helpful friend** (not a corporate entity)
- **Technical but approachable** (explains complex simply)
- **Excited about possibilities** (not boring/dry)
- **Honest about limitations** (no overpromising)
- **Grateful to community** (acknowledges contributions)

### Tone Guidelines

#### ✅ DO:
- Use contractions ("we'll" not "we will")
- Be conversational ("Hey!" not "Greetings")
- Show personality ("That's awesome!" not "Acknowledged")
- Explain why ("This saves 70% because...")
- Celebrate wins ("You saved $X!")

#### ❌ DON'T:
- Use jargon without explaining
- Be condescending ("Obviously...")
- Overpromise ("Always works perfectly")
- Be negative ("You're doing it wrong")
- Use corporate speak ("Leverage synergies")

### Examples

**❌ Bad:**
"RANA facilitates the integration of multiple LLM providers to optimize cost efficiency."

**✅ Good:**
"RANA connects you to 9 LLM providers and automatically picks the cheapest one. You save 70% on average."

**❌ Bad:**
"An error has occurred in the system. Please retry your request."

**✅ Good:**
"Oops! Something went wrong. Let's try that again. (Error: rate limit)"

---

## 🎯 Key Messages

### Tagline
**Primary:** "Rapid AI Native Architecture"
**Secondary:** "Build production AI apps in 5 minutes, not 5 weeks"
**Casual:** "AI development, made simple"

### Value Props (Pick 3 Max)

**For Developers:**
1. "9 LLM providers, one API"
2. "5-minute setup, zero vendor lock-in"
3. "70% cost savings, automatic"

**For Founders:**
1. "Ship AI features 120x faster"
2. "Save $16K+/year on LLM costs"
3. "Production-ready, not prototype"

**For Enterprises:**
1. "OWASP Top 10 + GDPR built-in"
2. "No vendor lock-in, switch providers instantly"
3. "Reduce AI costs by 70%"

### Elevator Pitch (30 seconds)

> "RANA is the open-source framework that connects you to 9 LLM providers through one simple API. You get 70% cost savings through automatic caching and smart routing, enterprise security out of the box, and you're never locked into one vendor. It's like Rails for AI development — production-ready in 5 minutes, not 5 weeks. Named after my son, built with love, free forever."

### One-Liner

> "RANA: 9 LLM providers, one API, 70% cost savings, zero vendor lock-in."

---

## 🖼️ Visual Style

### Photography Style

**Do:**
- ✅ Light, bright, airy
- ✅ Real people (not stock photos)
- ✅ Authentic work environments
- ✅ Developer-focused imagery
- ✅ Diversity and inclusion

**Don't:**
- ❌ Dark, moody photos
- ❌ Posed corporate headshots
- ❌ Generic stock imagery
- ❌ Overly polished/fake

### Illustration Style

**Primary Style: Friendly Flat**
- Simple shapes
- Rounded corners
- Gradient fills (brand colors)
- Minimal detail
- Playful but professional

**Examples:**
- Cute piranha mascot
- Icon sets (LLM providers, features)
- Diagrams (architecture, flow)
- Infographics (cost savings, benchmarks)

### UI Components

**Design Principles:**
- **Clarity first** (function over form)
- **Generous spacing** (breathing room)
- **Clear hierarchy** (easy scanning)
- **Accessible contrast** (WCAG AA minimum)
- **Mobile-first** (responsive always)

**Component Style:**
```css
/* Cards */
border-radius: 8px;
box-shadow: 0 2px 8px rgba(0,0,0,0.05);

/* Buttons */
border-radius: 6px;
padding: 12px 24px;

/* Inputs */
border-radius: 6px;
border: 1px solid var(--rana-gray-300);
```

---

## 📱 Social Media Guidelines

### Profile Images
- Use piranha icon (circular crop)
- Purple gradient background
- Consistent across all platforms

### Cover Images
- RANA logo + tagline
- Purple gradient background
- Key stats (9 providers, 70% savings)

### Post Style

**Twitter/X (@rana_dev):**
- Short, punchy
- Code snippets
- Emoji-friendly 🐟
- Thread for tutorials
- Retweet community wins

**LinkedIn:**
- Professional but friendly
- Case studies
- Technical deep-dives
- Company/founder stories
- Industry trends

**Dev.to / Hashnode:**
- Long-form tutorials
- Technical guides
- Architecture explanations
- Migration guides
- Best practices

**YouTube:**
- Tutorial videos
- Live coding
- Conference talks
- Community spotlights

### Hashtags
**Primary:** #RANA #RANADev
**Category:** #AI #LLM #OpenSource #DevTools
**Specific:** #CostOptimization #NoVendorLockIn

---

## 🎁 Swag & Merch

**Official RANA Swag:**

### T-Shirts
- Front: Cute piranha + "RANA"
- Back: "9 LLM Providers, One API"
- Colors: Purple, teal, navy, black

### Stickers
- Piranha mascot (various expressions)
- "Powered by RANA" badge
- "No Vendor Lock-In" shield
- "70% Cost Savings" badge

### Laptop Stickers
- Die-cut piranha shape
- Holographic purple gradient
- 3" x 2.5" size

### Water Bottles
- Purple gradient
- Piranha icon
- "RANA - Rapid AI Native Architecture"

### Hoodies
- Minimal front logo
- Large back graphic (piranha + tagline)
- Purple, navy, black

**Swag Strategy:**
- Give at conferences (hackathons, tech events)
- Send to contributors (GitHub, docs, tutorials)
- Sell at cost on Shopify (no profit, brand awareness)
- Include in enterprise packages

---

## 📊 Brand Assets Checklist

### Logo Files (To Create)
- [ ] SVG (vector, scalable)
- [ ] PNG (transparent, 1000px, 500px, 250px)
- [ ] PNG (white background, for email)
- [ ] ICO (favicon, 32x32)
- [ ] Apple Touch Icon (180x180)

### Mascot Files (To Create)
- [ ] Pira mascot (various expressions)
- [ ] Animated Pira (Lottie/JSON)
- [ ] Pira icon set (16x16, 32x32, 64x64)

### Templates (To Create)
- [ ] Social media templates (Twitter, LinkedIn)
- [ ] Presentation template (Google Slides, PowerPoint)
- [ ] One-pager template (sales, marketing)
- [ ] Pitch deck template

### Marketing Materials (To Create)
- [ ] Brand guidelines PDF (this document)
- [ ] Logo usage guide
- [ ] Color palette swatches (Figma, Sketch, Adobe)
- [ ] Typography specimens

---

## 🚀 Launch Checklist

### Pre-Launch (2 weeks before)
- [ ] Finalize logo design (hire designer or use Fiverr)
- [ ] Create mascot (Pira) design
- [ ] Generate all logo file formats
- [ ] Update all social media profiles
- [ ] Print stickers (1,000 count)
- [ ] Order t-shirts (50 count)

### Launch Week
- [ ] Update GitHub org logo
- [ ] Update website favicon
- [ ] Update all documentation headers
- [ ] Launch swag store (Shopify/Gumroad)
- [ ] Announce rebrand on social media

### Post-Launch (1 month)
- [ ] Send stickers to contributors
- [ ] Create animated mascot (for loading states)
- [ ] Design conference booth materials
- [ ] Create pitch deck template

---

## 📞 Brand Assets Contact

**Need official logo files?**
Email: ashley@waymaker.cx or christian@waymaker.cx

**Want to use RANA logo?**
✅ Approved: Blog posts, tutorials, presentations about RANA
✅ Approved: "Powered by RANA" badges on your site
❌ Not approved: Implying endorsement without permission
❌ Not approved: Modifying logo without permission

**Trademark Info:**
- "RANA" is a trademark of Waymaker
- Piranha mascot is copyrighted by Waymaker
- Logo usage requires attribution
- Commercial use permitted with credit

---

## 🎨 Design Resources

### Logo Design Tools (If DIY)
- **Figma** (free, collaborative)
- **Canva** (easy templates)
- **Adobe Illustrator** (professional)

### Mascot Design Services
- **Fiverr** ($50-$200, fast turnaround)
- **99designs** ($500-$2K, design contest)
- **Toptal** ($2K-$10K, professional illustrator)

### Animation Tools (For Pira)
- **LottieFiles** (web animations)
- **Rive** (interactive animations)
- **After Effects** (professional)

### Recommended Designers
- **Mascot:** Fiverr "mascot design" (search top-rated)
- **Logo:** Dribbble freelancers
- **Animation:** LottieFiles marketplace

---

## 💡 Pro Tips

### 1. **Consistency is Key**
Use the exact same purple gradient everywhere:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### 2. **The Piranha is Friendly**
Always show Pira as helpful, never aggressive. This is critical for approachability.

### 3. **Personal Story Wins**
Always mention "named after my son" in interviews, talks, blogs. This makes RANA memorable and human.

### 4. **Show, Don't Tell**
Use Pira mascot in error messages, loading states, success messages. Make the brand interactive.

### 5. **Community First**
Feature community contributions prominently. Make contributors feel like part of the RANA family.

---

**This brand makes RANA stand out in a sea of generic dev tools. Use it proudly!** 🐟

---

**Created by Waymaker** (Ashley Kays & Christian Moore)
*Made with love to help you succeed faster ❤️*

🐟 **RANA** - Rapid AI Native Architecture
https://rana.dev
