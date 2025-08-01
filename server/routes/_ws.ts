// server/routes/_ws.ts
import { defineWebSocketHandler } from "h3";
import type { WebSocketMessage } from "~/model/ws";

interface Peer {
  gameId: string;
  playerId: string;
  peer: any;
}

const peers = new Map<string, Peer>();

function getPeerId(gameId: string, playerId: string): string {
  return `${gameId}:${playerId}`;
}

export function broadcastToGame(gameId: string, message: WebSocketMessage) {
  const messageStr = JSON.stringify(message);
  console.log(`[ws] Broadcasting to game ${gameId}:`, message.type);

  for (const [peerId, peerInfo] of peers.entries()) {
    if (peerInfo.gameId === gameId) {
      try {
        peerInfo.peer.send(messageStr);
        console.log(`[ws] Sent message to ${peerId}`);
      } catch (err) {
        console.error(`[ws] Failed to broadcast to ${peerId}:`, err);
        peers.delete(peerId);
      }
    }
  }
}

export default defineWebSocketHandler({
  open(peer) {
    console.log("[ws] WebSocket connection opened");
  },

  message(peer, message) {
    try {
      const data = JSON.parse(message.toString());
      console.log("[ws] Received message:", data);

      if (data.type === "join-game" && data.gameId && data.playerId) {
        const peerId = getPeerId(data.gameId, data.playerId);
        peers.set(peerId, {
          gameId: data.gameId,
          playerId: data.playerId,
          peer: peer,
        });
        console.log(`[ws] Player ${data.playerId} joined game ${data.gameId}`);
      }
    } catch (err) {
      console.error("[ws] Error parsing message:", err);
    }
  },

  close(peer) {
    // Find and remove the peer
    for (const [peerId, peerInfo] of peers.entries()) {
      if (peerInfo.peer === peer) {
        console.log(
          `[ws] Player ${peerInfo.playerId} left game ${peerInfo.gameId}`
        );
        peers.delete(peerId);
        break;
      }
    }
  },

  error(peer, error) {
    console.error("[ws] WebSocket error:", error);
  },
});
