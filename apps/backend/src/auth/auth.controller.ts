import {
  BadRequestException,
  Controller,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { signinRequest, signupRequest } from '@repo/common-types';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Req() req: Request, @Res() res: Response) {
    const zodRes = await signupRequest.safeParseAsync(req.body);
    if (zodRes.error) {
      throw new BadRequestException();
    }
    return await this.authService.signup(req.body, res);
  }

  @Post('login')
  async login(@Req() req: Request, @Res() res: Response) {
    const zodRes = await signinRequest.safeParseAsync(req.body);
    if (zodRes.error) {
      throw new BadRequestException();
    }
    return await this.authService.signin(req.body, res);
  }
}
