import { defineStore } from "pinia";
import { io, type Socket } from "socket.io-client";

export const useConnectionStore = defineStore("connection", {
  state: () => ({
    serverUrl: null as string | null,
    characterId: null as string | null,
    socket: null as Socket | null,
    eventHandlers: {} as { [T in string]: (() => void)[] },
    isConnected: false,
  }),

  actions: {
    connect(serverUrl: string, token: string, characterId: string): Socket {
      // Disconnect from current server
      if (this.socket) this.socket.disconnect();

      // Set up new server connection (but don't connect yet)
      const socket = io(serverUrl, {
        transports: ["websocket"],
        auth: { token, characterId },
        autoConnect: false,
      });

      // Add listeners
      socket.on("connect", () => {
        this.isConnected = true;
      });
      socket.on("disconnect", () => {
        this.isConnected = false;
      });
      Object.entries(this.eventHandlers).forEach(([event, handlers]) => {
        handlers.forEach((handler) => {
          socket.on(event, handler);
        });
      });

      // Set and return socket
      this.characterId = characterId;
      this.serverUrl = serverUrl;
      this.socket = socket;
      socket.connect();
      return socket;
    },

    disconnect() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
    },

    on(event: string, handler: () => void) {
      // Add to handlers
      if (!this.eventHandlers[event]) this.eventHandlers[event] = [];
      this.eventHandlers[event].push(handler);

      // Apply to socket if connected
      if (this.socket) this.socket.on(event, handler);
    },

    off(event: string, handler: () => void) {
      if (!this.eventHandlers[event]) return; // No handlers for this event

      // Remove from handlers
      this.eventHandlers[event] = this.eventHandlers[event].filter(
        (h) => h !== handler,
      );

      // Remove from socket if connected
      if (this.socket) this.socket.off(event, handler);
    },
  },

  persist: false,
});
