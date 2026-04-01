import './style.css';
import { registerSW } from 'virtual:pwa-register';
import { apiJson } from './api.ts';

registerSW({ immediate: true });

const TOKEN_KEY = 'ot_jwt';
const GAME_TITLE = 'Tenebra OT';

type CharRow = {
  id: number;
  name: string;
  level: number;
  vocation: number;
  online: boolean;
};

/** Rótulos para IDs de vocação TFS (0 = None / aprendiz até escolher classe no jogo). */
const VOCATION_LABELS: Record<number, string> = {
  0: 'Aprendiz',
  1: 'Feiticeiro',
  2: 'Druida',
  3: 'Paladino',
  4: 'Cavaleiro',
};

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(t: string | null): void {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
}

let flash = '';
let tab: 'register' | 'login' | 'chars' = 'login';

function esc(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function render(): void {
  const app = document.querySelector<HTMLDivElement>('#app');
  if (!app) return;
  const token = getToken();
  if (token) {
    if (tab === 'register' || tab === 'login') tab = 'chars';
  } else if (tab === 'chars') {
    tab = 'login';
  }

  const flashHtml = flash
    ? `<p class="flash" role="status">${esc(flash)}</p>`
    : '';

  const nav = `
    <nav class="nav">
      <a href="#" class="brand">${esc(GAME_TITLE)}</a>
      <div class="tabs">
        <button type="button" class="${tab === 'register' ? 'active' : ''}" data-tab="register">Criar conta</button>
        <button type="button" class="${tab === 'login' ? 'active' : ''}" data-tab="login">Entrar</button>
        <button type="button" class="${tab === 'chars' ? 'active' : ''}" data-tab="chars" ${!token ? 'disabled' : ''}>Personagens</button>
      </div>
      ${token ? '<button type="button" class="btn ghost" id="logout">Terminar sessão</button>' : ''}
    </nav>
  `;

  let body = '';
  if (tab === 'register') {
    body = `
      <section class="card">
        <h1>Criar conta</h1>
        <p class="hint">Indique o endereço de <strong>e-mail</strong> para recuperação da <strong>palavra-passe</strong>, caso a esqueça. Defina a palavra-passe e confirme-a.</p>
        <form id="form-register" novalidate>
          <label>E-mail <input name="email" type="email" required maxlength="255" autocomplete="email" placeholder="exemplo@dominio.pt" /></label>
          <label>Palavra-passe <input name="password" type="password" required minlength="6" maxlength="48" autocomplete="new-password" /></label>
          <label>Confirmar palavra-passe <input name="password2" type="password" required minlength="6" maxlength="48" autocomplete="new-password" /></label>
          <p id="reg-err" class="field-err" hidden></p>
          <button type="submit">Criar conta</button>
        </form>
      </section>
    `;
  } else if (tab === 'login') {
    body = `
      <section class="card">
        <h1>Entrar</h1>
        <p class="hint">Utilize o mesmo <strong>e-mail</strong> e <strong>palavra-passe</strong> do registo para gerir personagens e para entrar no <strong>${esc(GAME_TITLE)}</strong> no cliente.</p>
        <form id="form-login">
          <label>E-mail <input name="email" type="email" required maxlength="255" autocomplete="username" /></label>
          <label>Palavra-passe <input name="password" type="password" required minlength="6" maxlength="48" autocomplete="current-password" /></label>
          <button type="submit">Entrar</button>
        </form>
      </section>
    `;
  } else {
    body = `
      <section class="card">
        <h1>Personagens</h1>
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

  const footer = `<footer class="site-footer"><p>${esc(GAME_TITLE)}</p></footer>`;

  app.innerHTML = `${nav}<main class="main">${flashHtml}${body}</main>${footer}`;

  app.querySelectorAll('[data-tab]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const t = (e.currentTarget as HTMLElement).dataset.tab;
      if (t === 'register' || t === 'login' || t === 'chars') {
        if (t === 'chars' && !getToken()) return;
        tab = t;
        flash = '';
        render();
      }
    });
  });

  app.querySelector('#logout')?.addEventListener('click', () => {
    setToken(null);
    tab = 'login';
    flash = 'Sessão terminada.';
    render();
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
        errEl.textContent = 'As palavras-passe não coincidem.';
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
      setToken(r.token);
      flash = `Conta criada no ${GAME_TITLE}. Use o mesmo e-mail e palavra-passe no cliente (OTClient) para listar personagens e jogar.`;
      tab = 'chars';
      render();
    } catch (err) {
      flash =
        err instanceof Error
          ? err.message
          : 'Não foi possível criar a conta.';
      render();
    }
  });

  app.querySelector('#form-login')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const email = String(fd.get('email') ?? '').trim();
    const password = String(fd.get('password') ?? '');
    try {
      const r = await apiJson<{ token: string; accountId: number }>(
        '/api/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        }
      );
      setToken(r.token);
      flash = 'Sessão iniciada.';
      tab = 'chars';
      render();
    } catch (err) {
      flash =
        err instanceof Error ? err.message : 'Não foi possível iniciar sessão.';
      render();
    }
  });

  if (tab === 'chars' && token) {
    void loadCharacters(app, token);
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
        flash = `Personagem «${name}» criado com sucesso.`;
        render();
      } catch (err) {
        flash =
          err instanceof Error
            ? err.message
            : 'Não foi possível criar o personagem.';
        render();
      }
    });
  }
}

async function loadCharacters(app: HTMLElement, token: string): Promise<void> {
  const listEl = app.querySelector('#char-list');
  if (!listEl) return;
  try {
    const { characters } = await apiJson<{ characters: CharRow[] }>(
      '/api/characters',
      { headers: { Authorization: `Bearer ${token}` } }
    );
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
          flash = 'Personagem eliminado.';
          render();
        } catch (err) {
          flash =
            err instanceof Error
              ? err.message
              : 'Não foi possível eliminar o personagem.';
          render();
        }
      });
    });
  } catch {
    listEl.innerHTML =
      '<p class="err">Não foi possível carregar a lista. Inicie sessão novamente.</p>';
  }
}

render();
