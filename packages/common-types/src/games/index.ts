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

export const createQuestionsRequest = z.array(
  z.object({
    title: z.string().min(8),
    options: z.array(z.string()),
    correctAnswerIndex: z.number().optional(),
    metadata: z.any().optional(),
  })
);

export type TCreateGameRequest = z.infer<typeof createGameRequest>;
export type TCreateQuestionsRequest = z.infer<typeof createQuestionsRequest>;
