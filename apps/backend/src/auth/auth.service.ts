import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TSigninRequest, TSignupRequest } from '@repo/common-types';
import prisma from '@repo/db';
import * as bcrypt from 'bcryptjs';
import { CookieOptions, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { COOKIE_NAMES, expiresTimeTokenMilliseconds } from 'src/constants/auth';

@Injectable()
export class AuthService {
  private JWT_SECRET: string;
  constructor(configService: ConfigService) {
    this.JWT_SECRET = configService.get('JWT_SECRET');
  }
  async signup(signupRequestBody: TSignupRequest, res: Response) {
    const { password } = signupRequestBody;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        ...signupRequestBody,
        password: hashedPassword,
      },
    });
    const resWithCookies = this.setJwtTokenToCookies(res, {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });
    return resWithCookies.json({
      success: true,
      message: 'signed up successfully',
    });
  }

  async signin(signinRequestBody: TSigninRequest, res: Response) {
    const { password } = signinRequestBody;
    const user = await prisma.user.findFirst({
      where: {
        email: signinRequestBody.email,
      },
    });
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new BadRequestException(
        'Password you entered is incorrect, please try again',
      );
    }
    const resWithCookies = this.setJwtTokenToCookies(res, {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt,
    });
    return resWithCookies.json({
      success: true,
      message: 'signed in successfully',
    });
  }

  private setJwtTokenToCookies(
    res: Response,
    user: {
      id: number;
      email: string;
      createdAt: Date;
    },
  ) {
    const expirationDateInMilliseconds =
      new Date().getTime() + expiresTimeTokenMilliseconds;
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
    };
    res.cookie(
      COOKIE_NAMES.AUTH_TOKEN,
      jwt.sign(user, this.JWT_SECRET, {
        expiresIn: expirationDateInMilliseconds,
      }),
      cookieOptions,
    );
    return res;
  }
}
