# RANA v2.0 Demo Video Script

Complete script for recording demo video. Follow this for consistent, professional presentation.

---

## 📹 Video Details

**Duration:** 10 minutes
**Format:** Screen recording + voiceover
**Tools:** Loom, QuickTime, or OBS
**Resolution:** 1920x1080 (1080p)
**Audience:** Developers familiar with React/JavaScript

---

## 🎬 Scene 1: Introduction (1 minute)

### Visual
- Open VS Code with RANA logo or README
- Clean desktop, professional terminal theme

### Script
```
Hi, I'm Ashley from Waymaker, and today I'm excited to show you RANA v2.0 -
a new way to build AI applications.

If you've ever built an AI app, you know the pain points:
- Every provider has a different SDK
- Switching providers means rewriting code
- No built-in cost tracking
- Expensive bills with no optimization

RANA solves all of these problems with a unified SDK, React hooks,
and automatic 70% cost reduction.

Let's see how it works.
```

---

## 🎬 Scene 2: Quick Installation (1 minute)

### Visual
- Terminal window
- Show package installation

### Script & Commands
```
First, installation is simple. Just one command:

[Type]
npm install @rana/core @rana/react

[Wait for install to complete]

That's it. No complex setup, no configuration files to edit.
You're ready to start building.
```

---

## 🎬 Scene 3: Simple Chat Example (2 minutes)

### Visual
- Create new file: `simple-chat.ts`
- Type code as you narrate

### Script & Code
```
Let's start with the simplest possible example - making a chat request.

[Type]
import { createRana } from '@rana/core';

const rana = createRana({
  providers: {
    anthropic: process.env.ANTHROPIC_API_KEY
  }
});

// That's the setup. Now let's make a request:

const response = await rana.chat('What is TypeScript?');

console.log(response.content);
console.log(`Cost: $${response.cost.total_cost}`);

[Run the code]
[Show output]

And there you go! One API call, and you get:
- The response from Claude
- Automatic cost tracking
- Full TypeScript support

Notice the cost? It's tracked automatically for every request.
```

---

## 🎬 Scene 4: Provider Switching (1.5 minutes)

### Visual
- Same file, modify code

### Script & Code
```
Now here's where it gets interesting. Let's say you want to compare
different providers. With other SDKs, you'd need different code for each.

With RANA, it's one line:

[Type]
// Try Claude
const claude = await rana.anthropic().chat('Hello!');
console.log(`Claude: ${claude.content.substring(0, 50)}...`);
console.log(`Cost: $${claude.cost.total_cost}`);

// Try GPT-4
const gpt = await rana.openai().chat('Hello!');
console.log(`GPT: ${gpt.content.substring(0, 50)}...`);
console.log(`Cost: $${gpt.cost.total_cost}`);

// Try Gemini
const gemini = await rana.google().chat('Hello!');
console.log(`Gemini: ${gemini.content.substring(0, 50)}...`);
console.log(`Cost: $${gemini.cost.total_cost}`);

[Run the code]
[Show output with costs]

Same code, different providers. No vendor lock-in ever.
And look at the cost differences - Gemini is significantly cheaper
for simple tasks.
```

---

## 🎬 Scene 5: React Hooks (2 minutes)

### Visual
- Create new file: `ChatApp.tsx`
- Type React component

### Script & Code
```
Now let's see the React integration. This is where RANA really shines.

[Type]
import { useRanaChat } from '@rana/react';

function ChatApp() {
  const { chat, response, loading, error, cost } = useRanaChat(rana, {
    provider: 'anthropic',
    optimize: 'cost'
  });

  const [input, setInput] = useState('');

  const handleSend = async () => {
    await chat(input);
    setInput('');
  };

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask anything..."
      />
      <button onClick={handleSend} disabled={loading}>
        {loading ? 'Sending...' : 'Send'}
      </button>

      {response && (
        <div>{response.content}</div>
      )}

      <div className="cost">
        Cost: ${cost.toFixed(4)}
      </div>
    </div>
  );
}

It feels just like useState or any other React hook.
You get loading states, error handling, and cost tracking - all built in.

Notice the "optimize: 'cost'" option? That tells RANA to automatically
choose the cheapest provider for this task.
```

---

## 🎬 Scene 6: Cost Tracking (1.5 minutes)

### Visual
- Terminal window
- Run cost tracking demo

### Script & Code
```
Let's look at the cost tracking. After making several requests,
you can see your spending breakdown:

[Type]
const stats = await rana.cost.stats();

console.log(`Total Spent: $${stats.total_spent.toFixed(2)}`);
console.log(`Total Saved: $${stats.total_saved.toFixed(2)}`);
console.log(`Savings: ${stats.savings_percentage.toFixed(0)}%`);

console.log('\nBreakdown:');
stats.breakdown.forEach(b => {
  console.log(`  ${b.provider}: $${b.total_cost.toFixed(2)} (${b.percentage.toFixed(0)}%)`);
});

[Run the code]
[Show output]

This is real-time cost tracking. No logging into provider dashboards,
no spreadsheets. You know exactly what you're spending.

And that 70% savings? That's automatic - from caching, smart routing,
and prompt optimization.
```

---

## 🎬 Scene 7: CLI Tools (1 minute)

### Visual
- Terminal window
- Run CLI commands

### Script & Commands
```
RANA also includes powerful CLI tools.

[Type]
rana dashboard

[Show cost dashboard]

This is a real-time dashboard showing your spending,
provider breakdown, cache hit rates, and recommendations.

[Exit dashboard]

[Type]
rana analyze

[Show analysis output]

The analyzer gives you AI-powered recommendations to reduce costs.

[Type]
rana optimize

[Show optimization process]

And optimize applies those recommendations automatically.
```

---

## 🎬 Scene 8: Summary & CTA (30 seconds)

### Visual
- Back to README or landing page

### Script
```
So that's RANA v2.0:

✓ One SDK for 9 providers
✓ React hooks for easy integration
✓ 70% automatic cost reduction
✓ Full TypeScript support
✓ Real-time cost tracking
✓ Powerful CLI tools

And it's completely free and open source under the MIT license.

Get started at rana.dev
Or npm install @rana/core

The docs have tons of examples, and we have an active Discord community
if you need help.

Thanks for watching, and happy building!
```

---

## 🎥 Recording Tips

### Before Recording

1. **Clean Your Desktop**
   - Close unnecessary apps
   - Hide desktop icons
   - Clear notifications

2. **Setup Terminal**
   - Use clean theme (recommend: One Dark Pro)
   - Large, readable font (16-18pt)
   - Clear terminal before recording

3. **Prepare Code**
   - Have all code snippets ready
   - Test everything works
   - Use code snippets for faster typing

4. **Test Audio**
   - Use good microphone
   - Quiet room
   - Test levels

### During Recording

1. **Pace Yourself**
   - Speak clearly and not too fast
   - Pause between major points
   - Let code compile/run naturally

2. **Be Authentic**
   - Don't worry about being perfect
   - Show genuine enthusiasm
   - It's okay to have minor stumbles

3. **Show Real Results**
   - Use real API keys (redacted in edit)
   - Show actual responses
   - Don't fake anything

### After Recording

1. **Edit**
   - Remove long pauses
   - Speed up installs/compiles
   - Add captions if possible
   - Blur API keys

2. **Add**
   - Intro card (0:00-0:05)
   - Chapter markers
   - End card with links

3. **Export**
   - 1080p resolution
   - Good compression
   - YouTube-optimized

---

## 📝 YouTube Description Template

```
RANA v2.0: Build AI Apps Like You Build with React

In this video, I show you how to use RANA - a new framework that makes
AI development as easy as React development.

What you'll learn:
✓ Installing and setup (1:00)
✓ Making your first chat request (2:00)
✓ Switching between providers (3:30)
✓ Using React hooks (5:30)
✓ Cost tracking and optimization (7:00)
✓ CLI tools (8:30)

Links:
📚 Docs: https://rana.dev
⭐ GitHub: https://github.com/waymaker/rana
💬 Discord: https://discord.gg/rana
📦 npm: npm install @rana/core @rana/react

Timestamps:
0:00 Introduction
1:00 Installation
2:00 Simple Chat Example
3:30 Provider Switching
5:30 React Hooks
7:00 Cost Tracking
8:30 CLI Tools
9:30 Summary

#ai #react #javascript #typescript #llm #openai #anthropic
```

---

## 🎯 Key Messages to Emphasize

1. **Simplicity** - "One line of code to chat with any provider"
2. **No Lock-in** - "Switch providers without rewriting code"
3. **Cost Savings** - "70% automatic savings"
4. **React-like** - "Feels like useState or React Query"
5. **Free Forever** - "MIT license, no paid tiers"

---

## 📊 Success Metrics for Video

**Good:**
- 100+ views first week
- 50% watch time
- 5+ comments
- 3+ likes per 10 views

**Great:**
- 500+ views first week
- 60% watch time
- 20+ comments
- 50+ likes

**Viral:**
- 1000+ views first week
- 70% watch time
- 50+ comments
- 100+ likes

---

## 🎬 Alternative: 3 Short Videos

Instead of one 10-minute video, create three 3-minute videos:

**Video 1: "RANA in 3 Minutes"**
- What is RANA
- Installation
- Simple example
- Key benefits

**Video 2: "React Hooks Tutorial"**
- useRanaChat
- useRanaStream
- useRanaCost
- Full app example

**Video 3: "70% Cost Savings Explained"**
- How it works
- Real examples
- Before/after comparison
- CLI tools

---

## 📱 Social Media Clips

Create 30-second clips from the full video for:
- Twitter/X
- LinkedIn
- Instagram Reels
- TikTok

**Clip 1: "Provider Switching"** (0:30)
- Show switching between Claude, GPT, Gemini
- Highlight: "No vendor lock-in"

**Clip 2: "React Hook Demo"** (0:30)
- Show useRanaChat hook
- Highlight: "Build like React"

**Clip 3: "Cost Savings"** (0:30)
- Show cost dashboard
- Highlight: "70% automatic savings"

---

**Ready to record! Use this script and you'll have a professional demo video.** 🎬
