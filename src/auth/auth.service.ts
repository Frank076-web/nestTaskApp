import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterUserDto } from 'src/dto/user.dto';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { config } from 'dotenv';

config();

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private readonly secretKey = process.env.SECRET_KEY;

  private async hashPassword(
    password: string,
  ): Promise<{ password: string; salt: string }> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    return { password: hashedPassword, salt };
  }

  private async validatePassword(
    user: User,
    plainPassword: string,
  ): Promise<boolean> {
    const hash = await bcrypt.hash(plainPassword, user.salt);
    return hash === user.password;
  }

  private async generateToken(user: User): Promise<string> {
    const payload = { username: user.name, sub: user.id };
    return jwt.sign(payload, this.secretKey);
  }

  async validateToken(token: string): Promise<boolean | null> {
    try {
      return jwt.verify(token, this.secretKey);
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  async register(user: RegisterUserDto) {
    const { name, password, email } = user;

    const [userExists] = await this.userRepository.findBy({ email });

    if (userExists) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const hashedCredentials = await this.hashPassword(password);

    const newUser = this.userRepository.create({
      name,
      email,
      password: hashedCredentials.password,
      salt: hashedCredentials.salt,
    });

    const createdUser = await this.userRepository.save(newUser);

    return {
      id: createdUser.id,
      name,
      email,
    };
  }

  async login(
    email: string,
    password: string,
  ): Promise<
    { id: number; name: string; email: string; token: string } | boolean
  > {
    const [user] = await this.userRepository.findBy({ email });
    if (user && (await this.validatePassword(user, password))) {
      const token = await this.generateToken(user);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        token,
      };
    }

    return false;
  }
}
