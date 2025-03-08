import * as z from "zod";

enum GameType {
  CLASSIC_MCQ = "CLASSIC_MCQ",
}

export const createGameRequest = z
  .object({
    title: z.string().min(6),
    type: z.enum([GameType.CLASSIC_MCQ]),
  })
  .strict();

export type TCreateGameRequest = z.infer<typeof createGameRequest>;
