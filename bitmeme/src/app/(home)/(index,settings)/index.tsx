import * as Form from "@/components/ui/Form";
import Stack from "@/components/ui/Stack";
import * as AC from "@bacons/apple-colors";
import React from "react";
import { Image, Text, View, TouchableOpacity, TextInput, ScrollView } from "react-native";
import Animated, {
  interpolate,
  useAnimatedRef,
  useAnimatedStyle,
  useScrollViewOffset,
} from "react-native-reanimated";
import { useTable, useAddLikeCallback, useRemoveLikeCallback, useAddCommentCallback } from "@/stores/Memestore";
import { useUserIdAndNickname } from "@/hooks/useNickname";

export default function Page() {
  const ref = useAnimatedRef();
  const scroll = useScrollViewOffset(ref as any);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scroll.value, [-120, -70], [50, 0], "clamp") },
    ],
  }));

  // Use table-level hooks
  const memes = useTable("memes", "memeStore");
  const likes = useTable("likes", "memeStore");
  const comments = useTable("comments", "memeStore");
  const memeList = Object.values(memes ?? {}) as Array<{
    id: string;
    caption: string;
    postUrl: string;
    createdAt: string;
  }>;
  const [expandedMemeId, setExpandedMemeId] = React.useState<string | null>(null);
  const [commentInputs, setCommentInputs] = React.useState<{ [memeId: string]: string }>({});

  const addLike = useAddLikeCallback();
  const removeLike = useRemoveLikeCallback();
  const addComment = useAddCommentCallback();
  const [userId] = useUserIdAndNickname();

  return (
    // @ts-ignore
    <Form.List ref={ref} navigationTitle="Home" listStyle="grouped" >
      {process.env.EXPO_OS !== "web" && (
        <Stack.Screen
          options={{
            headerLeft: () => (
              <View
                style={{
                  overflow: "hidden",
                  paddingBottom: 10,
                  marginBottom: -10,
                }}
              >
                <Animated.View style={style}>
                  <Text
                    style={{
                      color: AC.label,
                      fontWeight: "bold",
                      fontSize: 20,
                    }}
                  >
                    Memebit
                  </Text>
                </Animated.View>
              </View>
            ),
            headerTitle() {
              return <></>;
            },
          }}
        />
      )}

      <Form.Section
        title="Recent Memes"
        footer={
          <Text>
            {memeList.length > 0 ? `${memeList.length} memes` : "No memes yet"}
          </Text>
        }
      >
        {/* Posted Memes Section */}
        {memeList.length > 0 && (
          <Form.Section>
            <View style={{ backgroundColor: "#f6f6f6", paddingVertical: 8 }}>
              {memeList.map((meme) => {
                const memeLikes = (Object.values(likes ?? {}) as Array<{ memeId: string; userId: string }>).filter((like) => like.memeId === meme.id);
                const memeComments = (Object.values(comments ?? {}) as Array<{ memeId: string; id?: string; text?: string }>).filter((comment) => comment.memeId === meme.id);
                const hasLiked = !!userId && memeLikes.some(like => like.userId === userId);
                const commentText = commentInputs[meme.id] || "";
                return (
                  <View
                    key={meme.id}
                    style={{
                      marginBottom: 24,
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 3,
                      padding: 16,
                    }}
                  >
                    <Image
                      source={{ uri: meme.postUrl }}
                      style={{
                        width: "100%",
                        height: 220,
                        borderRadius: 12,
                        marginBottom: 12,
                        backgroundColor: "#f0f0f0",
                      }}
                      resizeMode="contain"
                    />
                    <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 4 }}>
                      {meme.caption}
                    </Text>
                    <Text style={{ color: "#aaa", fontSize: 12, marginBottom: 8 }}>
                      {meme.createdAt ? new Date(meme.createdAt).toLocaleString() : ""}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                      <TouchableOpacity
                        onPress={() => hasLiked ? removeLike(meme.id) : addLike(meme.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginRight: 16,
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          backgroundColor: hasLiked ? "#ffeaea" : "#f5f5f5",
                        }}
                      >
                        <Text style={{ color: hasLiked ? "#e74c3c" : "#888", fontWeight: "bold", marginRight: 4 }}>
                          ❤️
                        </Text>
                        <Text style={{ color: hasLiked ? "#e74c3c" : "#888" }}>
                          {memeLikes.length}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setExpandedMemeId(expandedMemeId === meme.id ? null : meme.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 4,
                          paddingHorizontal: 8,
                          borderRadius: 8,
                          backgroundColor: "#f5f5f5",
                        }}
                      >
                        <Text style={{ color: "#2980b9", fontWeight: "bold", marginRight: 4 }}>
                          💬
                        </Text>
                        <Text style={{ color: "#2980b9" }}>
                          {memeComments.length}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {expandedMemeId === meme.id && (
                      <View style={{
                        marginTop: 8,
                        backgroundColor: "#f9f9f9",
                        borderRadius: 10,
                        padding: 10,
                      }}>
                        <TextInput
                          value={commentText}
                          onChangeText={text => setCommentInputs(inputs => ({ ...inputs, [meme.id]: text }))}
                          placeholder="Add a comment..."
                          style={{
                            borderWidth: 1,
                            borderColor: "#eee",
                            borderRadius: 8,
                            padding: 8,
                            marginBottom: 8,
                            fontSize: 14,
                            backgroundColor: "#fff"
                          }}
                        />
                        <TouchableOpacity
                          onPress={() => {
                            if (commentText.trim()) {
                              addComment(meme.id, commentText.trim());
                              setCommentInputs(inputs => ({ ...inputs, [meme.id]: "" }));
                            }
                          }}
                          style={{
                            backgroundColor: "#2980b9",
                            borderRadius: 8,
                            paddingVertical: 6,
                            paddingHorizontal: 16,
                            alignSelf: "flex-end",
                            marginBottom: 8
                          }}
                        >
                          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "bold" }}>Post</Text>
                        </TouchableOpacity>
                        {memeComments.length > 0 && (
                          <View style={{ marginTop: 4 }}>
                            {memeComments.map((comment, idx) => (
                              <Text key={comment.id || idx} style={{ fontSize: 13, color: '#555', marginBottom: 2 }}>
                                • {comment.text}
                              </Text>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </Form.Section>
        )}
      </Form.Section>
    </Form.List>
  );
}