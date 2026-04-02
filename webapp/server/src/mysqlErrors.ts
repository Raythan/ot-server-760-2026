/**
 * Mapeia erros do mysql2 / rede para HTTP e mensagens legíveis (evita 500 genérico).
 */
export function mapMysqlOrSystemError(err: unknown): {
  status: number;
  message: string;
  detail?: string;
} | null {
  if (!(err instanceof Error)) return null;

  const e = err as Error & {
    code?: string;
    errno?: number;
    sqlMessage?: string;
  };

  const sys = e.code;
  if (sys === 'ECONNREFUSED' || sys === 'ETIMEDOUT' || sys === 'ENOTFOUND') {
    return {
      status: 503,
      message:
        'Não foi possível conectar ao MySQL. Confirme que o serviço está em execução e as variáveis MYSQL_* no arquivo webapp/server/.env.',
    };
  }

  const combinedMsg = `${e.sqlMessage ?? ''} ${e.message ?? ''}`.toLowerCase();
  if (combinedMsg.includes('access denied')) {
    return {
      status: 503,
      message:
        'Acesso negado ao MySQL: MYSQL_USER ou MYSQL_PASSWORD em webapp/server/.env não batem com o servidor (ex.: root sem senha no .env, mas senha definida no instalador; ou tente MYSQL_HOST=localhost no Windows em vez de 127.0.0.1).',
      detail: e.sqlMessage ?? e.message,
    };
  }

  const errno = e.errno;
  const sqlCode = e.code;

  if (errno === 1045 || sqlCode === 'ER_ACCESS_DENIED_ERROR') {
    return {
      status: 503,
      message:
        'Acesso negado ao MySQL (usuário ou senha incorretos no .env).',
      detail: e.sqlMessage ?? e.message,
    };
  }
  if (errno === 1049 || sqlCode === 'ER_BAD_DB_ERROR') {
    return {
      status: 503,
      message: 'O banco definido em MYSQL_DATABASE não existe.',
    };
  }
  if (errno === 1062 || sqlCode === 'ER_DUP_ENTRY') {
    return {
      status: 409,
      message:
        'Este e-mail já está associado a uma conta ou ocorreu um conflito de dados.',
    };
  }
  if (errno === 1146 || sqlCode === 'ER_NO_SUCH_TABLE') {
    return {
      status: 503,
      message:
        'Tabela ausente no banco (schema incompatível com o esperado).',
      detail: e.sqlMessage,
    };
  }
  if (errno === 1054 || sqlCode === 'ER_BAD_FIELD_ERROR') {
    const detail = e.sqlMessage ?? e.message;
    const d = detail.toLowerCase();
    if (
      d.includes('web_pwreset_') ||
      d.includes('web_recovery_') ||
      d.includes('web_recovery_keys_initialized')
    ) {
      return {
        status: 503,
        message:
          'Falta aplicar a migração SQL da recuperação de senha/chaves do webapp.',
        detail:
          'Execute webapp/server/sql/alter-accounts-web-recovery.sql na base MYSQL_DATABASE.',
      };
    }
    return {
      status: 500,
      message: 'Coluna ausente no banco (schema incompatível com o esperado).',
      detail,
    };
  }
  if (errno === 1136 || sqlCode === 'ER_WRONG_VALUE_COUNT_ON_ROW') {
    return {
      status: 500,
      message:
        'Erro no registro: a tabela accounts não tem a estrutura esperada pelo servidor.',
      detail: e.sqlMessage,
    };
  }
  if (
    errno === 1364 ||
    sqlCode === 'ER_NO_DEFAULT_FOR_FIELD' ||
    errno === 1292 ||
    sqlCode === 'ER_TRUNCATED_WRONG_VALUE'
  ) {
    return {
      status: 500,
      message: 'Erro ao inserir no banco (valor ou coluna incompatível).',
      detail: e.sqlMessage,
    };
  }

  if (sqlCode?.startsWith('ER_') || (errno !== undefined && errno > 0)) {
    return {
      status: 500,
      message: 'Erro ao executar operação no banco de dados.',
      detail: e.sqlMessage ?? e.message,
    };
  }

  return null;
}
