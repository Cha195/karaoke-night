export enum WebSocketMessageType {
  GameStateUpdate = "game-state-update",
  PlayerJoined = "player-joined",
  PlayerLeft = "player-left",
  GameStarted = "game-started",
}

export interface WebSocketMessage {
  type: WebSocketMessageType;
  payload: any;
}
