[![Athena Award Badge](https://img.shields.io/endpoint?url=https%3A%2F%2Faward.athena.hackclub.com%2Fapi%2Fbadge)](https://award.athena.hackclub.com?utm_source=readme)

# AIbater

I'm 16, and I built this on school nights when I probably should've been studying for exams.

It started with a simple question: *What if AIs could debate each other?* I was bored one evening, scrolling through Google's AI documentation, when I stumbled upon their new Gemini 2.0 Flash model. The idea hit me like lightning - I could make two cosmic entities argue about literally anything, and watch them try to out-logic each other.

The first version was hilariously basic. Just a black screen with text appearing. No animations, no styling, just raw debate output. I showed it to my friends, and they were like "cool concept, but it looks like a terminal from 1995." They weren't wrong.

So I spent the next weekend making it cosmic. Why cosmic? Because debates should feel epic, like forces colliding in space. I added stars, particle effects, glowing text - the whole vibe. I built the particle system using vanilla JavaScript and the Canvas API. Each particle has its own velocity, opacity, and lifecycle. I probably rewrote the CSS animations five times until the particles felt just right. The "cosmic verdict" animation at the end took like 15 attempts to get the timing right.

The backend was a different beast. This was my first real Node.js + Express API. I spent hours debugging CORS errors (if you know, you know), figuring out why my Gemini API calls were timing out, and learning that you really need rate limiting or people will spam your endpoints. I had to structure it properly with middleware for security using Helmet.js, figure out CORS after much pain, handle environment variables (learned the hard way to never commit API keys), and integrate MongoDB for storing debates.

The Gemini API integration was tricky. I had to figure out how to structure prompts so the AI stays on topic, handle API timeouts and retries, manage conversation context across multiple turns, and parse the AI responses reliably when Gemini sometimes returns markdown and sometimes doesn't.

I deployed it on Render's free tier at 11pm on a Sunday. Frontend went to Vercel - one click, done. Beautiful. Backend was harder. I had to set up health checks properly, configure environment variables, deal with the free tier's cold starts (50 seconds of waiting is character building), and debug why CORS worked locally but not in production (spoiler: I forgot to set ALLOWED_ORIGINS).

My first deployment got hammered by someone running 100 debates in a row. Added rate limiting real quick after that. The server kept crashing after a few hours because I wasn't cleaning up old debate sessions. Learned about garbage collection the hard way. The particle effects looked perfect in Chrome, broke in Safari. Welcome to web development.

Building this taught me more than any tutorial ever could. I learned about WebSockets (then removed them for polling because simpler is better), MongoDB, proper error handling (after my server crashed three times), how to make APIs that don't leak your secrets, API design patterns and REST principles, managing async operations in JavaScript, security best practices, how to debug production issues, and that "working on my machine" means nothing.

Is the code perfect? Definitely not. There are probably bugs I haven't found yet. But it's mine, it works, and that's what matters.

The biggest lesson? Just ship it. The first version was rough, but each iteration made it better. Perfection is the enemy of progress.

So yeah, this is AIbater - born from late-night curiosity, fueled by too much coffee, and polished through countless iterations. Hope you enjoy watching cosmic entities argue as much as I enjoyed building them.

*- Gargi, probably coding at 2am*

---

**Try it:** [https://a-ibater.vercel.app/Debater.html](https://a-ibater.vercel.app/Debater.html)
