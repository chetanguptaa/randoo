import * as z from "zod";

export const signupRequest = z
  .object({
    email: z.string().email(),
    name: z.string().min(4),
    password: z.string().min(8),
  })
  .strict();

export const signinRequest = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
  })
  .strict();

export type TSignupRequest = z.infer<typeof signupRequest>;
export type TSigninRequest = z.infer<typeof signinRequest>;
