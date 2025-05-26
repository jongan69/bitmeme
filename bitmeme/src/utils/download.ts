import { notifySuccess, notifyError } from "./notification";
import { Platform } from "react-native";
import * as MediaLibrary from "expo-media-library";
import * as FileSystem from "expo-file-system";


  // --- Download logic ---
  export const handleDownloadMeme = async (meme: { postUrl: string; caption: string }) => {
    try {
      if (Platform.OS === "web") {
        // Web: use anchor tag
        const link = document.createElement("a");
        link.href = meme.postUrl;
        link.download = meme.caption ? meme.caption.replace(/\s+/g, "_") + ".png" : "meme.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        notifySuccess("Meme download started!");
      } else {
        // Native: save to camera roll
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== "granted") {
          notifyError("Permission to access media library is required!");
          return;
        }
        const filename = meme.caption ? meme.caption.replace(/\s+/g, "_") + ".png" : "meme.png";
        const downloadResumable = FileSystem.createDownloadResumable(
          meme.postUrl,
          (FileSystem.documentDirectory || "") + filename
        );
        const result = await downloadResumable.downloadAsync();
        if (result && result.uri) {
          await MediaLibrary.saveToLibraryAsync(result.uri);
          notifySuccess("Meme saved to your camera roll!");
        } else {
          notifyError("Failed to download meme: No file URI returned.");
        }
      }
    } catch (e: any) {
      notifyError("Failed to download meme: " + (e?.message || e));
    }
  };