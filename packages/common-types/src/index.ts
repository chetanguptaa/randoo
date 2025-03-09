import {
  createGameRequest,
  TCreateGameRequest,
  createQuestionsRequest,
  TCreateQuestionsRequest,
  joinGameRequest,
  TJoinGameRequest,
} from "./games/index";
import { signinRequest, signupRequest, TSigninRequest, TSignupRequest } from "./auth/index";

export { signinRequest, signupRequest, createGameRequest, createQuestionsRequest, joinGameRequest };
export type { TSigninRequest, TSignupRequest, TCreateGameRequest, TCreateQuestionsRequest, TJoinGameRequest };
