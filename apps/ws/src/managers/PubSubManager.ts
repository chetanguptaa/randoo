import { config } from "dotenv";
config();
import { createClient, RedisClientType } from "redis";
import { User } from "../classes/User";

const REDIS_URL = process.env.REDIS_URL!;

export class PubSubManager {
  private static instance: PubSubManager;
  private redisClient: RedisClientType;
  private subscriptions: Map<string, User[]>; // game to users mapping

  private constructor() {
    this.redisClient = createClient({
      url: REDIS_URL,
    });
    this.redisClient.connect();
    this.subscriptions = new Map();
  }

  public static getInstance(): PubSubManager {
    if (!this.instance) {
      this.instance = new PubSubManager();
    }
    return this.instance;
  }

  public async subscribe(user: User, gameId: string) {
    // here the user will subscribe to that game via the ws server, so when we'll get any message in that game room we'll give out to every player in that game
    if (!this.subscriptions.has(gameId)) {
      this.subscriptions.set(gameId, []);
    }
    const subscriptions = this.subscriptions.get(gameId);
    if (!subscriptions || subscriptions.find((u) => u.ws === user.ws)) return;
    subscriptions.push(user);
    if (subscriptions.length === 1) {
      try {
        await this.redisClient.subscribe(`${gameId}`, (message: any) => {
          this.handleMessage(gameId, message);
        });
      } catch (error) {
        console.error("Error subscribing to Redis channel:", error);
      }
    }
  }

  public async unsubscribe(user: User, gameId: string) {
    const subscribers = this.subscriptions.get(gameId);
    if (subscribers) {
      const userInSubscribers = subscribers.find((s) => s.ws === user.ws);
      if (!userInSubscribers) return;
      this.subscriptions.set(
        gameId,
        subscribers.filter((sub) => sub.ws !== user.ws)
      );
      for (let i = 0; i < subscribers.length; i++) {
        if (subscribers[i].ws === user.ws) continue;
        subscribers[i].ws.send(`${user.name} left the game`);
      }
      if (this.subscriptions.get(gameId)?.length === 0) {
        try {
          await this.redisClient.unsubscribe(`${gameId}`);
        } catch (error) {
          console.error("Error unsubscribing from Redis channel:", error);
        }
      }
    }
  }

  private handleMessage(gameId: string, message: string) {
    this.subscriptions.get(gameId)?.forEach((user) => {
      user.ws.send(message.toString());
    });
  }

  public async disconnect() {
    try {
      await this.redisClient.quit();
    } catch (error) {
      console.error("Error disconnecting from Redis:", error);
    }
  }
}

export const pubSubManager = PubSubManager.getInstance();
