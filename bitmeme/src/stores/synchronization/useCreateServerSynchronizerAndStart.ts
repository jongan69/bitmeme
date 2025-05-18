import ReconnectingWebSocket from "reconnecting-websocket";
import { createWsSynchronizer } from "tinybase/synchronizers/synchronizer-ws-client/with-schemas";
import * as UiReact from "tinybase/ui-react/with-schemas";
import { MergeableStore, OptionalSchemas } from "tinybase/with-schemas";

const SYNC_SERVER_URL = process.env.EXPO_PUBLIC_SYNC_SERVER_URL;

if (!SYNC_SERVER_URL) {
  throw new Error(
    "Please set EXPO_PUBLIC_SYNC_SERVER_URL in .env to the URL of the sync server"
  );
}

export const useCreateServerSynchronizerAndStart = <
  Schemas extends OptionalSchemas
>(
  storeId: string,
  store: MergeableStore<Schemas>
) =>
  (UiReact as UiReact.WithSchemas<Schemas>).useCreateSynchronizer(
    store,
    async (store: MergeableStore<Schemas>) => {
      // Create the synchronizer.
      const synchronizer = await createWsSynchronizer(
        store,
        new ReconnectingWebSocket(SYNC_SERVER_URL + storeId, [], {
          maxReconnectionDelay: 1000,
          connectionTimeout: 1000,
        })
      );

      // Start the synchronizer.
      await synchronizer.startSync();

      // If the websocket reconnects in the future, do another explicit sync.
      synchronizer.getWebSocket().addEventListener("open", () => {
        synchronizer.load().then(() => synchronizer.save());
      });

      return synchronizer;
    },
    [storeId]
  );