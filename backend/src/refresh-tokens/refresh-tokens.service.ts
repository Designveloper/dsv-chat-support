import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './refresh-tokens.entity';

@Injectable()
export class RefreshTokensService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async create(userId: number, refreshToken: string, expiresTime: Date): Promise<RefreshToken> {
    const token = this.refreshTokensRepository.create({
      user_id: userId,
      refresh_token: refreshToken,
      expires_time: expiresTime,
    });
    return this.refreshTokensRepository.save(token);
  }

  async findOneByToken(refreshToken: string): Promise<RefreshToken | undefined> {
    const token = await this.refreshTokensRepository.findOne({
      where: { refresh_token: refreshToken },
      relations: ['user'],
    });
    return token ?? undefined;
  }
}