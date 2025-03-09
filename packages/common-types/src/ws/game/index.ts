import * as z from "zod";

export const joinGameRequest = z.object({
  type: z.string(),
  payload: z.object({
    gameId: z.string(),
  }),
});

export type TJoinGameRequest = z.infer<typeof joinGameRequest>;
