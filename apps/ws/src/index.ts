import { WebSocketServer } from "ws";
import url from "url";
import { extractAuthUser } from "./auth";
import { User } from "./classes/User";
import { gameManager } from "./managers/GameManager";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", async function connection(ws, req: Request) {
  try {
    const token: string = url.parse(req.url, true).query.token as string;
    const user = await extractAuthUser(token, ws);
    if (user) {
      const newUser = new User(ws, user, null);
      gameManager.addUser(newUser);
    } else {
      const name: string = url.parse(req.url, true).query.name as string;
      if (!name) throw new Error();
      const newUser = new User(ws, null, name);
      gameManager.addUser(newUser);
    }
    ws.send(
      JSON.stringify({
        success: true,
        message: "Server is ready, please wait while we join you to the game",
      })
    );
    ws.on("close", () => {
      if (user) gameManager.removeUser(ws);
    });
  } catch (error) {
    ws.send(
      JSON.stringify({
        message: "Some error occured, please try again later",
        success: false,
      })
    );
  }
});
