import { BadRequestException, Controller, Post, Req } from '@nestjs/common';
import { createGameRequest } from '@repo/common-types/dist';
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
}
