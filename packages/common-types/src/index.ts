import { createGameRequest, TCreateGameRequest, createQuestionsRequest, TCreateQuestionsRequest } from "./games/index";
import { signinRequest, signupRequest, TSigninRequest, TSignupRequest } from "./auth/index";
import { joinGameRequest, TJoinGameRequest } from "./ws/game";

export { signinRequest, signupRequest, createGameRequest, createQuestionsRequest, joinGameRequest };
export type { TSigninRequest, TSignupRequest, TCreateGameRequest, TCreateQuestionsRequest, TJoinGameRequest };
