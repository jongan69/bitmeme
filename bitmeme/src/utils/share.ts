import { Share } from "react-native";
import { notifySuccess, notifyInfo, notifyError } from "./notification";
import { Platform } from "react-native";

// Add this function near handleDownloadMeme
export const handleShareMeme = async (meme: { postUrl: string; caption: string }) => {
    try {
        if (Platform.OS === "web") {
            // Try Web Share API
            if (navigator.share) {
                await navigator.share({
                    title: meme.caption || "BitMeme",
                    url: meme.postUrl,
                });
                notifySuccess("Meme shared!");
            } else if (navigator.clipboard) {
                await navigator.clipboard.writeText(meme.postUrl);
                notifySuccess("Meme URL copied to clipboard!");
            } else {
                notifyInfo("Sharing not supported on this browser.");
            }
        } else {
            // Native: use Share API
            await Share.share({
                url: meme.postUrl,
                message: meme.caption ? meme.caption + "\n" + meme.postUrl : meme.postUrl,
                title: meme.caption || "BitMeme",
            });
        }
    } catch (e: any) {
        notifyError("Failed to share meme: " + (e?.message || e));
    }
};