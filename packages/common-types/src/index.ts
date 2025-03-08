import { createGameRequest, TCreateGameRequest } from "./games/index";
import { signinRequest, signupRequest, TSigninRequest, TSignupRequest } from "./auth/index";

export { signinRequest, signupRequest, createGameRequest };
export type { TSigninRequest, TSignupRequest, TCreateGameRequest };
