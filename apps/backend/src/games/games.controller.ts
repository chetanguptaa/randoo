import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  createGameRequest,
  createQuestionsRequest,
} from '@repo/common-types/dist';
import { Request } from 'express';
import { GamesService } from './games.service';

@Controller('games')
export class GamesController {
  constructor(private gameService: GamesService) {}

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

  @Get(':gameId/questions')
  async getAllQuestions(@Req() req: Request, @Param('gameId') gameId: string) {
    return this.gameService.getAllQuestions(req.user, gameId);
  }

  @Post(':gameId/start-game')
  async startGame(@Req() req: Request, @Param('gameId') gameId: string) {
    return this.gameService.startGame(req.user, gameId);
  }
}
