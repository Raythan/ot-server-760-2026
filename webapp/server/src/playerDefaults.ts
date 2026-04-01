/**
 * Defaults alinhados a exemplos em database.sql (Thais, town_id 1).
 * sex: 0 female, 1 male (guardado como int no MySQL — compatível com TFS).
 */
export function buildPlayerRow(params: {
  id: number;
  name: string;
  accountId: number;
  sex: 0 | 1;
  vocation: number;
  townId: number;
  created: number;
}): Record<string, string | number | Buffer> {
  const { id, name, accountId, sex, vocation, townId, created } = params;

  const level = 1;
  const isRook = vocation === 0;
  const health = isRook ? 150 : 150;
  const healthmax = health;
  const experience = 0;
  const maglevel = 0;
  const mana = isRook ? 0 : 0;
  const manamax = mana;
  const cap = isRook ? 400 : 400;
  const looktype = vocationLooktype(vocation, sex);

  return {
    id,
    name,
    group_id: 1,
    account_id: accountId,
    level,
    vocation,
    health,
    healthmax,
    experience,
    lookbody: 0,
    lookfeet: 0,
    lookhead: 0,
    looklegs: 0,
    looktype,
    lookaddons: 0,
    lookmount: 0,
    ridingmount: 0,
    maglevel,
    mana,
    manamax,
    manaspent: 0,
    soul: isRook ? 100 : 0,
    town_id: townId,
    posx: 32369,
    posy: 32241,
    posz: 7,
    conditions: Buffer.alloc(0),
    cap,
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
export const ALLOWED_VOCATIONS = [0, 1, 2, 3, 4] as const;
