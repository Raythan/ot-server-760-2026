import 'dotenv/config';
import type { Pool } from 'mysql2/promise';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { getPool } from './db.js';
import {
  generateRecoveryKeyPlain,
  generateResetTokenPlain,
  hashRecoveryKey,
  hashResetToken,
  hexHashesEqual,
  sha1Password,
} from './crypto.js';
import { buildPlayerRow, ALLOWED_TOWN_IDS } from './playerDefaults.js';
import { mapMysqlOrSystemError } from './mysqlErrors.js';
import { sendPasswordResetEmail } from './email.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-change-JWT_SECRET';

/** Máximo de personagens por conta (API + cliente). */
const MAX_CHARACTERS_PER_ACCOUNT = 50;

const GENERIC_FORGOT_MSG =
  'Se esse e-mail constar nos nossos registros, você receberá um link para redefinição de senha. Lembre-se de verificar a caixa de spam, lixeira, etc.';

const PWRESET_TTL_SEC = Number(process.env.PASSWORD_RESET_TTL_SEC ?? 3600);

const RECOVERY_KEY_COLUMNS = [
  'web_recovery_key_1',
  'web_recovery_key_2',
  'web_recovery_key_3',
  'web_recovery_key_4',
  'web_recovery_key_5',
] as const;
const RECOVERY_SCHEMA_MISSING_MSG =
  'Recuperação de senha temporariamente indisponível: falta aplicar a migração SQL do webapp (`webapp/server/sql/alter-accounts-web-recovery.sql`).';

function isMissingRecoverySchemaError(err: unknown): boolean {
  const e = err as { code?: string; errno?: number; message?: string } | null;
  if (!e) return false;
  const code = e.code;
  const errno = e.errno;
  if (code !== 'ER_BAD_FIELD_ERROR' && errno !== 1054) return false;
  const msg = String(e.message ?? '').toLowerCase();
  return (
    msg.includes('web_pwreset_') ||
    msg.includes('web_recovery_') ||
    msg.includes('web_recovery_keys_initialized')
  );
}

function delayForgotMs(): Promise<void> {
  const ms = 150 + Math.floor(Math.random() * 100);
  return new Promise((r) => setTimeout(r, ms));
}

async function assignPasswordResetToken(
  pool: Pool,
  accountId: number,
  viaSlot: number
): Promise<string> {
  const plain = generateResetTokenPlain();
  const tokenHash = hashResetToken(plain);
  const exp = Math.floor(Date.now() / 1000) + PWRESET_TTL_SEC;
  await pool.query(
    'UPDATE `accounts` SET `web_pwreset_token_hash` = ?, `web_pwreset_expires` = ?, `web_pwreset_via_recovery_slot` = ? WHERE `id` = ?',
    [tokenHash, exp, viaSlot, accountId]
  );
  return plain;
}

function publicWebappBaseUrl(): string {
  const v = (process.env.WEBAPP_PUBLIC_URL ?? '').trim().replace(/\/$/, '');
  return v || 'http://localhost:5173';
}

function mysqlOnlineToBoolean(value: unknown): boolean {
  if (value === true || value === 1) return true;
  if (typeof value === 'bigint') return value === 1n;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1';
  if (Buffer.isBuffer(value)) return value.length > 0 && value[0] === 1;
  return false;
}

/** CORS: em dev com Vite, o browser usa o mesmo host do site e o proxy; `true` reflecte a origem. */
function corsOriginFromEnv(): boolean | string | RegExp {
  const v = process.env.CORS_ORIGIN;
  if (v === undefined || v === '') return true;
  if (v === 'true' || v === '1') return true;
  if (v === 'false' || v === '0') return false;
  return v;
}

const fastify = Fastify({ logger: true });

await fastify.register(cors, { origin: corsOriginFromEnv() });
await fastify.register(rateLimit, {
  global: true,
  max: Number(process.env.RATE_LIMIT_MAX ?? 120),
  timeWindow: '1 minute',
});

const exposeErrorDetail =
  process.env.API_DEBUG === '1' || process.env.NODE_ENV !== 'production';

fastify.setErrorHandler((err, _request, reply) => {
  const code = (err as { statusCode?: number }).statusCode;
  if (code) {
    const msg = err instanceof Error ? err.message : String(err);
    return reply.code(code).send({ error: msg });
  }

  const mapped = mapMysqlOrSystemError(err);
  if (mapped) {
    fastify.log.error({ err }, mapped.message);
    const payload: { error: string; detail?: string } = {
      error: mapped.message,
    };
    if (exposeErrorDetail && mapped.detail) {
      payload.detail = mapped.detail;
    }
    return reply.code(mapped.status).send(payload);
  }

  fastify.log.error(err);
  const payload: { error: string; detail?: string } = {
    error: 'Erro interno do servidor.',
  };
  if (exposeErrorDetail && err instanceof Error) {
    payload.detail = err.message;
  }
  return reply.code(500).send(payload);
});

function signToken(accountId: number): string {
  return jwt.sign({ sub: accountId }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyBearer(authorization: string | undefined): number {
  if (!authorization?.startsWith('Bearer ')) {
    throw Object.assign(new Error('Não autorizado.'), { statusCode: 401 });
  }
  const token = authorization.slice(7);
  try {
    const p = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const sub = p.sub;
    const accountId =
      typeof sub === 'string' ? parseInt(sub, 10) : Number(sub);
    if (!Number.isFinite(accountId) || accountId < 1) {
      throw new Error('bad token');
    }
    return accountId;
  } catch {
    throw Object.assign(new Error('Não autorizado.'), { statusCode: 401 });
  }
}

function validatePassword(p: string): void {
  if (typeof p !== 'string' || p.length < 6 || p.length > 48) {
    throw Object.assign(
      new Error('A senha deve ter entre 6 e 48 caracteres.'),
      {
        statusCode: 400,
      }
    );
  }
}

function validateEmailForRegister(email: string): void {
  const t = email.trim();
  if (t.length < 3 || t.length > 255) {
    throw Object.assign(
      new Error(
        'Indique um endereço de e-mail válido para recuperação da senha.'
      ),
      {
        statusCode: 400,
      }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
    throw Object.assign(
      new Error(
        'Indique um endereço de e-mail válido para recuperação da senha.'
      ),
      {
        statusCode: 400,
      }
    );
  }
}

function validateCharName(name: string): void {
  const t = name.trim();
  if (t.length < 3 || t.length > 29) {
    throw Object.assign(new Error('O nome deve ter entre 3 e 29 letras.'), {
      statusCode: 400,
    });
  }
  if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(t)) {
    throw Object.assign(
      new Error('Utilize apenas letras e um espaço entre palavras.'),
      { statusCode: 400 }
    );
  }
}

fastify.get('/api/health', async () => ({
  ok: true,
  game: 'Tenebra OT',
}));

fastify.post<{ Body: { password?: string; email?: string } }>(
  '/api/register',
  {
    config: {
      rateLimit: {
        max: Number(process.env.RATE_LIMIT_REGISTER ?? 15),
        timeWindow: '1 minute',
      },
    },
  },
  async (request, reply) => {
    const password = request.body?.password ?? '';
    const email = (request.body?.email ?? '').trim().slice(0, 255);
    validatePassword(password);
    validateEmailForRegister(email);
    const pool = getPool();
    const [existing] = await pool.query(
      'SELECT `id` FROM `accounts` WHERE LOWER(`email`) = LOWER(?) LIMIT 1',
      [email]
    );
    if ((existing as { id: number }[])[0]) {
      return reply
        .code(409)
        .send({ error: 'Este e-mail já está registado.' });
    }
    const conn = await pool.getConnection();
    try {
      await conn.query('LOCK TABLES `accounts` WRITE');
      const [rows] = await conn.query(
        'SELECT COALESCE(MAX(`id`), 0) AS m FROM `accounts`'
      );
      const id =
        Number((rows as { m: number }[])[0]?.m ?? 0) + 1;
      const hash = sha1Password(password);
      const created = Math.floor(Date.now() / 1000);
      await conn.query(
        `INSERT INTO \`accounts\` (
          \`id\`, \`password\`, \`type\`, \`premdays\`, \`lastday\`, \`email\`, \`key\`, \`blocked\`, \`created\`,
          \`rlname\`, \`location\`, \`country\`, \`web_lastlogin\`, \`web_flags\`, \`email_hash\`, \`email_new\`,
          \`email_new_time\`, \`email_code\`, \`email_next\`, \`premium_points\`, \`email_verified\`, \`vote\`
        ) VALUES (?, ?, 1, 0, 0, ?, '', 0, ?, '', '', '', 0, 0, '', '', 0, '', 0, 0, 0, 0)`,
        [id, hash, email, created]
      );
      const token = signToken(id);
      return { accountId: id, token };
    } finally {
      await conn.query('UNLOCK TABLES').catch(() => {});
      conn.release();
    }
  }
);

fastify.post<{ Body: { email?: string; password?: string } }>(
  '/api/login',
  {
    config: {
      rateLimit: {
        max: Number(process.env.RATE_LIMIT_LOGIN ?? 30),
        timeWindow: '1 minute',
      },
    },
  },
  async (request, reply) => {
    const email = (request.body?.email ?? '').trim().slice(0, 255);
    const password = request.body?.password ?? '';
    validateEmailForRegister(email);
    validatePassword(password);
    const pool = getPool();
    const hash = sha1Password(password);
    try {
      const [rows] = await pool.query(
        `SELECT \`id\`, \`password\`, \`web_recovery_keys_initialized\`,
          \`web_recovery_key_1\`, \`web_recovery_key_2\`, \`web_recovery_key_3\`, \`web_recovery_key_4\`, \`web_recovery_key_5\`
         FROM \`accounts\` WHERE LOWER(\`email\`) = LOWER(?) LIMIT 1`,
        [email]
      );
      const row = (rows as {
        id: number;
        password: string;
        web_recovery_keys_initialized: number | boolean;
      }[])[0];
      if (!row || row.password !== hash) {
        return reply
          .code(401)
          .send({ error: 'E-mail ou senha incorretos.' });
      }
      const token = signToken(row.id);
      const initialized = Boolean(row.web_recovery_keys_initialized);
      if (!initialized) {
        const plains: string[] = [];
        const hashes: string[] = [];
        for (let i = 0; i < 5; i++) {
          const p = generateRecoveryKeyPlain();
          plains.push(p);
          hashes.push(hashRecoveryKey(p));
        }
        await pool.query(
          `UPDATE \`accounts\` SET
            \`web_recovery_key_1\` = ?, \`web_recovery_key_2\` = ?, \`web_recovery_key_3\` = ?, \`web_recovery_key_4\` = ?, \`web_recovery_key_5\` = ?,
            \`web_recovery_keys_initialized\` = 1
           WHERE \`id\` = ?`,
          [...hashes, row.id]
        );
        return { token, accountId: row.id, recoveryKeys: plains };
      }
      return { token, accountId: row.id, recoveryKeys: null };
    } catch (err) {
      if (isMissingRecoverySchemaError(err)) {
        // Compatibilidade temporária: login continua funcional sem a migração.
        const [rows] = await pool.query(
          'SELECT `id`, `password` FROM `accounts` WHERE LOWER(`email`) = LOWER(?) LIMIT 1',
          [email]
        );
        const row = (rows as { id: number; password: string }[])[0];
        if (!row || row.password !== hash) {
          return reply
            .code(401)
            .send({ error: 'E-mail ou senha incorretos.' });
        }
        const token = signToken(row.id);
        return { token, accountId: row.id, recoveryKeys: null };
      }
      throw err;
    }
  }
);

fastify.post<{ Body: { email?: string; recoveryKey?: string } }>(
  '/api/forgot-password',
  {
    config: {
      rateLimit: {
        max: Number(process.env.RATE_LIMIT_FORGOT_PASSWORD ?? 10),
        timeWindow: '1 minute',
      },
    },
  },
  async (request, reply) => {
    await delayForgotMs();
    const email = (request.body?.email ?? '').trim().slice(0, 255);
    const recoveryKeyRaw = request.body?.recoveryKey;
    const hasRecovery =
      typeof recoveryKeyRaw === 'string' && recoveryKeyRaw.trim().length > 0;

    try {
      validateEmailForRegister(email);
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }

    const pool = getPool();

    try {
      if (!hasRecovery) {
        const [rows] = await pool.query(
          'SELECT `id` FROM `accounts` WHERE LOWER(`email`) = LOWER(?) LIMIT 1',
          [email]
        );
        const acc = (rows as { id: number }[])[0];
        if (acc) {
          const plain = await assignPasswordResetToken(pool, acc.id, 0);
          const resetUrl = `${publicWebappBaseUrl()}/?redefinir=${encodeURIComponent(plain)}`;
          await sendPasswordResetEmail({
            log: fastify.log,
            userEmail: email,
            resetUrl,
          });
        }
        return { message: GENERIC_FORGOT_MSG };
      }

      const [rows] = await pool.query(
        `SELECT \`id\`, \`web_recovery_keys_initialized\`,
          \`web_recovery_key_1\`, \`web_recovery_key_2\`, \`web_recovery_key_3\`, \`web_recovery_key_4\`, \`web_recovery_key_5\`
         FROM \`accounts\` WHERE LOWER(\`email\`) = LOWER(?) LIMIT 1`,
        [email]
      );
      const row = (rows as {
        id: number;
        web_recovery_keys_initialized: number | boolean;
        web_recovery_key_1: string;
        web_recovery_key_2: string;
        web_recovery_key_3: string;
        web_recovery_key_4: string;
        web_recovery_key_5: string;
      }[])[0];
      const inputHash = hashRecoveryKey(recoveryKeyRaw!.trim());

      if (!row || !row.web_recovery_keys_initialized) {
        return {
          message: GENERIC_FORGOT_MSG,
          resetToken: null,
        };
      }

      const slots = [
        row.web_recovery_key_1,
        row.web_recovery_key_2,
        row.web_recovery_key_3,
        row.web_recovery_key_4,
        row.web_recovery_key_5,
      ];
      let matchedSlot = 0;
      for (let i = 0; i < 5; i++) {
        const h = slots[i] ?? '';
        if (h && hexHashesEqual(h, inputHash)) {
          matchedSlot = i + 1;
          break;
        }
      }
      if (matchedSlot === 0) {
        return {
          message: GENERIC_FORGOT_MSG,
          resetToken: null,
        };
      }

      const plain = await assignPasswordResetToken(pool, row.id, matchedSlot);
      return {
        message: GENERIC_FORGOT_MSG,
        resetToken: plain,
      };
    } catch (err) {
      if (isMissingRecoverySchemaError(err)) {
        return reply.code(503).send({ error: RECOVERY_SCHEMA_MISSING_MSG });
      }
      throw err;
    }
  }
);

fastify.post<{ Body: { token?: string; password?: string } }>(
  '/api/reset-password',
  {
    config: {
      rateLimit: {
        max: Number(process.env.RATE_LIMIT_RESET_PASSWORD ?? 20),
        timeWindow: '1 minute',
      },
    },
  },
  async (request, reply) => {
    const token = (request.body?.token ?? '').trim();
    const password = request.body?.password ?? '';
    try {
      validatePassword(password);
    } catch (e) {
      return reply.code(400).send({ error: (e as Error).message });
    }
    if (!token) {
      return reply
        .code(400)
        .send({ error: 'Token de redefinição inválido ou expirado.' });
    }
    try {
      const tokenHash = hashResetToken(token);
      const pool = getPool();
      const now = Math.floor(Date.now() / 1000);
      const [resetRows] = await pool.query(
        'SELECT `id`, `web_pwreset_via_recovery_slot` FROM `accounts` WHERE `web_pwreset_token_hash` = ? AND `web_pwreset_expires` > ? LIMIT 1',
        [tokenHash, now]
      );
      const resetRow = (
        resetRows as { id: number; web_pwreset_via_recovery_slot: number }[]
      )[0];
      if (!resetRow) {
        return reply
          .code(400)
          .send({ error: 'Token de redefinição inválido ou expirado.' });
      }
      const passHash = sha1Password(password);
      const slot = Number(resetRow.web_pwreset_via_recovery_slot) || 0;
      if (slot >= 1 && slot <= 5) {
        const col = RECOVERY_KEY_COLUMNS[slot - 1];
        await pool.query(
          `UPDATE \`accounts\` SET \`password\` = ?, \`web_pwreset_token_hash\` = '', \`web_pwreset_expires\` = 0, \`web_pwreset_via_recovery_slot\` = 0, \`${col}\` = '' WHERE \`id\` = ?`,
          [passHash, resetRow.id]
        );
      } else {
        await pool.query(
          'UPDATE `accounts` SET `password` = ?, `web_pwreset_token_hash` = \'\', `web_pwreset_expires` = 0, `web_pwreset_via_recovery_slot` = 0 WHERE `id` = ?',
          [passHash, resetRow.id]
        );
      }
      return { ok: true };
    } catch (err) {
      if (isMissingRecoverySchemaError(err)) {
        return reply.code(503).send({ error: RECOVERY_SCHEMA_MISSING_MSG });
      }
      throw err;
    }
  }
);

fastify.get('/api/me', async (request) => {
  const accountId = verifyBearer(request.headers.authorization);
  return { accountId };
});

fastify.get('/api/characters', async (request) => {
  const accountId = verifyBearer(request.headers.authorization);
  const pool = getPool();
  const [rows] = await pool.query(
    `SELECT p.\`id\`, p.\`name\`, p.\`level\`, p.\`vocation\`,
      CASE WHEN po.\`player_id\` IS NOT NULL THEN 1 ELSE 0 END AS \`online\`
     FROM \`players\` p
     LEFT JOIN \`players_online\` po ON po.\`player_id\` = p.\`id\`
     WHERE p.\`account_id\` = ? AND p.\`deletion\` = 0
     ORDER BY p.\`name\``,
    [accountId]
  );
  const list = rows as {
    id: number;
    name: string;
    level: number;
    vocation: number;
    online: unknown;
  }[];
  return {
    characters: list.map((r) => ({
      id: r.id,
      name: r.name,
      level: r.level,
      vocation: r.vocation,
      online: mysqlOnlineToBoolean(r.online),
    })),
    limit: MAX_CHARACTERS_PER_ACCOUNT,
  };
});

fastify.delete<{ Params: { id: string } }>(
  '/api/characters/:id',
  async (request, reply) => {
    const accountId = verifyBearer(request.headers.authorization);
    const playerId = parseInt(request.params.id, 10);
    if (!Number.isFinite(playerId) || playerId < 1) {
      return reply.code(400).send({ error: 'ID de personagem inválido.' });
    }
    const pool = getPool();
    const [onlineRows] = await pool.query(
      'SELECT 1 FROM `players_online` WHERE `player_id` = ? LIMIT 1',
      [playerId]
    );
    if ((onlineRows as unknown[]).length > 0) {
      return reply.code(409).send({
        error:
          'Este personagem está online no jogo. Termine a sessão no cliente para poder eliminar.',
      });
    }
    const [result] = await pool.query(
      'DELETE FROM `players` WHERE `id` = ? AND `account_id` = ? AND `deletion` = 0',
      [playerId, accountId]
    );
    const affected = (result as { affectedRows?: number }).affectedRows ?? 0;
    if (affected === 0) {
      return reply.code(404).send({ error: 'Personagem não encontrado.' });
    }
    return { ok: true };
  }
);

fastify.post<{
  Body: {
    name?: string;
    sex?: number;
    townId?: number;
  };
}>('/api/characters', async (request, reply) => {
  const accountId = verifyBearer(request.headers.authorization);
  const name = request.body?.name ?? '';
  const sex = request.body?.sex;
  let townId = request.body?.townId;
  if (townId === undefined || townId === null) {
    townId = 1;
  }
  if (typeof townId !== 'number' || !Number.isInteger(townId)) {
    return reply.code(400).send({ error: 'Cidade inválida.' });
  }

  validateCharName(name);
  if (sex !== 0 && sex !== 1) {
    return reply
      .code(400)
      .send({ error: 'Indique se o personagem é feminino ou masculino.' });
  }
  if (!ALLOWED_TOWN_IDS.includes(townId as 1 | 11)) {
    return reply.code(400).send({ error: 'Cidade inválida.' });
  }

  const pool = getPool();
  const [dup] = await pool.query(
    'SELECT COUNT(*) AS c FROM `players` WHERE `name` = ? AND `deletion` = 0',
    [name.trim()]
  );
  if (Number((dup as { c: number }[])[0]?.c ?? 0) > 0) {
    return reply.code(409).send({ error: 'Esse nome já está em uso.' });
  }

  const [countRows] = await pool.query(
    'SELECT COUNT(*) AS c FROM `players` WHERE `account_id` = ? AND `deletion` = 0',
    [accountId]
  );
  if (
    Number((countRows as { c: number }[])[0]?.c ?? 0) >=
    MAX_CHARACTERS_PER_ACCOUNT
  ) {
    return reply.code(400).send({
      error: `Limite de ${MAX_CHARACTERS_PER_ACCOUNT} personagens por conta.`,
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.query('LOCK TABLES `players` WRITE');
    const [maxRows] = await conn.query(
      'SELECT COALESCE(MAX(`id`), 0) AS m FROM `players`'
    );
    const playerId =
      Number((maxRows as { m: number }[])[0]?.m ?? 0) + 1;
    const created = Math.floor(Date.now() / 1000);
    const row = buildPlayerRow({
      id: playerId,
      name: name.trim(),
      accountId,
      sex: sex as 0 | 1,
      townId,
      created,
    });
    await conn.query('INSERT INTO `players` SET ?', row);
    return { id: playerId, name: row.name };
  } finally {
    await conn.query('UNLOCK TABLES').catch(() => {});
    conn.release();
  }
});

const port = Number(process.env.PORT ?? 3847);
const host = process.env.HOST ?? '0.0.0.0';

try {
  await fastify.listen({ port, host });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
