import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { AuthMeResponseDto } from './dto/auth-me-response.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from './strategies/jwt.strategy.js';
import { TokenService, type TokenPair } from './token.service.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly tokenService: TokenService) {}

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto): Promise<TokenPair> {
    return this.tokenService.refreshTokenPair(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Body() dto: RefreshTokenDto): Promise<void> {
    await this.tokenService.revokeRefreshToken(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request & { user: AuthenticatedUser }): AuthMeResponseDto {
    const { id, name, email, emailVerifiedAt } = req.user;
    return { id, name, email, emailVerified: emailVerifiedAt !== null };
  }
}
