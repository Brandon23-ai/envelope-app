import { createHash, randomBytes } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { RefreshToken } from './entities/refresh-token.entity.js';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async issueTokenPair(user: User): Promise<TokenPair> {
    return {
      accessToken: this.jwtService.sign({ sub: user.id }),
      refreshToken: await this.createRefreshToken(user),
    };
  }

  async refreshTokenPair(plainRefreshToken: string): Promise<TokenPair> {
    const tokenHash = this.hash(plainRefreshToken);
    const existing = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
      relations: { user: true },
    });

    if (!existing) {
      throw new UnauthorizedException();
    }

    // Reuse of an already-rotated token is a theft signal, independent of
    // whether it has also since expired — check this before the expiry check.
    if (existing.revokedAt !== null) {
      await this.revokeAllForUser(existing.user.id);
      throw new UnauthorizedException();
    }

    if (existing.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException();
    }

    existing.revokedAt = new Date();
    await this.refreshTokenRepo.save(existing);

    return {
      accessToken: this.jwtService.sign({ sub: existing.user.id }),
      refreshToken: await this.createRefreshToken(existing.user),
    };
  }

  async revokeRefreshToken(plainRefreshToken: string): Promise<void> {
    // Idempotent no-op if not found / already revoked — logout must always succeed.
    await this.refreshTokenRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('token_hash = :tokenHash', { tokenHash: this.hash(plainRefreshToken) })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  private async revokeAllForUser(userId: number): Promise<void> {
    await this.refreshTokenRepo
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }

  private async createRefreshToken(user: User): Promise<string> {
    const plain = randomBytes(32).toString('hex');
    const entity = this.refreshTokenRepo.create({
      user,
      tokenHash: this.hash(plain),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      revokedAt: null,
    });
    await this.refreshTokenRepo.save(entity);
    return plain;
  }

  private hash(plain: string): string {
    return createHash('sha256').update(plain).digest('hex');
  }
}
