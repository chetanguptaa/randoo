import { User } from "./User";

export class Game {
  public id: string;
  private players: User[];
  constructor(id: string) {
    this.id = id;
    this.players = [];
  }
  async addUser(user: User) {
    this.players.push(user);
  }
}
