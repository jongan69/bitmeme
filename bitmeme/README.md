# BitMeme – AI-Powered Meme Generator with Crypto Tipping

BitMeme is a mobile app that empowers users to create hilarious, viral-ready memes using AI, and instantly tip their favorite memes with Bitcoin. BitMeme combines OpenAI's advanced language generation, the [memegen.link](https://memegen.link) API for meme image rendering, minted as NFTs on STX blockchain and Bitcoin, Solana and STX for micropayments.

---

## 🚀 Planned Features

### Meme Generator
- **Describe Your Meme:** Enter a prompt describing your meme idea (e.g., "when your code finally compiles").
- **AI-Powered Creation:** BitMeme uses OpenAI (gpt-4-turbo) to select the best meme template and generate witty captions.
- **Instant Rendering:** Memes are rendered in real-time using [memegen.link](https://api.memegen.link/images) and minted as STX NFTs and displayed in the app.

### Meme Feed & Sharing
- **View Your Meme:** Instantly see your most recently generated meme.
- **Regenerate:** Not satisfied? Tap "Generate Again" to remix your prompt.

### Bitcoin Tipping
- **Tip Memes You Love:** Each meme features a "❤️" button.
- **Seamless Payments:** Generate and pay with your coin of choice using the in app wallet.
- **Instant Feedback:** Get notified when your tip is successful.
---

## 🛠️ Tech Stack & Integrations

| Task                      | Tool/Service                                   |
|---------------------------|------------------------------------------------|
| AI caption & template gen | OpenAI API (gpt-4-turbo)                       |
| Meme image rendering      | [memegen.link](https://api.memegen.link)       |
| Auth / DB (optional)      | Clerk                                       |
| Mobile frontend           | React Native (Expo)                            |

---

## 🧠 How It Works
1. Describe your meme idea.
2. AI picks a template and writes captions.
3. Meme is rendered and shown in the app.
4. Mint a Meme

---

## ✨ Design Philosophy
- Clean, minimal, meme-first UI
- Emphasis on shareability and social fun
- Fast, delightful feedback on every action

---

BitMeme makes meme creation fun, social, and rewarding—powered by the latest in AI and Bitcoin technology.

---

## Development

This project is built with [Expo](https://expo.dev/) and React Native. For development, clone the repo and install dependencies:

```sh
bun install
bunx expo install
```

---

## License

MIT
