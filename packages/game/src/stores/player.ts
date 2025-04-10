import { config } from "@/config.ts";
import type { AuthToken } from "@adventureland/types";
import { jwtDecode } from "jwt-decode";
import { defineStore } from "pinia";

export const usePlayerStore = defineStore("player", {
  state: () => ({
    email: "",
    token: "",
  }),

  actions: {
    async getCharacters() {
      if (!this.verifyToken()) throw new Error("Token not verified");

      try {
        const response = await fetch(
          config.centralServer + "/api/getCharacters",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: this.token }),
          },
        );

        const json = (await response.json()) as {
          error?: string;
          token?: string;
        };

        if (!response.ok) throw new Error(json.error ?? "Unknown error");
      } catch (error) {
        console.error(error);
        throw new Error("Uknown error");
      }
    },
    async login(email: string, password: string) {
      try {
        const response = await fetch(config.centralServer + "/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });
        const json = (await response.json()) as {
          error?: string;
          token?: string;
        };

        if (!response.ok) throw new Error(json.error ?? "Response Not OK");
        if (json.token === undefined)
          throw new Error(
            `Please contact support (${config.email.addressBook.help}) with the error "Login did not return a token".`,
          );

        // Store the token and email
        this.email = email;
        this.token = json.token;
      } catch (error) {
        console.error(error);
        throw new Error("Uknown error (2)");
      }
    },
    verifyToken(): boolean {
      if (!this.token) return false;

      try {
        const payload = jwtDecode<AuthToken>(this.token);
        if (payload.exp > Date.now()) {
          // Token is expired
          console.debug("Removed expired token");
          this.token = "";
          return false;
        }
      } catch {
        // Token is invalid
        console.debug("Removed invalid token");
        this.token = "";
        return false;
      }

      return true;
    },
  },

  persist: true,
});
