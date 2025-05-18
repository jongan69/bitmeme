// bitmeme/src/stores/MemeStore.tsx

import { useCallback } from "react";
import { randomUUID } from "expo-crypto";
import * as UiReact from "tinybase/ui-react/with-schemas";
import { createMergeableStore } from "tinybase/with-schemas";
import { useUserIdAndNickname } from "@/hooks/useNickname";
import { useCreateClientPersisterAndStart } from "@/stores/persistence/useCreateClientPersisterAndStart";
import { useCreateServerSynchronizerAndStart } from "@/stores/synchronization/useCreateServerSynchronizerAndStart";
// import { useValuesCopy } from "@/hooks/useValuesCopy";
import { useValue, useSetValueCallback, useValuesListener } from "tinybase/ui-react";
import { debounce } from "lodash";

const MEME_TABLE_SCHEMA = {
  memes: {
    id: { type: "string" },
    caption: { type: "string" },
    postUrl: { type: "string" },
    createdBy: { type: "string" },
    solanaAddress: { type: "string" },
    bitcoinAddress: { type: "string" },
    createdAt: { type: "string" },
  },
  likes: {
    id: { type: "string" },         // unique like id
    memeId: { type: "string" },     // which meme
    userId: { type: "string" },     // who liked
    createdAt: { type: "string" },
  },
  comments: {
    id: { type: "string" },         // unique comment id
    memeId: { type: "string" },     // which meme
    userId: { type: "string" },     // who commented
    text: { type: "string" },
    createdAt: { type: "string" },
  },
} as const;

const MEME_VALUES_SCHEMA = {
  valuesCopy: { type: "string" },
} as const;

type Schemas = [typeof MEME_TABLE_SCHEMA, typeof MEME_VALUES_SCHEMA];

const {
  useCell,
  useCreateMergeableStore,
  useDelRowCallback,
  useProvideStore,
  useRowCount,
  useSetCellCallback,
  useSortedRowIds,
  useStore,
  useTable,
} = UiReact as UiReact.WithSchemas<Schemas>;

export { useTable };

const STORE_ID = "memeStore";

// Add meme
export const useAddMemeCallback = () => {
  const store = useStore(STORE_ID);
  const [userId] = useUserIdAndNickname();
  return useCallback(
    (meme: {
      caption: string;
      postUrl: string;
      solanaAddress: string;
      bitcoinAddress: string;
      stacksAddress: string;
    }) => {
      if (!store) throw new Error("Store is not initialized");
      const id = randomUUID();
      store.setRow("memes", id, {
        id,
        ...meme,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      });
      return id;
    },
    [store]
  );
};

// List meme IDs
export const useMemeIds = () =>
  useSortedRowIds("memes", "createdAt", true, undefined, undefined, STORE_ID);

// Get meme cell
export const useMemeCell = (memeId: string, cellId: keyof typeof MEME_TABLE_SCHEMA["memes"]) =>
  useCell("memes", memeId, cellId, STORE_ID);

// console.log("Memestore id", STORE_ID);
// MemeStore component
export default function MemeStore() {
  const [userId] = useUserIdAndNickname();
  const [valuesCopy, setValuesCopy] = useValuesCopy();

  const store = useCreateMergeableStore(() =>
    createMergeableStore().setSchema(MEME_TABLE_SCHEMA, MEME_VALUES_SCHEMA)
  );

  // Debounce the setValuesCopy callback
  const debouncedSetValuesCopy = useCallback(
    debounce((values) => {
      setValuesCopy(values);
    }, 300),
    [setValuesCopy]
  );

  // Listen for changes and update the serialized copy
  useValuesListener(
    () => {
      const storeData = {
        tables: {
          memes: store.getTable("memes"),
          likes: store.getTable("likes"),
          comments: store.getTable("comments"),
        },
        values: store.getValues(),
      };
      debouncedSetValuesCopy(JSON.stringify(storeData));
    },
    [debouncedSetValuesCopy],
    false,
    STORE_ID
  );

  useCreateClientPersisterAndStart(STORE_ID, store, valuesCopy);
  useCreateServerSynchronizerAndStart(STORE_ID, store);
  useProvideStore(STORE_ID, store);

  return null;
}

// Add Like
export const useAddLikeCallback = () => {
  const store = useStore(STORE_ID);
  const [userId] = useUserIdAndNickname();
  return useCallback(
    (memeId: string) => {
      if (!store || !userId) throw new Error("Store or userId not initialized");
      // Prevent duplicate likes by same user
      const existing = Object.values(store.getTable("likes")).find(
        (like: any) => like.memeId === memeId && like.userId === userId
      );
      if (existing) return;
      const id = randomUUID();
      store.setRow("likes", id, {
        id,
        memeId,
        userId,
        createdAt: new Date().toISOString(),
      });
    },
    [store, userId]
  );
};

// Remove Like
export const useRemoveLikeCallback = () => {
  const store = useStore(STORE_ID);
  const [userId] = useUserIdAndNickname();
  return useCallback(
    (memeId: string) => {
      if (!store || !userId) throw new Error("Store or userId not initialized");
      const likeId = Object.entries(store.getTable("likes")).find(
        ([, like]: [string, any]) => like.memeId === memeId && like.userId === userId
      )?.[0];
      if (likeId) store.delRow("likes", likeId);
    },
    [store, userId]
  );
};

// Add Comment
export const useAddCommentCallback = () => {
  const store = useStore(STORE_ID);
  const [userId] = useUserIdAndNickname();
  return useCallback(
    (memeId: string, text: string) => {
      if (!store || !userId) throw new Error("Store or userId not initialized");
      const id = randomUUID();
      store.setRow("comments", id, {
        id,
        memeId,
        userId,
        text,
        createdAt: new Date().toISOString(),
      });
    },
    [store, userId]
  );
};

// Get Comments for a Meme
export const useCommentsForMeme = (memeId: string) => {
  const store = useStore(STORE_ID);
  return Object.values(store?.getTable("comments") ?? {}).filter(
    (comment: any) => comment.memeId === memeId
  );
};

// Get Like Count for a Meme
export const useLikeCountForMeme = (memeId: string) => {
  const store = useStore(STORE_ID);
  return Object.values(store?.getTable("likes") ?? {}).filter(
    (like: any) => like.memeId === memeId
  ).length;
};

// Add this hook to get/set the serialized copy in values
export const useValuesCopy = (): [string, (valuesCopy: string) => void] => [
  String(useValue("valuesCopy", STORE_ID) ?? ""),
  useSetValueCallback(
    "valuesCopy",
    (valuesCopy: string) => valuesCopy,
    [],
    STORE_ID
  ),
];