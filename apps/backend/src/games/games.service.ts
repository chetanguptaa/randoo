import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  TCreateGameRequest,
  TCreateQuestionsRequest,
} from '@repo/common-types/dist';
import prisma from '@repo/db';
import { randomUUID } from 'crypto';
import { Request, Response } from 'express';
import Redis from 'ioredis';
import { IUser } from 'src/guard/auth.guard';

@Injectable()
export class GamesService {
  private redisSubscriber: Redis;
  private redisPublisher: Redis;
  constructor() {
    this.redisSubscriber = new Redis({
      host: 'localhost',
      port: 6379,
    });
    this.redisPublisher = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }
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
    let countDown = 5;
    const intervalId = setInterval(async () => {
      if (countDown === 0) {
        clearInterval(intervalId);
        await prisma.game.update({
          where: { id: gameId },
          data: { status: 'ACTIVE' },
        });
        this.redisPublisher.publish(
          'game-countdown',
          JSON.stringify({
            gameId,
            status: 1, // here 0 means not started, 1 means started, and 2 means close the connection
          }),
        );
        return;
      }
      this.redisPublisher.publish(
        'game-countdown',
        JSON.stringify({
          gameId,
          countDown,
          status: 0,
        }),
      );
      countDown--;
    }, 1000);
    return {
      success: true,
      countDown: 5,
      status: 0,
    };
  }

  async sse(
    gameId: string,
    req: Request,
    res: Response,
    sendEvent: (data: any) => void,
  ): Promise<void> {
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
      },
    });
    if (!game || game.status === 'COMPLETED' || game.status === 'ACTIVE') {
      sendEvent({ status: 2 });
    }
    this.redisSubscriber.subscribe('game-countdown');
    this.redisSubscriber.on('message', (channel, message) => {
      if (channel === 'game-countdown') {
        const parsedMessage = JSON.parse(message) as {
          gameId: string;
          countDown?: number;
          status: 0 | 1 | 2;
        };
        if (parsedMessage.gameId === gameId) {
          sendEvent(parsedMessage);
        }
      }
    });
    req.on('close', () => {
      res.end();
    });
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

  async getAllPlayers(gameId: string) {
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
      },
    });
    if (!game) {
      throw new NotFoundException('Game does not exist');
    }
    return game.players;
  }

  async joinGame(gameId: string, user: IUser | null, name: string | null) {
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
      },
    });
    if (!game) throw new NotFoundException('Game does not exist');
    if (game.status === 'ACTIVE') {
      throw new BadRequestException('Game has already started');
    }
    if (game.status === 'COMPLETED') {
      throw new BadRequestException('Game has already ended');
    }
    if (user) {
      await prisma.game.update({
        where: {
          id: gameId,
        },
        data: {
          players: {
            push: {
              ...user,
            },
          },
        },
      });
    }
    if (name) {
      const id = randomUUID();
      await prisma.game.update({
        where: {
          id: gameId,
        },
        data: {
          players: {
            push: {
              id,
              name,
            },
          },
        },
      });
      return {
        id,
        success: true,
        message: 'Joined the game successfully',
      };
    }
    return {
      success: true,
      message: 'Joined the game successfully',
    };
  }

  async getGame(code?: string) {
    if (code) {
      return await prisma.game.findFirst({
        where: {
          code,
        },
        select: {
          players: true,
          createdAt: true,
          status: true,
        },
      });
    }
  }

  async deleteAQuestion(user: IUser, gameId: string, questionId: string) {
    const game = await prisma.game.findFirst({
      where: {
        id: gameId,
      },
    });
    if (!game) {
      throw new NotFoundException('Game does not exist');
    }
    if (user.id !== game.adminId) {
      throw new UnauthorizedException();
    }
    if (game.status === 'ACTIVE') {
      throw new BadRequestException('Game has already started');
    }
    if (game.status === 'COMPLETED') {
      throw new BadRequestException('Game has already ended');
    }
    await prisma.question.delete({
      where: {
        gameId: gameId,
        id: questionId,
      },
    });
    return {
      success: true,
      message: 'Question deleted successfully',
    };
  }

  private generateRandomCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
