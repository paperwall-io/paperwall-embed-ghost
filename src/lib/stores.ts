import type { WallState, WallStore } from "paperwall";
import { writable } from "svelte/store";

export default writable({
  entities: {},
  wallState: "@paperwall/loading",
} as {
  entities: WallStore;
  wallState: WallState;
});
