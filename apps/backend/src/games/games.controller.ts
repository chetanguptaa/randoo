import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  Sse,
} from '@nestjs/common';
import {
  createGameRequest,
  createQuestionsRequest,
  joinGameRequest,
} from '@repo/common-types/dist';
import { Request, Response } from 'express';
import { GamesService } from './games.service';
import { Observable } from 'rxjs';

@Controller('games')
export class GamesController {
  constructor(private gameService: GamesService) {}

  @Get()
  async getGame(@Query() code?: string) {
    return this.gameService.getGame(code);
  }

  @Post()
  async createGame(@Req() req: Request) {
    const res = await createGameRequest.safeParseAsync(req.body);
    if (res.error) {
      throw new BadRequestException();
    }
    return this.gameService.createGame(req.user, req.body);
  }

  @Post(':gameId/questions')
  async addAQuestion(@Req() req: Request, @Param('gameId') gameId: string) {
    const res = await createQuestionsRequest.safeParseAsync(req.body);
    if (res.error) {
      throw new BadRequestException();
    }
    return this.gameService.createQuestions(req.user, gameId, req.body);
  }

  @Delete(':gameId/questions/:questionId')
  async deleteAQuestion(
    @Req() req: Request,
    @Param('gameId') gameId: string,
    @Param('questionId') questionId: string,
  ) {
    return this.gameService.deleteAQuestion(req.user, gameId, questionId);
  }

  @Get(':gameId/questions')
  async getAllQuestions(@Req() req: Request, @Param('gameId') gameId: string) {
    return this.gameService.getAllQuestions(req.user, gameId);
  }

  @Post(':gameId/start-game')
  async startGame(@Req() req: Request, @Param('gameId') gameId: string) {
    return this.gameService.startGame(req.user, gameId);
  }

  @Get(':gameId/players')
  async getAllPlayers(@Param('gameId') gameId: string) {
    return this.gameService.getAllPlayers(gameId);
  }

  @Post(':gameId/join-game')
  async joinGame(@Req() req: Request, @Param('gameId') gameId: string) {
    const res = await joinGameRequest.safeParseAsync(req.body);
    if (res.error) {
      throw new BadRequestException();
    }
    if (req.user) {
      return this.gameService.joinGame(gameId, req.user, null);
    } else {
      if (!res.data.name) throw new BadRequestException();
      return this.gameService.joinGame(gameId, null, res.data.name);
    }
  }

  @Sse(':gameId/updates')
  sse(
    @Req() req: Request,
    @Param('gameId') gameId: string,
    @Res() res: Response,
  ): Observable<MessageEvent> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    return new Observable<MessageEvent>((subscriber) => {
      this.gameService.sse(gameId, req, res, (eventData: any) => {
        new MessageEvent('message', { data: eventData });
      });
      req.on('close', () => {
        subscriber.complete();
      });
    });
  }
}
