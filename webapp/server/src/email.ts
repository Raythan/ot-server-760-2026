/**
 * Envio de e-mail para redefinição de senha.
 * Transporte configurável: SMTP (nodemailer), Resend (HTTP) ou Web3Forms (legado).
 *
 * Escolha explícita: EMAIL_TRANSPORT=smtp|resend|web3forms|none
 * Se omitido: primeiro entre SMTP_HOST → RESEND_API_KEY → WEB3FORMS_ACCESS_KEY; senão none.
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

const SUBJECT = 'Redefinição de senha — Tenebra OT';

function buildText(resetUrl: string): string {
  return (
    `Pedido de redefinição de senha.\n\n` +
    `Se foi você, abra o link abaixo (válido por tempo limitado). Se não foi, ignore este aviso.\n\n` +
    `${resetUrl}\n`
  );
}

export type EmailLog = { warn: (o: object, msg?: string) => void };

export async function sendPasswordResetEmail(opts: {
  log: EmailLog;
  userEmail: string;
  resetUrl: string;
}): Promise<void> {
  const text = buildText(opts.resetUrl);
  const transport = resolveTransport();

  switch (transport) {
    case 'smtp':
      await sendViaSmtp(opts.log, opts.userEmail, text);
      return;
    case 'resend':
      await sendViaResend(opts.log, opts.userEmail, text);
      return;
    case 'web3forms':
      await sendViaWeb3Forms(opts.log, opts.userEmail, text);
      return;
    default:
      opts.log.warn(
        {
          userEmail: opts.userEmail,
          hint: 'Defina SMTP_*, RESEND_* ou WEB3FORMS_ACCESS_KEY (ver .env.example).',
        },
        'Nenhum transporte de e-mail configurado; link de redefinição não enviado.'
      );
  }
}

function resolveTransport(): 'smtp' | 'resend' | 'web3forms' | 'none' {
  const raw = process.env.EMAIL_TRANSPORT?.trim().toLowerCase();
  if (raw === 'none' || raw === 'off' || raw === 'disabled') return 'none';
  if (raw === 'smtp' || raw === 'resend' || raw === 'web3forms') return raw;
  if (raw) return 'none';

  if (process.env.SMTP_HOST?.trim()) return 'smtp';
  if (process.env.RESEND_API_KEY?.trim()) return 'resend';
  if (process.env.WEB3FORMS_ACCESS_KEY?.trim()) return 'web3forms';
  return 'none';
}

let smtpPool: Transporter | null = null;

function getSmtpTransporter(): Transporter {
  if (smtpPool) return smtpPool;
  const host = process.env.SMTP_HOST?.trim();
  if (!host) {
    throw new Error('SMTP_HOST em falta');
  }
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure =
    process.env.SMTP_SECURE === '1' ||
    process.env.SMTP_SECURE === 'true' ||
    port === 465;
  const user = process.env.SMTP_USER?.trim() ?? '';
  const pass = process.env.SMTP_PASSWORD ?? process.env.SMTP_PASS ?? '';

  smtpPool = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
  });
  return smtpPool;
}

async function sendViaSmtp(
  log: EmailLog,
  to: string,
  text: string
): Promise<void> {
  if (!process.env.SMTP_HOST?.trim()) {
    log.warn(
      {},
      'SMTP_HOST em falta (transporte SMTP). Ver .env.example (ex.: Brevo, Gmail).'
    );
    return;
  }
  const from =
    process.env.SMTP_FROM?.trim() ||
    (process.env.SMTP_USER?.trim()
      ? `"Tenebra OT — Contas" <${process.env.SMTP_USER.trim()}>`
      : undefined);
  if (!from) {
    log.warn(
      {},
      'SMTP_FROM ou SMTP_USER em falta; não é possível enviar o remetente.'
    );
    return;
  }
  try {
    const tx = getSmtpTransporter();
    await tx.sendMail({
      from,
      to,
      subject: SUBJECT,
      text,
      replyTo: to,
    });
  } catch (err) {
    log.warn({ err }, 'SMTP: falha ao enviar e-mail de redefinição de senha.');
  }
}

async function sendViaResend(
  log: EmailLog,
  to: string,
  text: string
): Promise<void> {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!key || !from) {
    log.warn(
      {},
      'RESEND_API_KEY ou RESEND_FROM em falta; não é possível usar Resend.'
    );
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: SUBJECT,
        text,
        reply_to: to,
      }),
    });
    const bodyText = await res.text();
    if (!res.ok) {
      log.warn(
        { status: res.status, body: bodyText.slice(0, 500) },
        'Resend: envio de redefinição falhou.'
      );
    }
  } catch (err) {
    log.warn({ err }, 'Resend: erro de rede ao enviar redefinição.');
  }
}

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

async function sendViaWeb3Forms(
  log: EmailLog,
  userEmail: string,
  text: string
): Promise<void> {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY ?? '';
  if (!accessKey) {
    log.warn(
      { userEmail },
      'WEB3FORMS_ACCESS_KEY não definido; e-mail não enviado.'
    );
    return;
  }

  const fromName =
    process.env.WEB3FORMS_FROM_NAME?.trim() || 'Tenebra OT — Contas';
  const body: Record<string, string> = {
    access_key: accessKey,
    subject: SUBJECT,
    from_name: fromName,
    email: userEmail,
    message: text,
  };
  if (process.env.WEB3FORMS_CCEMAIL_TO_SUBMITTER === '1') {
    body.ccemail = userEmail;
  }

  try {
    const res = await fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    const resText = await res.text();
    let data: unknown = null;
    try {
      data = resText ? JSON.parse(resText) : null;
    } catch {
      data = null;
    }
    const ok =
      res.ok &&
      typeof data === 'object' &&
      data !== null &&
      (data as { success?: boolean }).success === true;
    if (!ok) {
      log.warn(
        { status: res.status, body: resText.slice(0, 500) },
        'Web3Forms: envio de redefinição falhou ou resposta inesperada.'
      );
    }
  } catch (err) {
    log.warn({ err }, 'Web3Forms: erro de rede ao enviar redefinição.');
  }
}
