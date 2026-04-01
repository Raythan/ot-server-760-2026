import mysql from 'mysql2/promise';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST ?? '127.0.0.1',
      port: Number(process.env.MYSQL_PORT ?? 3306),
      user: process.env.MYSQL_USER ?? 'root',
      password:
        process.env.MYSQL_PASSWORD ??
        process.env.MYSQL_PASS ??
        '',
      database: process.env.MYSQL_DATABASE ?? 'tibia',
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return pool;
}
