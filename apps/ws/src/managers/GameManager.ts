import { WebSocket } from "ws";
import { Game } from "../classes/Game";
import { User } from "../classes/User";
import { joinGameRequest } from "@repo/common-types";
import prisma from "@repo/db";

class GameManager {
  private games: Game[];
  private users: User[];
  private static instance: GameManager;
  constructor() {
    this.games = [];
    this.users = [];
  }
  public static getInstance() {
    if (!this.instance) {
      this.instance = new GameManager();
    }
    return this.instance;
  }
  addUser(user: User) {
    for (let i = 0; i < this.users.length; i++) {
      if (user.userDetails?.id === this.users[i].userDetails?.id) {
        this.users[i] = {
          ...user,
        };
        this.addHandler(user);
        return;
      }
    }
    this.users.push(user);
    this.addHandler(user);
  }
  removeUser(ws: WebSocket) {
    this.users = this.users.filter((user) => user.ws !== ws);
  }
  async addHandler(user: User) {
    user.ws.on("message", async (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === "JOIN_GAME") {
        const res = await joinGameRequest.safeParseAsync(message);
        if (res.error) {
          throw new Error();
        }
        const gameId = res.data.payload.gameId;
        let game = this.games.find((g) => g.id === gameId);
        const gameInDB = await prisma.game.findFirst({
          where: {
            id: gameId,
          },
        });
        if (!gameInDB) {
          throw new Error();
        }
        if (!game) {
          game = new Game(gameId);
          this.games.push(game);
        }
        game.addUser(user);
      }
    });
  }
}

export const gameManager = GameManager.getInstance();
