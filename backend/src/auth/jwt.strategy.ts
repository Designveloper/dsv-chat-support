import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import * as dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    if (payload.type === 'access') {
      return {
        userId: payload.sub,
        email: payload.email,
        created_at: payload.created_at,
      }
    }
    else if (payload.type === 'refresh') {
      const user = await this.usersService.findOneByEmail(payload.email);
      if (!user) {
        return null;
      }
      return {
        userId: user.id,
        email: user.email,
        created_at: user.created_at,
      };
    }

    return null;
  }
}