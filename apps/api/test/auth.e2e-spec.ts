import { createHash } from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { App } from 'supertest/types';
import { Repository } from 'typeorm';
import { TestAppModule } from './test-app.module.js';
import { configureApp } from '../src/app.config.js';
import { User } from '../src/users/entities/user.entity.js';
import { RefreshToken } from '../src/auth/entities/refresh-token.entity.js';
import { TokenService } from '../src/auth/token.service.js';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let userRepo: Repository<User>;
  let refreshTokenRepo: Repository<RefreshToken>;
  let tokenService: TokenService;
  let jwtService: JwtService;
  let userCounter = 0;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    userRepo = moduleFixture.get(getRepositoryToken(User));
    refreshTokenRepo = moduleFixture.get(getRepositoryToken(RefreshToken));
    tokenService = moduleFixture.get(TokenService);
    jwtService = moduleFixture.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  async function createUser(overrides: Partial<User> = {}): Promise<User> {
    userCounter += 1;
    return userRepo.save(
      userRepo.create({
        name: 'Test User',
        email: `user${userCounter}@example.com`,
        password: null,
        emailVerifiedAt: null,
        ...overrides,
      }),
    );
  }

  describe('GET /auth/me', () => {
    it('returns the user with emailVerified=false when emailVerifiedAt is null', async () => {
      const user = await createUser({ emailVerifiedAt: null });
      const { accessToken } = await tokenService.issueTokenPair(user);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: false,
      });
    });

    it('returns emailVerified=true when emailVerifiedAt is set', async () => {
      const user = await createUser({ emailVerifiedAt: new Date() });
      const { accessToken } = await tokenService.issueTokenPair(user);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.emailVerified).toBe(true);
    });

    it('rejects a request with no Authorization header', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('rejects a malformed JWT', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer not-a-valid-jwt')
        .expect(401);
    });

    it('rejects an expired JWT', async () => {
      const user = await createUser();
      const expiredToken = jwtService.sign({ sub: user.id }, { expiresIn: '-10s' });

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('rejects a JWT signed with the wrong secret', async () => {
      const user = await createUser();
      const wrongSecretJwt = new JwtService({ secret: 'a-completely-different-secret' });
      const badToken = wrongSecretJwt.sign({ sub: user.id });

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${badToken}`)
        .expect(401);
    });

    it('rejects a JWT whose sub does not reference an existing user', async () => {
      const token = jwtService.sign({ sub: 999999 });

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    it('rotates a valid refresh token and returns a new pair', async () => {
      const user = await createUser();
      const { refreshToken } = await tokenService.issueTokenPair(user);

      const res = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.refreshToken).toEqual(expect.any(String));
      expect(res.body.refreshToken).not.toBe(refreshToken);
    });

    it('rejects a request missing refreshToken', () => {
      return request(app.getHttpServer()).post('/auth/refresh').send({}).expect(400);
    });

    it('rejects an unknown refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'unknown-token' })
        .expect(401);
    });

    it('rejects reuse of an already-rotated token and revokes the rest of the session', async () => {
      const user = await createUser();
      const { refreshToken: tokenA } = await tokenService.issueTokenPair(user);
      const { refreshToken: tokenB } = await tokenService.issueTokenPair(user);

      // First use rotates tokenA normally.
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: tokenA })
        .expect(200);

      // Reusing the now-revoked tokenA is a theft signal.
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: tokenA })
        .expect(401);

      // The rest of the user's active sessions (tokenB) must now be dead too.
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: tokenB })
        .expect(401);
    });

    it('rejects an expired-but-not-revoked token without revoking the rest of the session', async () => {
      const user = await createUser();
      const { refreshToken: expiredToken } = await tokenService.issueTokenPair(user);
      const { refreshToken: siblingToken } = await tokenService.issueTokenPair(user);

      await refreshTokenRepo
        .createQueryBuilder()
        .update(RefreshToken)
        .set({ expiresAt: new Date(Date.now() - 1000) })
        .where('token_hash = :hash', {
          hash: createHash('sha256').update(expiredToken).digest('hex'),
        })
        .execute();

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: expiredToken })
        .expect(401);

      // No mass revocation for a merely-expired token — the sibling is still good.
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: siblingToken })
        .expect(200);
    });
  });

  describe('POST /auth/logout', () => {
    it('revokes the given refresh token', async () => {
      const user = await createUser();
      const { refreshToken } = await tokenService.issueTokenPair(user);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(204);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    it('is idempotent when the token is already revoked', async () => {
      const user = await createUser();
      const { refreshToken } = await tokenService.issueTokenPair(user);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(204);

      await request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken })
        .expect(204);
    });

    it('succeeds (idempotently) for an unknown token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .send({ refreshToken: 'unknown-token' })
        .expect(204);
    });

    it('rejects a request missing refreshToken', () => {
      return request(app.getHttpServer()).post('/auth/logout').send({}).expect(400);
    });
  });
});
