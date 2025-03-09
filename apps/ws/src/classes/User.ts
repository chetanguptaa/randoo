import { WebSocket } from "ws";
import { Iuser } from "../types";

export class User {
  public userDetails: Iuser | null;
  public name: string | null;
  public ws: WebSocket;
  constructor(ws: WebSocket, user: Iuser | null, name: string | null) {
    this.userDetails = user;
    this.name = name;
    this.ws = ws;
  }
}
