import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '../users/users.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { ChatWidgetsService } from '../chat-widgets/chat-widgets.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private refreshTokensService: RefreshTokensService,
    private chatWidgetsService: ChatWidgetsService,
    private jwtService: JwtService,
  ) {}

  async signup(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.create(email, password);
    await this.chatWidgetsService.create(user.id);
    return this.generateTokens(user);
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.generateTokens(user);
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);
    
    const refreshToken = this.jwtService.sign({...payload}, { expiresIn: '7d' });

    const expiresTime = new Date();
    expiresTime.setDate(expiresTime.getDate() + 7);

    await this.refreshTokensService.create(user.id, refreshToken, expiresTime);
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const tokenRecord = await this.refreshTokensService.findOneByToken(refreshToken);
      if (!tokenRecord || tokenRecord.expires_time < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const user = tokenRecord.user;
      const accessToken = this.jwtService.sign(
        { email: user.email, sub: user.id },
        { expiresIn: '15m' }
      );
      
      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}