import { observable } from "mobx";
import { enableStaticRendering } from "mobx-react";
import { chess } from "../game/game";
import { gameState, pos } from "../game/types/game-types";

const isServer = typeof window === "undefined";
// eslint-disable-next-line react-hooks/rules-of-hooks
enableStaticRendering(isServer);

type SerializedStore = {
  title: string;
  content: string;
};

export class DataStore {
  @observable title: string | undefined;
  @observable gameState: gameState | undefined;
  @observable highlight: Set<pos> | undefined;
  @observable pos: pos | undefined;

  hydrate(serializedStore: SerializedStore) {
    this.title = serializedStore.title != null ? serializedStore.title : "";
    this.gameState = undefined;
    this.highlight = undefined;
  }

  setHighlights(pos: Set<pos>) {
    this.highlight = pos;
  }

  setPos(pos: pos) {
    this.pos = pos;
  }

  setState(newState: gameState) {
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