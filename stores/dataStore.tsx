import { observable } from "mobx";
import { enableStaticRendering } from "mobx-react";
import { chess } from "../game/game";

const isServer = typeof window === "undefined";
// eslint-disable-next-line react-hooks/rules-of-hooks
enableStaticRendering(isServer);

type SerializedStore = {
  title: string;
  content: string;
};

export class DataStore {
  @observable title: string | undefined;
  @observable gameState: chess.gameState | undefined;
  @observable highlight: Set<chess.pos> | undefined;
  @observable pos: chess.pos | undefined;

  hydrate(serializedStore: SerializedStore) {
    this.title = serializedStore.title != null ? serializedStore.title : "";
    this.gameState = undefined;
    this.highlight = undefined;
  }

  setHighlights(pos: Set<chess.pos>) {
    this.highlight = pos;
  }

  setPos(pos: chess.pos) {
    this.pos = pos;
  }

  setState(newState: chess.gameState) {
    this.gameState = newState;
  }

  changeTitle(newTitle: string) {
    this.title = newTitle;
  }
}

export async function fetchInitialStoreState() {
  // You can do anything to fetch initial store state
  return {};
}