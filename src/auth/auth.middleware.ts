import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}
  async use(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization;

    const [type, token] = auth.split(' ');

    if (
      !auth ||
      type !== 'Bearer' ||
      !(await this.authService.validateToken(token))
    ) {
      return res.status(401).send({
        status: 401,
        message: 'Unauthorized',
      });
    }
    next();
  }
}
