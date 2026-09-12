import { User } from '../users/entities/user.entity.js';
import { OAuthAccount } from '../auth/entities/oauth-account.entity.js';
import { PasswordResetToken } from '../auth/entities/password-reset-token.entity.js';
import { RefreshToken } from '../auth/entities/refresh-token.entity.js';

export const entities = [User, OAuthAccount, PasswordResetToken, RefreshToken];
