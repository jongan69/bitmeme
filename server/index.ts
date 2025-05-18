import { createMergeableStore } from "tinybase";
import { createDurableObjectStoragePersister } from "tinybase/persisters/persister-durable-object-storage";
import {
  getWsServerDurableObjectFetch,
  WsServerDurableObject,
} from "tinybase/synchronizers/synchronizer-ws-server-durable-object";

export class BitmemeDurableObjects extends WsServerDurableObject {
  createPersister() {
    return createDurableObjectStoragePersister(
      createMergeableStore(),
      this.ctx.storage
    );
  }
}

export default {
  fetch: getWsServerDurableObjectFetch("BitmemeDurableObjects"),
};