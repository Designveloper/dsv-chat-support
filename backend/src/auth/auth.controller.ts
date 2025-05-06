import { Controller, Post, Body, UseGuards, Res, Req, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ConfirmEmailDto } from './dto/confirm-email.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    await this.authService.signup(signupDto.email, signupDto.password);
    return { message: 'Please check your email to confirm your account.' };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { accessToken, refreshToken } = await this.authService.login(
      loginDto.email,
      loginDto.password
    );

    this.setRefreshTokenCookie(response, refreshToken);

    return { accessToken };
  }

  @Post('refresh')
  async refresh(@Req() request: Request) {
    const refreshToken = request.cookies['refresh_token'];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const { accessToken } = await this.authService.refreshAccessToken(refreshToken);
    return { accessToken };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    return { success: true };
  }

  @Post('confirm')
  async confirmEmail(@Body() confirmEmailDto: ConfirmEmailDto) {
    await this.authService.confirmEmail(confirmEmailDto.email, confirmEmailDto.code);
    return { message: 'Email confirmed successfully' };
  }

  @Post('resend-confirmation')
  async resendConfirmation(@Body('email') email: string) {
    await this.authService.resendConfirmation(email);
    return { message: 'Confirmation email resent' };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    await this.authService.forgotPassword(email);
    return { message: 'Please check your email to reset your password' };
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const { email, code, newPassword } = resetPasswordDto;
    await this.authService.resetPassword(email, code, newPassword);
    return { message: 'Password reset successfully' };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    await this.authService.changePassword(
      req.user.email,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );

    return { message: 'Password changed successfully' };
  }

  private setRefreshTokenCookie(response: Response, refreshToken: string) {
    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    response.cookie('refresh_token', refreshToken, {
      httpOnly: true, // Prevents JavaScript access
      secure: true,
      sameSite: 'none',
      maxAge: expiresIn,
      path: '/', // Available across the site
    });
  }
}