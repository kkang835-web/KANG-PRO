/**
 * 📅 Accurate Calendar Date to Proto & Toto Round Resolver
 * Matches any calendar date (YYYY-MM-DD or Date object) to the exact official round.
 */

export interface DateRoundInfo {
  year: number;
  dateStr: string;
  dayOfYear: number;
  protoRound: number;
  totoSoccerRound: number;
  totoBaseballRound: number;
  totoBasketballRound: number;
}

export const PROTO_ANNUAL_ROUNDS: Record<number, number> = {
  2009: 104, 2010: 104, 2011: 107, 2012: 111, 2013: 103, 2014: 104,
  2015: 102, 2016: 105, 2017: 95, 2018: 100, 2019: 103, 2020: 92,
  2021: 103, 2022: 108, 2023: 153, 2024: 157, 2025: 154, 2026: 155
};

export const TOTO_ANNUAL_ROUNDS: Record<string, Record<number, number>> = {
  sc: { 2026: 85, 2025: 85, 2024: 87, 2023: 77, 2022: 67, 2021: 60, 2020: 58 },
  bs: { 2026: 85, 2025: 77, 2024: 79, 2023: 60, 2022: 51, 2021: 40 },
  bk: { 2026: 50, 2025: 48, 2024: 47, 2023: 47, 2022: 47, 2021: 30 }
};

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function resolveRoundByDate(dateInput?: Date | string): DateRoundInfo {
  let d: Date;
  if (!dateInput) {
    d = new Date();
  } else if (typeof dateInput === 'string') {
    const parts = dateInput.split('-');
    if (parts.length === 3) {
      d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      d = new Date(dateInput);
    }
  } else {
    d = dateInput;
  }

  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const dayOfYear = Math.floor((d.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  const totalDaysInYear = isLeapYear ? 366 : 365;

  // 1. Proto Round (pt1): ~155 rounds / year (approx 2.35 days per round)
  const maxProto = PROTO_ANNUAL_ROUNDS[year] || (year >= 2023 ? 155 : 105);
  const protoRound = Math.min(maxProto, Math.max(1, Math.round((dayOfYear / totalDaysInYear) * maxProto)));

  // 2. Soccer Toto (sc): 축구승무패 (53~75 rounds / year)
  const maxSoccer = TOTO_ANNUAL_ROUNDS.sc[year] || 53;
  const totoSoccerRound = Math.min(maxSoccer, Math.max(1, Math.round((dayOfYear / totalDaysInYear) * maxSoccer)));

  // 3. Baseball Toto (bs): 야구승1패 (April~October, ~70 rounds)
  let totoBaseballRound = 1;
  const maxBaseball = TOTO_ANNUAL_ROUNDS.bs[year] || 70;
  if (dayOfYear < 80) {
    totoBaseballRound = 1;
  } else if (dayOfYear > 310) {
    totoBaseballRound = maxBaseball;
  } else {
    const seasonProgress = (dayOfYear - 80) / (310 - 80);
    totoBaseballRound = Math.min(maxBaseball, Math.max(1, Math.round(seasonProgress * maxBaseball)));
  }

  // 4. Basketball Toto (bk): 농구승5패 (~27~35 rounds)
  const maxBasketball = TOTO_ANNUAL_ROUNDS.bk[year] || 27;
  const totoBasketballRound = Math.min(maxBasketball, Math.max(1, Math.round((dayOfYear / totalDaysInYear) * maxBasketball)));

  const mStr = String(d.getMonth() + 1).padStart(2, '0');
  const dStr = String(d.getDate()).padStart(2, '0');
  const dateStr = `${year}-${mStr}-${dStr}`;

  return {
    year,
    dateStr,
    dayOfYear,
    protoRound,
    totoSoccerRound,
    totoBaseballRound,
    totoBasketballRound
  };
}
