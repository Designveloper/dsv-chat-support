import { Injectable, UnauthorizedException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../users/users.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RefreshTokensService } from '../refresh-tokens/refresh-tokens.service';
import { ChatWidgetsService } from '../chat-widgets/chat-widgets.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private refreshTokensService: RefreshTokensService,
    private chatWidgetsService: ChatWidgetsService,
    private jwtService: JwtService,
    private mailerService: MailerService
  ) { }

  async signup(email: string, password: string): Promise<void> {
    if (!email.endsWith('@dgroup.co')) {
      throw new UnauthorizedException('Only @dgroup.co emails are allowed to sign up');
    }

    const user = await this.usersService.create(email, password);

    const confirmationCode = crypto.randomBytes(3).toString('hex');
    user.confirmationCode = confirmationCode;

    await this.usersService.save(user);

    await this.sendConfirmationEmail(user.email, confirmationCode);
  }

  async login(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!user.isEmailConfirmed) {
      throw new UnauthorizedException('Email not confirmed. Please check your email to confirm your account.');
    }
    return this.generateTokens(user);
  }

  private async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign({ ...payload }, { expiresIn: '7d' });

    const expiresTime = new Date();
    expiresTime.setDate(expiresTime.getDate() + 7);

    await this.refreshTokensService.create(user.id, refreshToken, expiresTime);
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
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

  async sendConfirmationEmail(email: string, code: string): Promise<void> {
    // Check if the email ends with @dgroup.co
    if (!email.endsWith('@dgroup.co')) {
      throw new Error('Only @dgroup.co emails are allowed to receive confirmation codes');
    }

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Account Confirmation',
        text: `Your confirmation code is: ${code}`,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Unable to send confirmation email');
    }
  }

  async sendEmail(email: string, subject: string, text: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject,
        text,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Unable to send email');
    }
  }

  async confirmEmail(email: string, code: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user || user.confirmationCode !== code) {
      throw new UnauthorizedException('Invalid confirmation code');
    }
    user.isEmailConfirmed = true;
    user.confirmationCode = "";
    await this.usersService.save(user);
    await this.chatWidgetsService.create(user.id);
  }

  async resendConfirmation(email: string): Promise<void> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    if (user.isEmailConfirmed) {
      throw new UnauthorizedException('Email already confirmed');
    }
    const confirmationCode = crypto.randomBytes(3).toString('hex');
    user.confirmationCode = confirmationCode;
    await this.usersService.save(user);
    await this.sendConfirmationEmail(user.email, confirmationCode);
  }
}