import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { getPool } from './db.js';
import { sha1Password } from './crypto.js';
import { buildPlayerRow, ALLOWED_TOWN_IDS } from './playerDefaults.js';
import { mapMysqlOrSystemError } from './mysqlErrors.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-only-change-JWT_SECRET';

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
      new Error('A palavra-passe deve ter entre 6 e 48 caracteres.'),
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
        'Indique um endereço de e-mail válido para recuperação da palavra-passe.'
      ),
      {
        statusCode: 400,
      }
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
    throw Object.assign(
      new Error(
        'Indique um endereço de e-mail válido para recuperação da palavra-passe.'
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
    const [rows] = await pool.query(
      'SELECT `id`, `password` FROM `accounts` WHERE LOWER(`email`) = LOWER(?) LIMIT 1',
      [email]
    );
    const row = (rows as { id: number; password: string }[])[0];
    if (!row || row.password !== hash) {
      return reply
        .code(401)
        .send({ error: 'E-mail ou palavra-passe incorretos.' });
    }
    const token = signToken(row.id);
    return { token, accountId: row.id };
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
      online: Number(r.online) === 1,
    })),
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
