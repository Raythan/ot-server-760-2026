import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { apiJson } from './api.ts';
import {
  type CharRow,
  getAccountIdFromJwt,
  invalidateCharactersCache,
  readCharactersCache,
  writeCharactersCache,
} from './charactersCache.ts';

registerSW({ immediate: true });

const TOKEN_KEY = 'ot_jwt';
const GAME_TITLE = 'Tenebra OT';

/** Nomes de vocação alinhados a `server/data/XML/vocations.xml` (lista de personagens em inglês). */
const VOCATION_LABELS: Record<number, string> = {
  0: 'No Vocation',
  1: 'Sorcerer',
  2: 'Druid',
  3: 'Paladin',
  4: 'Knight',
  5: 'Master Sorcerer',
  6: 'Elder Druid',
  7: 'Royal Paladin',
  8: 'Elite Knight',
};

const DEFAULT_CHAR_LIMIT = 50;

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(t: string | null): void {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

let tab: 'register' | 'login' | 'chars' | 'forgot' = 'login';
/** Subfluxo em Esqueci minha senha: só e-mail ou e-mail + chave. */
let forgotSub: 'email' | 'emailKey' = 'email';
/** Token de redefinição vindo da resposta API (e-mail + chave), não da URL. */
let resetTokenOverride: string | null = null;
/** Chaves mostradas uma vez após o primeiro login com geração. */
let recoveryKeysModal: string[] | null = null;

const GENERIC_FORGOT_TOAST =
  'Se esse e-mail constar nos nossos registros, você receberá um link para redefinição de senha. Lembre-se de verificar a caixa de spam, lixeira, etc.';

function getUrlResetToken(): string | null {
  return new URLSearchParams(window.location.search).get('redefinir');
}

function clearUrlResetParam(): void {
  const u = new URL(window.location.href);
  if (!u.searchParams.has('redefinir')) return;
  u.searchParams.delete('redefinir');
  const q = u.searchParams.toString();
  window.history.replaceState({}, '', `${u.pathname}${q ? `?${q}` : ''}${u.hash}`);
}

function activeResetToken(): string | null {
  return resetTokenOverride ?? getUrlResetToken();
}

const TOAST_DURATION_MS = 4200;
let toastHideTimer: ReturnType<typeof setTimeout> | null = null;
let toastRemoveTimer: ReturnType<typeof setTimeout> | null = null;

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

/** Mensagem temporária (não ocupa o fluxo da página; some sozinha). */
function showToast(message: string, kind: 'info' | 'error' = 'info'): void {
  const root = document.getElementById('toast-root');
  if (!root || !message.trim()) return;
  if (toastHideTimer) clearTimeout(toastHideTimer);
  if (toastRemoveTimer) clearTimeout(toastRemoveTimer);

  root.innerHTML = '';
  const el = document.createElement('div');
  el.className = `toast toast--${kind}`;
  el.setAttribute('role', 'status');
  el.textContent = message;
  root.appendChild(el);

  requestAnimationFrame(() => {
    el.classList.add('toast--visible');
  });

  toastHideTimer = setTimeout(() => {
    el.classList.remove('toast--visible');
    toastRemoveTimer = setTimeout(() => {
      el.remove();
      toastHideTimer = null;
      toastRemoveTimer = null;
    }, 320);
  }, TOAST_DURATION_MS);
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function updateCharLimitUI(
  app: HTMLElement,
  count: number,
  limit: number
): void {
  const countEl = app.querySelector('#char-count');
  const hint = app.querySelector('#char-limit-hint') as HTMLElement | null;
  const form = app.querySelector('#form-char') as HTMLFormElement | null;
  const submitBtn = form?.querySelector(
    'button[type="submit"]'
  ) as HTMLButtonElement | null;
  if (countEl) {
    countEl.textContent = count > 0 ? `(${count}/${limit})` : '';
  }
  const atLimit = count >= limit;
  if (hint) {
    hint.textContent = atLimit
      ? 'Limite de personagens atingido nesta conta.'
      : '';
    hint.hidden = !atLimit;
  }
  if (submitBtn) submitBtn.disabled = atLimit;
  form?.querySelectorAll('input, select').forEach((el) => {
    (el as HTMLInputElement | HTMLSelectElement).disabled = atLimit;
  });
}

function renderCharacterList(
  app: HTMLElement,
  token: string,
  characters: CharRow[],
  limit: number
): void {
  const listEl = app.querySelector('#char-list');
  if (!listEl) return;

  updateCharLimitUI(app, characters.length, limit);

  if (characters.length === 0) {
    listEl.innerHTML =
      '<p class="muted">Ainda não tem personagens. Utilize o formulário abaixo para criar o primeiro.</p>';
    return;
  }
  const rows = characters
    .map((c) => {
      const voc = VOCATION_LABELS[c.vocation] ?? `voc. ${c.vocation}`;
      const statusClass = c.online ? 'status-online' : 'status-offline';
      const statusText = c.online ? 'Online' : 'Offline';
      const delBtn = c.online
        ? `<button type="button" class="btn-del" disabled title="Termine a sessão no cliente para eliminar">Eliminar</button>`
        : `<button type="button" class="btn-del" data-id="${c.id}">Eliminar</button>`;
      return `<li class="char-row">
          <div class="char-main">
            <span class="name">${esc(c.name)}</span>
            <span class="meta">${esc(voc)} · nível ${c.level}</span>
            <span class="status ${statusClass}">${statusText}</span>
          </div>
          <div class="char-actions">${delBtn}</div>
        </li>`;
    })
    .join('');
  listEl.innerHTML = `<ul class="char-ul">${rows}</ul>`;

  listEl.querySelectorAll('.btn-del[data-id]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number((btn as HTMLButtonElement).dataset.id);
      if (!Number.isFinite(id)) return;
      if (
        !confirm(
          'Eliminar este personagem? Esta ação não pode ser desfeita.'
        )
      ) {
        return;
      }
      try {
        await apiJson(`/api/characters/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        invalidateCharactersCache();
        showToast('Personagem eliminado.');
        render();
      } catch (err) {
        showToast(
          err instanceof Error
            ? err.message
            : 'Não foi possível eliminar o personagem.',
          'error'
        );
        render();
      }
    });
  });
}

async function loadCharacters(
  app: HTMLElement,
  token: string,
  options?: { force?: boolean }
): Promise<void> {
  const listEl = app.querySelector('#char-list');
  if (!listEl) return;

  const accountId = getAccountIdFromJwt(token);
  if (accountId === null) {
    listEl.innerHTML =
      '<p class="err">Sessão inválida. Inicie sessão novamente.</p>';
    return;
  }

  if (!options?.force) {
    const cached = readCharactersCache(accountId);
    if (cached !== null) {
      renderCharacterList(app, token, cached.characters, cached.limit);
      return;
    }
  }

  listEl.innerHTML = '<p class="muted">A carregar…</p>';
  try {
    const data = await apiJson<{
      characters: CharRow[];
      limit?: number;
    }>('/api/characters', { headers: { Authorization: `Bearer ${token}` } });
    const characters = data.characters ?? [];
    const limit = data.limit ?? DEFAULT_CHAR_LIMIT;
    writeCharactersCache(accountId, characters, limit);
    renderCharacterList(app, token, characters, limit);
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Não foi possível carregar a lista de personagens.';
    listEl.innerHTML = `<p class="err">${esc(msg)}</p>`;
  }
}

function render(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;

  const resetTok = activeResetToken();
  const token = getToken();
  if (resetTok && token) {
    invalidateCharactersCache();
    setToken(null);
  }

  if (token) {
    if (tab === 'register' || tab === 'login' || tab === 'forgot') tab = 'chars';
  } else if (tab === 'chars') {
    tab = 'login';
  }

  const tabsGuestNormal = `
        <button type="button" class="${tab === 'register' ? 'active' : ''}" data-tab="register">Criar conta</button>
        <button type="button" class="${tab === 'login' ? 'active' : ''}" data-tab="login">Entrar</button>`;
  const tabsGuestForgot = `
        <button type="button" class="active" data-tab="forgot">Recuperar senha</button>
        <button type="button" data-tab="login">Entrar</button>`;
  const tabsAuthed = `
        <button type="button" class="${tab === 'chars' ? 'active' : ''}" data-tab="chars">Personagens</button>`;

  let nav: string;
  if (token) {
    nav = `
    <nav class="nav">
      <div class="tabs">
        ${tabsAuthed}
      </div>
      <button type="button" class="btn ghost" id="logout">Terminar sessão</button>
    </nav>`;
  } else if (tab === 'forgot') {
    nav = `
    <nav class="nav">
      <div class="tabs">
        ${tabsGuestForgot}
      </div>
    </nav>`;
  } else {
    nav = `
    <nav class="nav">
      <div class="tabs">
        ${tabsGuestNormal}
      </div>
    </nav>`;
  }

  let body = '';

  if (resetTok) {
    body = `
      <section class="card">
        <h1>Nova senha</h1>
        <p class="hint">Defina a nova senha para a sua conta no <strong>${esc(GAME_TITLE)}</strong> (mesma senha no cliente OT).</p>
        <form id="form-reset-pw" novalidate>
          <label>Nova senha <input name="password" type="password" required minlength="6" maxlength="48" autocomplete="new-password" /></label>
          <label>Confirmar <input name="password2" type="password" required minlength="6" maxlength="48" autocomplete="new-password" /></label>
          <p id="reset-err" class="field-err" hidden></p>
          <button type="submit">Guardar nova senha</button>
        </form>
      </section>
    `;
  } else if (tab === 'register') {
    body = `
      <section class="card">
        <h1>Criar conta</h1>
        <p class="hint">Indique o endereço de <strong>e-mail</strong> para recuperação da <strong>senha</strong>, caso a esqueça. Defina a senha e confirme-a.</p>
        <form id="form-register" novalidate>
          <label>E-mail <input name="email" type="email" required maxlength="255" autocomplete="email" placeholder="exemplo@dominio.pt" /></label>
          <label>Senha <input name="password" type="password" required minlength="6" maxlength="48" autocomplete="new-password" /></label>
          <label>Confirmar senha <input name="password2" type="password" required minlength="6" maxlength="48" autocomplete="new-password" /></label>
          <p id="reg-err" class="field-err" hidden></p>
          <button type="submit">Criar conta</button>
        </form>
      </section>
    `;
  } else if (tab === 'login') {
    body = `
      <section class="card">
        <h1>Entrar</h1>
        <p class="hint">Utilize o mesmo <strong>e-mail</strong> e <strong>senha</strong> do registo para gerir personagens e para entrar no <strong>${esc(GAME_TITLE)}</strong> no cliente.</p>
        <form id="form-login">
          <label>E-mail <input name="email" type="email" required maxlength="255" autocomplete="username" /></label>
          <label>Senha <input name="password" type="password" required minlength="6" maxlength="48" autocomplete="current-password" /></label>
          <p class="forgot-row"><button type="button" class="btn-link" id="go-forgot">Esqueci minha senha</button></p>
          <button type="submit">Entrar</button>
        </form>
      </section>
    `;
  } else if (tab === 'forgot') {
    const keyField =
      forgotSub === 'emailKey'
        ? '<label>Chave de recuperação <input name="recoveryKey" type="text" required autocomplete="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX" /></label>'
        : '';
    body = `
      <section class="card">
        <h1>Esqueci minha senha</h1>
        <p class="hint">Pode pedir um <strong>link por e-mail</strong> ou, se tiver uma <strong>chave de recuperação</strong>, combinar com o e-mail para redefinir aqui.</p>
        <div class="forgot-modes" role="tablist">
          <button type="button" class="${forgotSub === 'email' ? 'active' : ''}" data-forgot-sub="email" role="tab">Só e-mail</button>
          <button type="button" class="${forgotSub === 'emailKey' ? 'active' : ''}" data-forgot-sub="emailKey" role="tab">E-mail e chave</button>
        </div>
        <form id="form-forgot">
          <label>E-mail <input name="email" type="email" required maxlength="255" autocomplete="email" /></label>
          ${keyField}
          <button type="submit">${forgotSub === 'email' ? 'Enviar pedido' : 'Continuar para nova senha'}</button>
        </form>
      </section>
    `;
  } else {
    body = `
      <section class="card">
        <div class="chars-head">
          <h1>Personagens <span id="char-count" class="muted char-count"></span></h1>
          <button type="button" class="btn ghost btn-sm" id="char-refresh">Atualizar lista</button>
        </div>
        <p id="char-limit-hint" class="field-err" hidden></p>
        <div id="char-list" class="char-list"><p class="muted">A carregar…</p></div>
        <div id="create-char-wrap" class="create-wrap">
          <form id="form-char">
            <label>Nome do personagem <input name="name" required minlength="3" maxlength="29" pattern="[A-Za-z]+(?: [A-Za-z]+)*" title="Apenas letras e um espaço entre palavras" autocomplete="off" /></label>
            <label>Sexo
              <select name="sex">
                <option value="1">Masculino</option>
                <option value="0">Feminino</option>
              </select>
            </label>
            <button type="submit">Criar personagem</button>
          </form>
        </div>
      </section>
    `;
  }

  const keysList =
    recoveryKeysModal && recoveryKeysModal.length > 0
      ? recoveryKeysModal
          .map(
            (k, i) =>
              `<li>
                <span class="recovery-idx">${i + 1}.</span>
                <code class="recovery-code">${esc(k)}</code>
                <button type="button" class="btn-copy-key" data-copy-key="${esc(k)}" aria-label="Copiar chave ${i + 1}">Copiar</button>
              </li>`
          )
          .join('')
      : '';

  const recoveryModal =
    recoveryKeysModal && recoveryKeysModal.length > 0
      ? `<div class="modal-overlay" id="recovery-modal" role="dialog" aria-modal="true" aria-labelledby="recovery-title">
        <div class="modal-card card">
          <h2 id="recovery-title">Chaves de recuperação</h2>
          <div class="recovery-alert" role="alert">
            <p>❗❗ Atenção: este é o único momento em que estas chaves serão exibidas.</p>
            <p>❗ Guarde agora em um local seguro para não perder acesso à conta.</p>
          </div>
          <p class="hint">Guarde estas <strong>5 chaves</strong> em local seguro (como no Tibia global). Cada chave só pode ser usada uma vez para recuperar a conta com o e-mail.</p>
          <ol class="recovery-list">${keysList}</ol>
          <button type="button" class="btn-copy-all" id="recovery-copy-all">Copiar todas as chaves</button>
          <button type="button" class="btn primary" id="recovery-dismiss">Guardei as chaves</button>
        </div>
      </div>`
      : '';

  const footer = `<footer class="site-footer"><p>${esc(GAME_TITLE)}</p></footer>`;

  app.innerHTML = `${nav}<main class="main">${body}</main>${footer}${recoveryModal}`;

  app.querySelectorAll('[data-tab]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const t = (e.currentTarget as HTMLElement).dataset.tab;
      if (
        t === 'register' ||
        t === 'login' ||
        t === 'chars' ||
        t === 'forgot'
      ) {
        if (t === 'chars' && !getToken()) return;
        if ((t === 'register' || t === 'login') && activeResetToken()) {
          resetTokenOverride = null;
          clearUrlResetParam();
        }
        tab = t as typeof tab;
        render();
      }
    });
  });

  app.querySelectorAll('[data-forgot-sub]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const s = (e.currentTarget as HTMLElement).dataset.forgotSub;
      if (s === 'email' || s === 'emailKey') {
        forgotSub = s;
        render();
      }
    });
  });

  app.querySelector('#go-forgot')?.addEventListener('click', () => {
    tab = 'forgot';
    render();
  });

  app.querySelector('#recovery-dismiss')?.addEventListener('click', () => {
    recoveryKeysModal = null;
    render();
  });

  app.querySelector('#recovery-copy-all')?.addEventListener('click', async () => {
    if (!recoveryKeysModal || recoveryKeysModal.length === 0) return;
    const txt = recoveryKeysModal
      .map((k, i) => `${i + 1}. ${k}`)
      .join('\n');
    const ok = await copyToClipboard(txt);
    showToast(ok ? 'Todas as chaves foram copiadas.' : 'Não foi possível copiar.', ok ? 'info' : 'error');
  });

  app.querySelectorAll<HTMLButtonElement>('.btn-copy-key[data-copy-key]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const key = btn.dataset.copyKey ?? '';
      if (!key) return;
      const ok = await copyToClipboard(key);
      showToast(ok ? 'Chave copiada.' : 'Não foi possível copiar.', ok ? 'info' : 'error');
    });
  });

  app.querySelector('#logout')?.addEventListener('click', () => {
    invalidateCharactersCache();
    setToken(null);
    tab = 'login';
    showToast('Sessão terminada.');
    render();
  });

  app.querySelector('#form-reset-pw')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rt = activeResetToken();
    if (!rt) {
      render();
      return;
    }
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const password = String(fd.get('password') ?? '');
    const password2 = String(fd.get('password2') ?? '');
    const errEl = app.querySelector('#reset-err') as HTMLElement | null;
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = '';
    }
    if (password !== password2) {
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = 'As senhas não coincidem.';
      }
      return;
    }
    try {
      await apiJson('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: rt, password }),
      });
      resetTokenOverride = null;
      clearUrlResetParam();
      tab = 'login';
      showToast('Senha alterada. Pode entrar com a nova senha.');
      render();
    } catch (err) {
      render();
      showToast(
        err instanceof Error
          ? err.message
          : 'Não foi possível redefinir a senha.',
        'error'
      );
    }
  });

  app.querySelector('#form-forgot')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = String(fd.get('email') ?? '').trim();
    const recoveryKey = String(fd.get('recoveryKey') ?? '').trim();
    const payload: { email: string; recoveryKey?: string } = { email };
    if (forgotSub === 'emailKey') {
      payload.recoveryKey = recoveryKey;
    }
    try {
      const res = await apiJson<{
        message: string;
        resetToken?: string | null;
      }>('/api/forgot-password', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      showToast(GENERIC_FORGOT_TOAST, 'info');
      if (forgotSub === 'emailKey' && res.resetToken) {
        resetTokenOverride = res.resetToken;
        tab = 'login';
        render();
        return;
      }
    } catch (err) {
      render();
      showToast(
        err instanceof Error ? err.message : 'Pedido não concluído.',
        'error'
      );
    }
  });

  app.querySelector('#form-register')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    const password2 = String(fd.get('password2') ?? '');
    const errEl = app.querySelector('#reg-err') as HTMLElement | null;
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = '';
    }
    if (password !== password2) {
      if (errEl) {
        errEl.hidden = false;
        errEl.textContent = 'As senhas não coincidem.';
      }
      return;
    }
    try {
      const r = await apiJson<{ accountId: number; token: string }>(
        '/api/register',
        {
          method: 'POST',
          body: JSON.stringify({ password, email }),
        }
      );
      invalidateCharactersCache();
      setToken(r.token);
      tab = 'chars';
      render();
      showToast(
        `Conta criada no ${GAME_TITLE}. Use o mesmo e-mail e senha no cliente (OTClient) para listar personagens e jogar.`
      );
    } catch (err) {
      render();
      showToast(
        err instanceof Error
          ? err.message
          : 'Não foi possível criar a conta.',
        'error'
      );
    }
  });

  app.querySelector('#form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    try {
      const r = await apiJson<{
        token: string;
        accountId: number;
        recoveryKeys?: string[] | null;
      }>('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      invalidateCharactersCache();
      setToken(r.token);
      tab = 'chars';
      if (r.recoveryKeys && r.recoveryKeys.length > 0) {
        recoveryKeysModal = r.recoveryKeys;
      }
      render();
      showToast('Sessão iniciada.');
    } catch (err) {
      render();
      showToast(
        err instanceof Error ? err.message : 'Não foi possível iniciar sessão.',
        'error'
      );
    }
  });

  if (tab === 'chars' && token) {
    void loadCharacters(app, token);
    app.querySelector('#char-refresh')?.addEventListener('click', () => {
      void loadCharacters(app, token, { force: true });
    });
    app.querySelector('#form-char')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target as HTMLFormElement;
      const fd = new FormData(form);
      const name = String(fd.get('name') ?? '').trim();
      const sex = Number(fd.get('sex'));
      try {
        await apiJson('/api/characters', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name, sex }),
        });
        invalidateCharactersCache();
        render();
        showToast(`Personagem «${name}» criado com sucesso.`);
      } catch (err) {
        render();
        showToast(
          err instanceof Error
            ? err.message
            : 'Não foi possível criar o personagem.',
          'error'
        );
      }
    });
  }
}

render();
