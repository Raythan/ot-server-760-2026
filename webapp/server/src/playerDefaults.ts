/**
 * Premissa do servidor: vocação **None (0)** do nível 1 ao 8 (Rookgaard / aprendiz).
 * Personagens criados pela API entram como **nível 8** com stats coerentes com essa progressão
 * (`data/XML/vocations.xml`, vocation id="0": gainhp 5, gainmana 5, gaincap 10 por nível).
 *
 * A escolha de Sorcerer/Druid/Paladin/Knight é feita **no jogo** (NPC ou sistema do mapa), não na web.
 *
 * `Player::getExpForLevel` em `server/src/player.h`.
 */
export function getExpForLevel(lv: number): number {
  const l = lv - 1;
  return Number(
    (50n * BigInt(l) ** 3n -
      150n * BigInt(l) ** 2n +
      400n * BigInt(l)) /
      3n
  );
}

/** Após completar a faixa 1–8 em None, o personagem está no nível 8 (ainda vocação 0). */
const START_LEVEL = 8;

/** Vocation 0 em `vocations.xml`: gaincap, gainhp, gainmana (por subida de nível). */
const NONE_GAINS = { gainHp: 5, gainMana: 5, gainCap: 10 };

function statsNoneAtLevel8(): {
  level: number;
  experience: number;
  health: number;
  healthmax: number;
  mana: number;
  manamax: number;
  cap: number;
} {
  const steps = START_LEVEL - 1;
  const g = NONE_GAINS;
  const health = 150 + steps * g.gainHp;
  const mana = 0 + steps * g.gainMana;
  const capOz = 400 + steps * g.gainCap;
  const experience = getExpForLevel(START_LEVEL);
  return {
    level: START_LEVEL,
    experience,
    health,
    healthmax: health,
    mana,
    manamax: mana,
    cap: capOz,
  };
}

export function buildPlayerRow(params: {
  id: number;
  name: string;
  accountId: number;
  sex: 0 | 1;
  townId: number;
  created: number;
}): Record<string, string | number | Buffer> {
  const { id, name, accountId, sex, townId, created } = params;

  const vocation = 0;
  const st = statsNoneAtLevel8();
  const maglevel = 0;
  const looktype = vocationLooktype(vocation, sex);

  return {
    id,
    name,
    group_id: 1,
    account_id: accountId,
    level: st.level,
    vocation,
    health: st.health,
    healthmax: st.healthmax,
    experience: st.experience,
    lookbody: 0,
    lookfeet: 0,
    lookhead: 0,
    looklegs: 0,
    looktype,
    lookaddons: 0,
    lookmount: 0,
    ridingmount: 0,
    maglevel,
    mana: st.mana,
    manamax: st.manamax,
    manaspent: 0,
    soul: 100,
    town_id: townId,
    posx: 32369,
    posy: 32241,
    posz: 7,
    conditions: Buffer.alloc(0),
    cap: st.cap,
    sex,
    lastlogin: 0,
    lastip: 0,
    save: 1,
    skull: 0,
    skulltime: 0,
    lastlogout: 0,
    blessings: 0,
    onlinetime: 0,
    deletion: 0,
    balance: 0,
    offlinetraining_time: 43200,
    offlinetraining_skill: -1,
    skill_fist: 10,
    skill_fist_tries: 0,
    skill_club: 10,
    skill_club_tries: 0,
    skill_sword: 10,
    skill_sword_tries: 0,
    skill_axe: 10,
    skill_axe_tries: 0,
    skill_dist: 10,
    skill_dist_tries: 0,
    skill_shielding: 10,
    skill_shielding_tries: 0,
    skill_fishing: 10,
    skill_fishing_tries: 0,
    deleted: 0,
    created,
    hidden: 0,
    comment: '',
  };
}

function vocationLooktype(vocation: number, sex: 0 | 1): number {
  if (vocation === 0) return sex === 1 ? 130 : 136;
  if (vocation === 1 || vocation === 2) return 130;
  if (vocation === 3) return 129;
  if (vocation === 4) return 131;
  return 130;
}

export const ALLOWED_TOWN_IDS = [1, 11] as const;
