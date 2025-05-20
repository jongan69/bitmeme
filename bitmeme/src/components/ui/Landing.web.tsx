import React from "react";

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
    <div>
      <h1>BitMeme</h1>
      <p>AI-powered meme generator with Bitcoin tipping.</p>
      <button onClick={onGoogleSignIn}>Sign in with Google</button>
      <button onClick={onEmailSignIn}>Sign in with Email</button>
      <div style={{ marginTop: 24 }}>
        <button onClick={onPrivacyPolicy}>Privacy Policy</button>
      </div>
    </div>
  );
}