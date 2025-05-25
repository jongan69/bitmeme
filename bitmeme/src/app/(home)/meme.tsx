import * as Form from "@/components/ui/Form";
import Stack from "@/components/ui/Stack";
import TouchableBounce from "@/components/ui/TouchableBounce";
import { useMintNftWithImageUrl } from "@/hooks/useMintNft";
import { useWalletOnboarding } from "@/hooks/useWallets";
import { useAddMemeCallback } from "@/stores/Memestore";
import { InteractionType } from "@/types/api";
import { Chain } from "@/types/network";
import { StacksNetwork } from "@/types/store";
import { notifyError, notifyTx, notifyWarning } from "@/utils/notification";
import Constants from "expo-constants";
import { fetch } from "expo/fetch";
import React, { useState } from "react";
import { ActivityIndicator, Button, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";

const API_URL = process.env.EXPO_PUBLIC_BASE_URL;

const generateAPIUrl = (relativePath: string) => {
  console.log("Constants", Constants.experienceUrl);

  const origin =
    Constants?.experienceUrl?.replace("exp://", "http://") || API_URL;

  if (!origin) {
    throw new Error("No API base URL found");
  }

  const path = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;

  let url;
  if (process.env.NODE_ENV === "development") {
    url = origin.concat(path);
  } else {
    if (!API_URL) {
      throw new Error("API_URL environment variable is not defined");
    }
    url = API_URL.concat(path);
  }
  console.log("[generateAPIUrl] Final URL:", url);
  return url;
};

interface Meme {
  template: string;
  top_text: string;
  bottom_text: string;
}

export default function MemeGenerator() {
  const { solanaAddress, bitcoinAddress, stacksAddress } = useWalletOnboarding();
  const [prompt, setPrompt] = useState("");
  const [memes, setMemes] = useState<Meme[]>([]);
  const [loading, setLoading] = useState(false);
  const [partialJson, setPartialJson] = useState("");
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [caption, setCaption] = useState("");
  const [posting, setPosting] = useState(false);
  const addMeme = useAddMemeCallback();
  const mintNftWithImageUrl = useMintNftWithImageUrl();

  async function handleGenerate() {
    setLoading(true);
    setMemes([]);
    setPartialJson("");
    setSelectedMeme(null);
    setCaption("");

    const apiUrl = generateAPIUrl("/api/ai");
    console.log("[handleGenerate] Using API URL:", apiUrl);
    const response = await fetch(apiUrl, {
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

  const handlePost = async (url: string, caption: string) => {
    setPosting(true);
    console.log("Posting meme: ", url, caption);
    console.log("Solana address: ", solanaAddress);
    console.log("Bitcoin address: ", bitcoinAddress);
    console.log("Stacks address: ", stacksAddress);
    try {
      if(Platform.OS !== "web") {
      const txid = await mintNftWithImageUrl(url);
      console.log("Minted NFT with txid: ", txid);
      notifyTx(true, { chain: Chain.Stacks, type: InteractionType.MintNFT, txId: txid, network: StacksNetwork.Testnet });
      } else {
        notifyWarning("Minting NFT is not supported on web, posting meme.");
      }
      addMeme({
        caption,
        postUrl: url,
        solanaAddress: solanaAddress!,
        bitcoinAddress: bitcoinAddress!,
        stacksAddress: stacksAddress!,
      });
     
      // notifySuccess("Meme minted on STX!\nCaption: " + caption);
      setSelectedMeme(null);
      setCaption("");
    } catch (err) {
      notifyError("Failed to mint NFT: " + (err as Error).message);
    } finally {
      setPosting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          {/* <Form.List navigationTitle="BitMeme Generator" listStyle="auto"> */}
          <Text style={{ fontSize: 20, fontWeight: "bold", margin: 12, textAlign: "center", color: "white" }}>BitMeme Generator</Text>
          {/* <Form.Section title="Describe your meme idea"> */}
          <TextInput
            placeholder="e.g. when your code finally compiles"
            value={prompt}
            onChangeText={setPrompt}
            style={{ marginBottom: 12, padding: 10, borderWidth: 1, borderRadius: 8, color: "white" }}
          />
          <Button
            title={loading ? "Generating..." : "Generate Meme"}
            onPress={handleGenerate}
            disabled={!prompt || loading}
          />
          {/* </Form.Section> */}
          {/* </Form.List> */}
        </View>

        {loading && (
          <View style={{ alignItems: "center", marginVertical: 8 }}>
            <ActivityIndicator size="large" color="#888" />
            <Text style={{ marginTop: 12 }}>Generating memes...</Text>
          </View>
        )}
        {!loading && memes.length > 0 && !selectedMeme && (

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: "20%" }}>
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

        )}
        {!loading && selectedMeme && (
          <View
            style={{ flex: 1, marginBottom: "20%" }}
          >
            <Image
              source={{
                uri: `https://api.memegen.link/images/${selectedMeme.template}/${encodeURIComponent((selectedMeme.top_text || "").replace(/ /g, "_"))}/${encodeURIComponent((selectedMeme.bottom_text || "").replace(/ /g, "_"))}.png`
              }}
              style={{ width: "100%", height: 150, borderRadius: 8, marginBottom: "20%" }}
              resizeMode="contain"
            />
            <TextInput
              placeholder="Add a caption for your meme ..."
              value={caption}
              onChangeText={setCaption}
              style={{ marginBottom: 12,  alignSelf: "center", width: "50%", color: "white" }}
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
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 