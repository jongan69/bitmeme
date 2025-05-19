"use dom";
import React from "react";
import AnimatedBackground from "@/components/ui/web/AnimatedBackground";
import styles from "@/components/ui/Landing/Landing.module.css";

type LandingProps = {
  onGoogleSignIn: () => void;
  onEmailSignIn: () => void;
  onPrivacyPolicy: () => void;
};

export default function Landing({
  onGoogleSignIn,
  onEmailSignIn,
  onPrivacyPolicy,
}: LandingProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        {/* <img
          src={`${process.env.EXPO_BASE_URL}${window.matchMedia("(prefers-color-scheme: dark)").matches
              ? "/icon-dark.png"
              : "/icon.png"
            }`}
          alt="App Icon"
          width={40}
          height={40}
          className={styles.headerLogo}
        /> */}
      </header>
      <section className={styles.heroSection}>
        <AnimatedBackground />
        <div className={styles.heroContent}>
          <div className={styles.aboutSection}>
            <h1>About BitMeme</h1>
            <h2>📱 BitMeme – AI-Powered Meme Generator with Lightning Tipping</h2>
            <p>
              <b>BitMeme</b> is a mobile app that empowers users to create hilarious, viral-ready memes using AI, and instantly tip their favorite memes with Bitcoin via the Lightning Network. BitMeme combines OpenAI's advanced language generation, the <a href="https://memegen.link">memegen.link</a> API for meme image rendering, and ZBD for seamless Bitcoin micropayments.
            </p>
            <hr />
            <h2>🔥 Key Features</h2>
            <h3>Meme Generator</h3>
            <ul>
              <li><b>Describe Your Meme:</b> Enter a prompt describing your meme idea (e.g., "when your code finally compiles").</li>
              <li><b>AI-Powered Creation:</b> BitMeme uses OpenAI (gpt-4-turbo) to select the best meme template and generate witty captions.</li>
              <li><b>Instant Rendering:</b> Memes are rendered in real-time using <a href="https://api.memegen.link/images">memegen.link</a> and displayed in the app.</li>
            </ul>
            <h3>Meme Feed & Sharing</h3>
            <ul>
              <li><b>View Your Meme:</b> Instantly see your most recently generated meme.</li>
              <li><b>Regenerate:</b> Not satisfied? Tap "Generate Again" to remix your prompt.</li>
              <li><b>Share & Save:</b> Download or share memes directly from the app using your device's sharing options.</li>
            </ul>
            <h3>Bitcoin Lightning Tipping</h3>
            <ul>
              <li><b>Tip Memes You Love:</b> Each meme features a "⚡ Tip Meme" button.</li>
              <li><b>Seamless Payments:</b> Generate a Lightning invoice (100–1000 sats) via ZBD and pay with your favorite wallet (Phoenix, Breez, Wallet of Satoshi, etc.).</li>
              <li><b>Instant Feedback:</b> Get notified when your tip is successful (e.g., "Thanks for tipping 250 sats!").</li>
            </ul>
            <h3>(Optional) Meme History & Profile</h3>
            <ul>
              <li><b>Your Meme Archive:</b> View a history of your generated memes.</li>
              <li><b>Track Tipping:</b> Optionally see how much you've tipped or received (with Supabase integration).</li>
            </ul>
            <hr />
            <h2>🛠️ Tech Stack & Integrations</h2>
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Tool/Service</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>AI caption & template gen</td>
                  <td>OpenAI API (gpt-4-turbo)</td>
                </tr>
                <tr>
                  <td>Meme image rendering</td>
                  <td><a href="https://api.memegen.link">memegen.link</a></td>
                </tr>
                <tr>
                  <td>BTC tipping</td>
                  <td><a href="https://zbd.dev">ZBD API</a></td>
                </tr>
                <tr>
                  <td>Auth / DB (optional)</td>
                  <td>Supabase</td>
                </tr>
                <tr>
                  <td>Mobile frontend</td>
                  <td>React Native (Expo)</td>
                </tr>
              </tbody>
            </table>
            <hr />
            <h2>🧠 How It Works</h2>
            <ol>
              <li>Describe your meme idea.</li>
              <li>AI picks a template and writes captions.</li>
              <li>Meme is rendered and shown in the app.</li>
              <li>Share, download, or tip the meme instantly!</li>
            </ol>
            <hr />
            <h2>✨ Design Philosophy</h2>
            <ul>
              <li>Clean, minimal, meme-first UI</li>
              <li>Emphasis on shareability and social fun</li>
              <li>Fast, delightful feedback on every action</li>
            </ul>
            <hr />
            <p>
              BitMeme makes meme creation fun, social, and rewarding—powered by the latest in AI and Bitcoin Lightning technology.
            </p>
          </div>
          {/* <div className={styles.heroMockup}>
            <img src="/mockup.png" alt="BitMeme app screenshot" />
          </div> */}
        </div>
      </section>

      <div className={styles.heroActions} style={{ marginBottom: '2rem' }}>
        <button
          onClick={onGoogleSignIn}
          className={`${styles.button} ${styles.googleButton}`}
        >
          <img
            src={`${process.env.EXPO_BASE_URL}/google-icon.png`}
            alt="Google Icon"
            width={20}
            height={20}
            className={styles.googleLogo}
          />
          Sign in with Google
        </button>
        <button onClick={onEmailSignIn} className={styles.button}>
          Sign in with Email
        </button>
      </div>

      <section className={styles.featuresSection}>
        <h2 className={styles.featuresTitle}>Features</h2>
        <div className={styles.featuresGrid}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>👨‍👩‍👧‍👦</span>
            <h3>Real-time Collaboration</h3>
            <p>Share lists with family and friends</p>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🔄</span>
            <h3>Offline Support</h3>
            <p>Works even without an internet connection</p>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>📱</span>
            <h3>Cross-Platform</h3>
            <p>Available on iOS, Android, and Web</p>
          </div>
        </div>
      </section>
      <section className={styles.howItWorksSection}>
        <h2 className={styles.howItWorksTitle}>How It Works</h2>
        <div className={styles.howItWorksGrid}>
          <div className={styles.howItWorksStep}>
            <span className={styles.howItWorksIcon}>💡</span>
            <h4>Describe your meme idea</h4>
            <p>Type your meme concept and let AI do the rest.</p>
          </div>
          <div className={styles.howItWorksStep}>
            <span className={styles.howItWorksIcon}>🤖</span>
            <h4>AI picks template & captions</h4>
            <p>OpenAI selects the best meme template and writes captions.</p>
          </div>
          <div className={styles.howItWorksStep}>
            <span className={styles.howItWorksIcon}>⚡</span>
            <h4>Render, share, and tip</h4>
            <p>See your meme, share it, and tip with Bitcoin Lightning!</p>
          </div>
        </div>
      </section>
      <section className={styles.socialProofSection}>
        {/* <div className={styles.appBadges}>
          <a href="#"><img src="/appstore-badge.svg" alt="Download on the App Store" /></a>
          <a href="#"><img src="/playstore-badge.svg" alt="Get it on Google Play" /></a>
        </div> */}
        <blockquote className={styles.testimonial}>
          <p>“BitMeme made meme creation and tipping so easy and fun. Love it!”</p>
          <footer>— Your mom</footer>
        </blockquote>
      </section>
      <footer className={styles.footer}>
        {/* <div className={styles.socialLinks}>
          <a href="#" aria-label="Twitter"><img src="/twitter.svg" alt="Twitter" /></a>
          <a href="#" aria-label="Discord"><img src="/discord.svg" alt="Discord" /></a>
          <a href="#" aria-label="Email"><img src="/email.svg" alt="Email" /></a>
        </div> */}
        <button onClick={onPrivacyPolicy} className={styles.privacyButton}>
          Privacy Policy
        </button>
        <a href="mailto:support@bitmeme.com" className={styles.contactLink}>Contact</a>
        <p className={styles.copyright}>
          © {new Date().getFullYear()} BitMeme. All rights reserved.
        </p>
      </footer>
    </div>
  );
}