import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface IUser {
  id: number;
  email: string;
  name: string;
  createdAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // TODO -> find a better way to do it
    if (req.path.includes('/join-game') || req.path.includes('/updates')) {
      return next();
    }
    const token = req.cookies['auth_token'];
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as IUser;
      req['user'] = decoded;
      next();
    } catch (error) {
      console.log('error ', error);
      throw new UnauthorizedException();
    }
  }
}
