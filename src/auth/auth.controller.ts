import { Body, Controller, Post, Res } from '@nestjs/common';
import { LoginUserDto, RegisterUserDto } from 'src/dto/user.dto';
import { AuthService } from './auth.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() user: RegisterUserDto) {
    return await this.authService.register(user);
  }

  @Post('login')
  async login(@Body() user: LoginUserDto, @Res() res: Response) {
    const result = await this.authService.login(user.email, user.password);
    if (typeof result === 'boolean' && !result) {
      res.status(401).send({
        status: 401,
        message: 'Email o usuario incorrectos',
      });
    } else {
      res.status(200).send(result);
    }
  }
}
