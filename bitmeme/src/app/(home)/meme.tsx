import * as Form from "@/components/ui/Form";
import Stack from "@/components/ui/Stack";
import TouchableBounce from "@/components/ui/TouchableBounce";
import { useWalletOnboarding } from "@/hooks/useWallets";
import { useAddMemeCallback } from "@/stores/Memestore";
import { useUser } from "@clerk/clerk-expo";
import Constants from "expo-constants";
import { fetch } from "expo/fetch";
import React, { useState } from "react";
import { ActivityIndicator, Button, Image, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";


const API_URL = process.env.EXPO_BASE_URL;

const generateAPIUrl = (relativePath: string) => {
  console.log("Constants", Constants.experienceUrl);

  const origin =
    Constants?.experienceUrl?.replace("exp://", "http://") || API_URL;

  if (!origin) {
    throw new Error("No API base URL found");
  }

  const path = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;

  if (process.env.NODE_ENV === "development") {
    return origin.concat(path);
  }

  if (!API_URL) {
    throw new Error("API_URL environment variable is not defined");
  }

  return API_URL.concat(path);
};

interface Meme {
  template: string;
  top_text: string;
  bottom_text: string;
}

export default function MemeGenerator() {
  const { user } = useUser();
  const { solanaAddress, bitcoinAddress } = useWalletOnboarding();
  const [prompt, setPrompt] = useState("");
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(false);
  const [partialJson, setPartialJson] = useState("");
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const addMeme = useAddMemeCallback();

  async function handleGenerate() {
    setLoading(true);
    setMemes([]);
    setPartialJson("");
    setSelectedMeme(null);
    setCaption("");

    const response = await fetch(generateAPIUrl("/api/ai"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: prompt }),
    });

    if (!response.ok) {
      setLoading(false);
      alert("Failed to generate meme");
      return;
    }

    const reader = response.body && response.body.getReader ? response.body.getReader() : null;
    const decoder = new TextDecoder();
    let result = "";

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          result += decoder.decode(value, { stream: true });
        }
      }
      // Log the final accumulated response
      console.log('Final streaming response:', result);

      // Split the response into JSON objects
      const jsonStrings = result
        .split(/}(?={)/g) // split on }{
        .map((s, i, arr) => {
          if (i < arr.length - 1) return s + '}';
          return s;
        });

      let finalMemes: Meme[] = [];
      for (let i = jsonStrings.length - 1; i >= 0; i--) {
        try {
          const obj = JSON.parse(jsonStrings[i]);
          if (Array.isArray(obj.memes) && obj.memes.length > 0) {
            finalMemes = obj.memes.filter(
              (meme: Meme) => meme && meme.template && (meme.top_text || meme.bottom_text)
            );
            break;
          }
        } catch (e) {
          // ignore parse errors
        }
      }
      setMemes(finalMemes);
      setSelectedMeme(null);
      setCaption("");
      console.log('Set memes:', finalMemes);
    } else {
      alert("Failed to parse meme response");
    }
    setLoading(false);
  }

  const handlePost = (url: string, caption: string) => {
    setPosting(true);
    // Add meme to Tinybase store
    addMeme({
      caption,
      postUrl: url,
      solanaAddress: solanaAddress || "",
      bitcoinAddress: bitcoinAddress || "",
    });
    setTimeout(() => {
      alert("Meme posted!\nCaption: " + caption);
      setPosting(false);
      setSelectedMeme(null);
      setCaption("");
    }, 1000);
  };

  return (
    <>
      <Stack.Screen options={{ headerTitle: "BitMeme Generator" }} />
      <Form.List navigationTitle="BitMeme Generator">
        <Form.Section title="Describe your meme idea">
          <TextInput
            placeholder="e.g. when your code finally compiles"
            value={prompt}
            onChangeText={setPrompt}
            style={{ marginBottom: 12, padding: 10, borderWidth: 1, borderRadius: 8 }}
          />
          <Button
            title={loading ? "Generating..." : "Generate Meme"}
            onPress={handleGenerate}
            disabled={!prompt || loading}
          />
        </Form.Section>
        {loading && (
          <View style={{ alignItems: "center", marginVertical: 24 }}>
            <ActivityIndicator size="large" color="#888" />
            <Text style={{ marginTop: 12 }}>Generating memes...</Text>
          </View>
        )}
        {!loading && memes.length > 0 && !selectedMeme && (
          <Form.Section title="Pick a Meme">
            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8 }}>
              {memes.filter((meme) => meme.template && meme.top_text && meme.bottom_text).map((meme, idx) => (
                <TouchableBounce key={idx} onPress={() => setSelectedMeme(meme)}>
                  <Image
                    source={{
                      uri: `https://api.memegen.link/images/${meme.template}/${encodeURIComponent((meme.top_text || "").replace(/ /g, "_"))}/${encodeURIComponent((meme.bottom_text || "").replace(/ /g, "_"))}.png`
                    }}
                    style={{ width: 120, height: 120, borderRadius: 8, marginBottom: 8, borderWidth: 2, borderColor: '#ccc' }}
                    resizeMode="contain"
                  />
                </TouchableBounce>
              ))}
            </View>
          </Form.Section>
        )}
        {!loading && selectedMeme && (
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={80}
          >
            <Form.Section title="Selected Meme">
              <Image
                source={{
                  uri: `https://api.memegen.link/images/${selectedMeme.template}/${encodeURIComponent((selectedMeme.top_text || "").replace(/ /g, "_"))}/${encodeURIComponent((selectedMeme.bottom_text || "").replace(/ /g, "_"))}.png`
                }}
                style={{ width: "100%", height: 350, borderRadius: 8, marginBottom: 12 }}
                resizeMode="contain"
              />
              <TextInput
                placeholder="Add a caption for your meme post..."
                value={caption}
                onChangeText={setCaption}
                style={{ marginBottom: 12, padding: 10, borderWidth: 1, borderRadius: 8 }}
              />
              <Button
                title={posting ? "Posting..." : "Post Meme"}
                onPress={() =>
                  handlePost(
                    `https://api.memegen.link/images/${selectedMeme.template}/${encodeURIComponent((selectedMeme.top_text || "").replace(/ /g, "_"))}/${encodeURIComponent((selectedMeme.bottom_text || "").replace(/ /g, "_"))}.png`,
                    caption
                  )
                }
                disabled={!caption || posting}
              />
              <Button
                title="Back to Results"
                onPress={() => setSelectedMeme(null)}
                color="#888"
              />
            </Form.Section>
          </KeyboardAvoidingView>
        )}
      </Form.List>
    </>
  );
} 