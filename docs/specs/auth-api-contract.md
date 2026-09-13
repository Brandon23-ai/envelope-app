# Contrato de API — Módulo de autenticación

> Generado leyendo directamente `apps/api/src/auth/`, `apps/api/src/users/`,
> `apps/api/src/config/env.validation.ts`, `apps/api/src/app.config.ts`,
> `apps/api/src/main.ts` y los tests e2e en `apps/api/test/auth.e2e-spec.ts`.
> Todo lo que sigue refleja el código real, no lo que un cliente móvil
> "debería" poder hacer.

## ⚠️ Discrepancia importante con el prompt de Fase 1

El prompt de Fase 1 asume un módulo de auth "terminado y funcionando" que
incluye login, registro, login con Google y recuperación de contraseña.
**Eso no es lo que hay en el backend hoy.** El `AuthController` real
(`apps/api/src/auth/auth.controller.ts`) sólo expone tres endpoints:

| Método | Path | Requiere sesión |
|---|---|---|
| `POST` | `/auth/refresh` | No |
| `POST` | `/auth/logout` | No (ver nota) |
| `GET` | `/auth/me` | Sí (`JwtAuthGuard`) |

**No existen** `POST /auth/login`, `POST /auth/register`,
`POST /auth/google`, ni ningún endpoint de "forgot password" / "reset
password". Sí hay señales de que estaban planeados a nivel de esquema:

- `User.password` es `varchar` **nullable** — soporta usuarios sin
  contraseña (OAuth-only).
- Existe la entidad `OAuthAccount` (`oauth_accounts`: `provider`,
  `providerUserId`, `providerEmail`, `linkedAt`) pero ningún controller ni
  service la usa.
- Existe la entidad `PasswordResetToken` (`password_reset_tokens`:
  `tokenHash`, `expiresAt`, `usedAt`) pero tampoco tiene controller/service.
- No hay ninguna librería de hashing de contraseñas instalada (sin
  `bcrypt`/`argon2` en `package.json`), ni ninguna librería de Google OAuth,
  ni `@nestjs/throttler`.

Es decir: el "esquema y infraestructura de tokens" ya migró desde Laravel
(según el mensaje del último commit), pero **login, registro, Google y
password reset todavía no se portaron**. Documento acá abajo únicamente lo
que existe de verdad. La Fase 1 de la app móvil igual construye las
pantallas y el `AuthContext` con la forma que pide el prompt (para no
bloquear el scaffolding), pero `login`, `register`, `requestPasswordReset` y
`loginWithGoogle` apuntan a endpoints que **hoy devuelven 404** — están
implementados del lado del cliente contra la forma más razonable que se
pudo inferir, no contra un contrato real. Ver el resumen de la conversación
para más detalle.

## Base URL y prefijo global

No hay ningún prefijo global de rutas (`app.setGlobalPrefix` no se llama en
ningún lado de `main.ts`/`app.config.ts`). Los paths de abajo son literales,
tal cual quedan montados sobre la base URL del backend (`http://<host>:<PORT>`,
`PORT` por defecto `3000`).

## Pipe de validación global

`apps/api/src/app.config.ts` registra:

```ts
new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })
```

Esto aplica a **todos** los endpoints con `@Body()`. Consecuencias:

- Campos no declarados en el DTO → 400 (`forbidNonWhitelisted`).
- Los campos declarados se transforman a su tipo (`transform: true`).
- Los mensajes de error de validación siguen el formato default de Nest
  (ver "Forma de los errores" más abajo).

No hay ningún `ExceptionFilter` global custom — los errores usan el formato
default de Nest/Express.

## Rate limiting

**No hay ningún rate limiting aplicado.** No está instalado
`@nestjs/throttler` ni existe ningún decorador `@Throttle` o middleware
equivalente en el código. Ningún endpoint de auth tiene límite de
requests hoy.

---

## Endpoints implementados

### `GET /auth/me`

Devuelve los datos del usuario autenticado.

**Headers requeridos:**

```
Authorization: Bearer <accessToken>
```

**Body:** ninguno.

**Éxito — `200 OK`:**

```json
{
  "id": 1,
  "name": "Test User",
  "email": "user@example.com",
  "emailVerified": false
}
```

Los 4 campos son exactamente los de `AuthMeResponseDto`
(`apps/api/src/auth/dto/auth-me-response.dto.ts`). Notar:

- **`emailVerified` es un booleano**, no un timestamp. El controller lo
  calcula así (`auth.controller.ts:29`):
  `emailVerified: emailVerifiedAt !== null`. El timestamp interno
  (`emailVerifiedAt`) **nunca se expone** al cliente bajo ningún nombre.
- `id` es `number` (entero autoincremental de Postgres), no UUID/string.

**Errores — `401 Unauthorized`** (mismo body en los 5 casos, no hay forma de
distinguirlos desde la respuesta):

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

Casos que producen este 401 (cubiertos 1:1 por `auth.e2e-spec.ts`):

1. Sin header `Authorization`.
2. JWT malformado (no parsea).
3. JWT expirado (`exp` vencido).
4. JWT firmado con un secret distinto al configurado.
5. JWT válido pero cuyo `sub` no corresponde a ningún usuario existente.

---

### `POST /auth/refresh`

Rota el refresh token y emite un par de tokens nuevo.

**Headers:** ninguno especial (no requiere `Authorization`).

**Request body** (`RefreshTokenDto`):

```json
{
  "refreshToken": "string"
}
```

Validación: `@IsString() @IsNotEmpty()`. Sin más campos permitidos
(`forbidNonWhitelisted`).

**Éxito — `200 OK`** (`TokenPair`):

```json
{
  "accessToken": "string (JWT, HS256)",
  "refreshToken": "string (64 hex chars, random)"
}
```

El `refreshToken` devuelto es **siempre distinto** al que se mandó — cada
uso rota el token (nunca se reutiliza el mismo valor).

**Errores:**

- **`400 Bad Request`** si falta `refreshToken` en el body. Forma esperada
  (default de `class-validator` + `ValidationPipe`, no verificada
  literalmente por el test e2e — el test sólo chequea el status code):

  ```json
  {
    "statusCode": 400,
    "message": [
      "refreshToken must be a string",
      "refreshToken should not be empty"
    ],
    "error": "Bad Request"
  }
  ```

- **`401 Unauthorized`** (`{"statusCode":401,"message":"Unauthorized"}`) en
  3 escenarios distintos, con comportamiento server-side importante:

  1. **Token desconocido** (no existe en `refresh_tokens`): 401 simple.
  2. **Token ya usado/revocado** (`revokedAt !== null`): 401, **y además
     revoca todos los demás refresh tokens activos de ese usuario**
     (`token.service.ts:44-47`, `revokeAllForUser`). Esto es una señal de
     robo — si un refresh token rotado se reutiliza, el backend asume que
     alguien más lo tiene y mata *toda* la sesión del usuario, no sólo ese
     token. Confirmado por el test `rejects reuse of an already-rotated
     token and revokes the rest of the session`.
  3. **Token expirado pero no revocado** (`expiresAt` vencido,
     `revokedAt === null`): 401, pero **sin** revocar el resto de la
     sesión — un sibling token todavía válido sigue funcionando después.
     Confirmado por `rejects an expired-but-not-revoked token without
     revoking the rest of the session`.

  El orden de chequeo en `token.service.ts` es: primero `revokedAt`, después
  `expiresAt`. Un token revocado dispara el theft-signal aunque también
  esté expirado.

**Implicación para el cliente:** ante cualquier 401 de `/auth/refresh`, no
hay forma de saber por el body cuál de los 3 casos fue — el cliente debe
tratarlos todos igual: limpiar la sesión local y mandar al login.

---

### `POST /auth/logout`

Revoca un refresh token puntual.

**Headers:** ninguno especial (no está protegido por `JwtAuthGuard`; no
valida el access token).

**Request body** (`RefreshTokenDto`, igual que refresh):

```json
{
  "refreshToken": "string"
}
```

**Éxito — `204 No Content`:** sin body. **Es idempotente e incondicional**:
devuelve 204 tanto si el token existía y estaba activo, como si ya estaba
revocado, **como si el token ni siquiera existe** (`token.service.ts:62-71`
hace un `UPDATE ... WHERE token_hash = ... AND revoked_at IS NULL` y no
chequea cuántas filas afectó). Logout nunca falla por un token inválido.

**Errores:**

- **`400 Bad Request`** sólo si falta `refreshToken` en el body — misma
  forma que en `/auth/refresh`.
- No hay caso de `401` ni `404` para este endpoint.

---

## Endpoints que el prompt de Fase 1 asume pero **no existen**

Documentados acá para que quede explícito qué falta y no se confunda con
un "olvido" de este documento.

### `POST /auth/login` — no existe

No hay ningún endpoint de login con email/contraseña. No hay verificación
de contraseña en ningún lado del código (ni bcrypt ni comparación manual).

### `POST /auth/register` — no existe

Igual que arriba. `UsersService` sólo tiene `findById`; no hay `create`.

### `POST /auth/google` — no existe

No hay ninguna dependencia de Google OAuth instalada ni ningún controller
para esto. La entidad `OAuthAccount` sugiere que se planeó, pero no hay
código que la use. **No hay forma de saber el nombre literal del campo del
ID token** porque no hay ningún DTO real que lo defina — cualquier nombre
de campo usado del lado del cliente hoy es una suposición razonable
(`idToken`), no un dato tomado del backend.

### Password reset (`forgot-password` / `reset-password`) — no existe

La entidad `PasswordResetToken` está creada (con `tokenHash`, `expiresAt`,
`usedAt`) pero no hay controller ni service que la lea o escriba.

---

## Configuración del access token

`apps/api/src/auth/auth.module.ts` firma el access token con
`JwtModule.registerAsync`:

- Algoritmo: `HS256`.
- Secret: `JWT_ACCESS_SECRET` (env var, validada como requerida en
  `env.validation.ts` — el arranque falla si falta).
- Expiración: **antes de esta rama era `'15m'`, hardcodeado en el código**
  (no leía ningún env var). Como parte de esta Fase 1 (sección 1.2 del
  prompt) se hizo configurable vía `JWT_ACCESS_EXPIRES_IN` y se subió a
  `7d` en `.env`/`.env.example`. Ver commit correspondiente.

El refresh token no es un JWT: es un valor random de 32 bytes
(`crypto.randomBytes(32).toString('hex')`), y el backend sólo guarda su
hash SHA-256 (`tokenHash`) en la tabla `refresh_tokens`. Su TTL es fijo en
código (`REFRESH_TOKEN_TTL_MS = 30 días`, `token.service.ts:9`), no
configurable por env var — el prompt pide dejarlo así ("El refresh token
queda como está"), así que no se tocó.

## CORS

No hay ningún `app.enableCors()` en `main.ts`/`app.config.ts`. Sin CORS
habilitado explícitamente. No debería afectar a la app móvil nativa (no
aplica same-origin policy fuera de un WebView/target web de Expo), así que
no se tocó — está fuera del alcance de "sólo mové la expiración del access
token" de la sección 1.2.
