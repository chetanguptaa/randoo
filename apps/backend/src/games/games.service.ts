import { Injectable } from '@nestjs/common';
import { TCreateGameRequest } from '@repo/common-types/dist';
import prisma from '@repo/db';
import { IUser } from 'src/guard/auth.guard';

@Injectable()
export class GamesService {
  constructor() {}

  async createGame(user: IUser, body: TCreateGameRequest) {
    const gameCode = this.generateRandomCode();
    const game = await prisma.game.create({
      data: {
        title: body.title,
        type: body.type,
        code: gameCode,
        admin: {
          connect: {
            id: user.id,
          },
        },
      },
    });
    return {
      success: true,
      message: 'Game created successfully',
      gameId: game.id,
    };
  }

  private generateRandomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
