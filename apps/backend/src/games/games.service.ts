import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  TCreateGameRequest,
  TCreateQuestionsRequest,
} from '@repo/common-types/dist';
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
      gameCode,
      gameId: game.id,
    };
  }

  async createQuestions(
    user: IUser,
    gameId: string,
    body: TCreateQuestionsRequest,
  ) {
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
      },
    });
    if (!game || game.adminId !== user.id) {
      throw new UnauthorizedException();
    }
    if (game.type === 'CLASSIC_MCQ') {
      await prisma.question.createMany({
        data: body.map((q) => {
          return {
            gameId: game.id,
            title: q.title,
            options: q.options,
            correctAnswerIndex: q.correctAnswerIndex,
            metadata: q.metadata,
          };
        }),
      });
    }
    return {
      success: true,
      message: 'Questions added successfully',
    };
  }

  async getAllQuestions(user: IUser, gameId: string) {
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        adminId: user.id,
      },
    });
    if (!game) {
      throw new BadRequestException();
    }
    const questions = await prisma.question.findMany({
      where: {
        gameId,
      },
    });
    if (game.type === 'CLASSIC_MCQ') {
      return questions.map((q) => {
        return {
          title: q.title,
          options: q.options as string[],
        };
      });
    }
  }

  async startGame(user: IUser, gameId: string) {
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        adminId: user.id,
      },
    });
    if (!game) {
      throw new BadRequestException();
    }
    if (game.status === 'ACTIVE') {
      throw new BadRequestException('Game has already started');
    }
    if (game.status === 'COMPLETED') {
      throw new BadRequestException('Game has already completed');
    }
    await prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        status: 'ACTIVE',
      },
    });
    return {
      success: true,
      message: 'Game started successfully',
    };
  }

  // TODO -> later we'll do timelimit in games
  async stopGame(user: IUser, gameId: string) {
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
        adminId: user.id,
      },
    });
    if (!game) {
      throw new BadRequestException();
    }
    if (game.status === 'COMPLETED') {
      throw new BadRequestException('Game has already completed');
    }
    if (game.status === 'WAITING') {
      throw new BadRequestException('Game has not started yet');
    }
    await prisma.game.update({
      where: {
        id: gameId,
      },
      data: {
        status: 'COMPLETED',
      },
    });
    return {
      success: true,
      message: 'Game has been stopped',
    };
  }

  private generateRandomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
