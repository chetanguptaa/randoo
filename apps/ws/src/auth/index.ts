import { config } from "dotenv";
config();
import jwt from "jsonwebtoken";
import { WebSocket } from "ws";
import { Iuser } from "../types";
import prisma from "@repo/db";

const JWT_SECRET = process.env.JWT_SECRET!;

export type TUserJwtClaims = Iuser;

export const extractAuthUser = async (token: string, ws: WebSocket): Promise<Iuser | null> => {
  if (!token) throw new Error();
  const decoded = jwt.verify(token, JWT_SECRET) as TUserJwtClaims;
  if (decoded.id) {
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
      },
    });
    if (!user) {
      return null; // here if it is guest
    } else {
      return decoded; // here if it is not
    }
  }
  return null; // here if it is guest
};
