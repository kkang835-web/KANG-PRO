/**
 * SofaScore Lineup Normalizer Utility for Quant Model
 * Cleans player names, unifies position codes, and normalizes jersey numbers
 * into a standardized JSON format consumable by the quant prediction engine.
 */

import { resolvePlayerCountry } from './playerNationalityResolver';

export interface NormalizedQuantPlayerRecord {
  id?: number | string;
  name: string;
  shortName?: string;
  cleanName: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  detailedPosition: string;
  shirtNumber: number;
  isCaptain: boolean;
  isAce: boolean;
  rating: number;
  quantWeight: number;
  countryCode?: string;
  countryName?: string;
  imageLink?: string;
}

export interface NormalizedMatchLineupPayload {
  isOfficialConfirmed?: boolean;
  homeTeam: string;
  awayTeam: string;
  homeFormation: string;
  awayFormation: string;
  homeStarters: NormalizedQuantPlayerRecord[];
  awayStarters: NormalizedQuantPlayerRecord[];
  homeSubstitutes: NormalizedQuantPlayerRecord[];
  awaySubstitutes: NormalizedQuantPlayerRecord[];
  quantModelInputSummary: {
    homeAvgRating: number;
    awayAvgRating: number;
    homeWeightedScore: number;
    awayWeightedScore: number;
  };
}

/**
 * Normalizes player name: trims whitespace, removes unusual control characters or excessive symbols,
 * while preserving valid English/Korean/Diacritic characters.
 */
export function sanitizePlayerName(rawName: string): { name: string; cleanName: string } {
  if (!rawName || typeof rawName !== 'string') {
    return { name: 'Unknown', cleanName: 'unknown' };
  }
  const trimmed = rawName.trim().replace(/[\s\t\n]+/g, ' ');
  // Remove invisible unicode characters and normalize
  const clean = trimmed
    .normalize('NFC')
    .replace(/[^\w\s\-.,'À-ÿ가-힣]/gi, '')
    .trim();

  return {
    name: trimmed,
    cleanName: clean.toLowerCase()
  };
}

/**
 * Unifies various position strings into standard tactical categories (GK, DF, MF, FW)
 * and returns detailed position designation.
 */
export function unifyPositionCode(rawPos: string): { position: 'GK' | 'DF' | 'MF' | 'FW'; detailedPosition: string } {
  if (!rawPos || typeof rawPos !== 'string') {
    return { position: 'MF', detailedPosition: 'MID' };
  }
  const upper = rawPos.toUpperCase().trim();

  if (upper.includes('G') || upper.includes('GK') || upper.includes('골키퍼')) {
    return { position: 'GK', detailedPosition: 'GK' };
  }
  if (upper.includes('D') || upper.includes('CB') || upper.includes('LB') || upper.includes('RB') || upper.includes('WB') || upper.includes('수비수')) {
    return { position: 'DF', detailedPosition: upper };
  }
  if (upper.includes('M') || upper.includes('DM') || upper.includes('CM') || upper.includes('AM') || upper.includes('LM') || upper.includes('RM') || upper.includes('미드필더')) {
    return { position: 'MF', detailedPosition: upper };
  }
  if (upper.includes('F') || upper.includes('S') || upper.includes('W') || upper.includes('CF') || upper.includes('ST') || upper.includes('LW') || upper.includes('RW') || upper.includes('공격수')) {
    return { position: 'FW', detailedPosition: upper };
  }

  return { position: 'MF', detailedPosition: upper || 'MF' };
}

/**
 * Normalizes a single raw player object from SofaScore API into a quant-ready record.
 */
export function normalizeSofaScorePlayer(rawPlayer: any, defaultIndex: number = 0, teamName?: string): NormalizedQuantPlayerRecord {
  const pInfo = rawPlayer.player || rawPlayer;
  const rawName = pInfo.name || pInfo.short_name || rawPlayer.name || `Player ${defaultIndex + 1}`;
  const { name, cleanName } = sanitizePlayerName(rawName);
  const shortName = pInfo.shortName || pInfo.short_name || rawPlayer.shortName || name;

  const rawPos = rawPlayer.position || pInfo.position || (defaultIndex === 0 ? 'GK' : defaultIndex < 5 ? 'DF' : defaultIndex < 9 ? 'MF' : 'FW');
  const { position, detailedPosition } = unifyPositionCode(rawPos);

  const rawNumber = rawPlayer.shirtNumber ?? rawPlayer.jerseyNumber ?? rawPlayer.jersey_number ?? pInfo.shirtNumber ?? pInfo.jerseyNumber ?? (defaultIndex + 1);
  const shirtNumber = Number(rawNumber) || (defaultIndex + 1);

  const isCaptain = Boolean(rawPlayer.isCaptain || rawPlayer.is_captain || rawPlayer.captain || pInfo.isCaptain || pInfo.captain);
  const rating = Number(rawPlayer.statistics?.rating || rawPlayer.rating || pInfo.rating || 7.0);
  const isAce = isCaptain || rating >= 7.5;

  // Quant weight mapping based on rating & position
  const quantWeight = rating >= 8.0 ? 1.4 : rating >= 7.5 ? 1.25 : rating >= 7.0 ? 1.1 : 1.0;

  const rawCountryCodeInput = pInfo.country?.alpha2 || pInfo.country?.alpha3 || pInfo.countryCode || rawPlayer.countryCode;
  const rawCountryNameInput = pInfo.country?.name || pInfo.countryName || rawPlayer.countryName;
  const resolved = resolvePlayerCountry(rawCountryCodeInput, rawCountryNameInput, name || shortName, teamName);
  const rawCountryCode = resolved.countryCode ? resolved.countryCode.toUpperCase() : undefined;
  const countryName = resolved.countryName || undefined;

  return {
    id: pInfo.id || rawPlayer.id,
    name,
    shortName,
    cleanName,
    position,
    detailedPosition,
    shirtNumber,
    isCaptain,
    isAce,
    rating: Math.round(rating * 10) / 10,
    quantWeight,
    countryCode: rawCountryCode ? String(rawCountryCode).toUpperCase() : undefined,
    countryName: countryName ? String(countryName) : undefined,
    imageLink: pInfo.id ? `https://img.sofascore.com/api/v1/player/${pInfo.id}/image` : (pInfo.image_link || pInfo.imageLink)
  };
}

/**
 * Normalizes the entire SofaScore lineups response payload into structured JSON for the quant model.
 */
export function normalizeSofaScoreLineupsPayload(
  rawLineupsResponse: any,
  homeTeamName: string,
  awayTeamName: string
): NormalizedMatchLineupPayload {
  const root = rawLineupsResponse?.lineups || rawLineupsResponse?.data || rawLineupsResponse || {};
  
  const homeObj = root.home || root.homeTeam || {};
  const awayObj = root.away || root.awayTeam || {};

  const homeFormation = homeObj.formation || root.homeFormation || '4-4-2';
  const awayFormation = awayObj.formation || root.awayFormation || '4-2-3-1';

  const homeAll = (Array.isArray(homeObj.players) ? homeObj.players : Array.isArray(homeObj.starters) ? homeObj.starters : Array.isArray(root.players) ? root.players.filter((p: any) => p.team === 'home' || p.home) : []) || [];
  const awayAll = (Array.isArray(awayObj.players) ? awayObj.players : Array.isArray(awayObj.starters) ? awayObj.starters : Array.isArray(root.players) ? root.players.filter((p: any) => p.team === 'away' || p.away) : []) || [];

  // Strictly filter starters: player must NOT be marked substitute
  const rawHomeStarters = homeAll.some((p: any) => p.substitute === false || p.is_substitute === false)
    ? homeAll.filter((p: any) => p.substitute === false || p.is_substitute === false)
    : homeAll.slice(0, 11);

  const rawAwayStarters = awayAll.some((p: any) => p.substitute === false || p.is_substitute === false)
    ? awayAll.filter((p: any) => p.substitute === false || p.is_substitute === false)
    : awayAll.slice(0, 11);

  const rawHomeSubs = (Array.isArray(homeObj.substitutes) && homeObj.substitutes.length > 0)
    ? homeObj.substitutes
    : homeAll.filter((p: any) => p.substitute === true || p.is_substitute === true);

  const rawAwaySubs = (Array.isArray(awayObj.substitutes) && awayObj.substitutes.length > 0)
    ? awayObj.substitutes
    : awayAll.filter((p: any) => p.substitute === true || p.is_substitute === true);

  const homeStarters = rawHomeStarters.map((p: any, i: number) => normalizeSofaScorePlayer(p, i));
  const awayStarters = rawAwayStarters.map((p: any, i: number) => normalizeSofaScorePlayer(p, i));
  const homeSubstitutes = rawHomeSubs.map((p: any, i: number) => normalizeSofaScorePlayer(p, i));
  const awaySubstitutes = rawAwaySubs.map((p: any, i: number) => normalizeSofaScorePlayer(p, i));

  const homeAvgRating = homeStarters.length > 0 ? homeStarters.reduce((acc, p) => acc + p.rating, 0) / homeStarters.length : 7.0;
  const awayAvgRating = awayStarters.length > 0 ? awayStarters.reduce((acc, p) => acc + p.rating, 0) / awayStarters.length : 7.0;

  const homeWeightedScore = homeStarters.length > 0 ? homeStarters.reduce((acc, p) => acc + p.quantWeight, 0) : 11.0;
  const awayWeightedScore = awayStarters.length > 0 ? awayStarters.reduce((acc, p) => acc + p.quantWeight, 0) : 11.0;

  return {
    isOfficialConfirmed: Boolean(root.confirmed ?? true),
    homeTeam: homeTeamName,
    awayTeam: awayTeamName,
    homeFormation,
    awayFormation,
    homeStarters,
    awayStarters,
    homeSubstitutes,
    awaySubstitutes,
    quantModelInputSummary: {
      homeAvgRating: Math.round(homeAvgRating * 10) / 10,
      awayAvgRating: Math.round(awayAvgRating * 10) / 10,
      homeWeightedScore: Math.round(homeWeightedScore * 100) / 100,
      awayWeightedScore: Math.round(awayWeightedScore * 100) / 100
    }
  };
}

/**
 * LineupParser utility class for parsing SofaScore lineup responses into quant model JSON format.
 */
export class LineupParser {
  /**
   * Sanitizes player name (removes special characters, normalizes whitespaces).
   */
  public static sanitizeName(rawName: string): string {
    return sanitizePlayerName(rawName).name;
  }

  /**
   * Unifies position codes into standard GK/DF/MF/FW.
   */
  public static unifyPosition(rawPos: string): 'GK' | 'DF' | 'MF' | 'FW' {
    return unifyPositionCode(rawPos).position;
  }

  /**
   * Parses raw SofaScore lineups response into system quant model JSON format.
   */
  public static parse(rawLineupsResponse: any, homeTeam: string = 'Home', awayTeam: string = 'Away'): NormalizedMatchLineupPayload {
    return normalizeSofaScoreLineupsPayload(rawLineupsResponse, homeTeam, awayTeam);
  }
}

// In-memory cache for ETag and Lineup data
const sofascoreCacheMap = new Map<string, { etag?: string; data: any; rawData: any }>();

/**
 * Calls SofaScore official lineup API using GET method with ETag caching.
 * Supports 304 Not Modified check and returns parsed home/away starters and normalized payload.
 */
export async function getSofascoreLineup(eventId: string | number, homeTeam: string = 'Home', awayTeam: string = 'Away') {
  const url = `https://www.sofascore.com/api/v1/event/${eventId}/lineups`;
  const cacheKey = String(eventId);
  const cached = sofascoreCacheMap.get(cacheKey);

  try {
    // Note: User-Agent and Referer are forbidden header names in browser fetch()
    const headers: Record<string, string> = {
      "Accept": "application/json, text/plain, */*"
    };

    if (cached?.etag) {
      headers["If-None-Match"] = cached.etag;
    }

    const res = await fetch(url, {
      method: "GET",
      headers
    });

    if (res.status === 304 && cached?.data) {
      console.log(`[SofaScore] 304 Not Modified - 경기 ID ${eventId} 캐시된 라인업 사용`);
      return cached.data;
    }

    if (!res.ok) {
      // If direct fetch from browser fails or is blocked, try local server endpoint
      const proxyRes = await fetch(`/api/sofascore/event/${eventId}/lineups`);
      if (proxyRes.ok) {
        const proxyJson = await proxyRes.json();
        return {
          home: proxyJson.home?.players?.map((p: any) => p.player?.name || p.name),
          away: proxyJson.away?.players?.map((p: any) => p.player?.name || p.name),
          confirmed: Boolean(proxyJson.confirmed),
          normalized: LineupParser.parse(proxyJson, homeTeam, awayTeam),
          rawData: proxyJson
        };
      }
      return cached?.data || null;
    }

    const etag = res.headers.get("etag") || undefined;
    const data = await res.json();

    const parsedResult = {
      home: data.home?.players?.map((p: any) => p.player?.name || p.name) || [],
      away: data.away?.players?.map((p: any) => p.player?.name || p.name) || [],
      confirmed: Boolean(data.confirmed),
      normalized: LineupParser.parse(data, homeTeam, awayTeam),
      rawData: data
    };

    sofascoreCacheMap.set(cacheKey, { etag, data: parsedResult, rawData: data });
    return parsedResult;
  } catch (err) {
    console.warn(`[SofaScore] GET fetch failed for event ${eventId}, attempting proxy fallback:`, err);
    try {
      const proxyRes = await fetch(`/api/sofascore/event/${eventId}/lineups`);
      if (proxyRes.ok) {
        const proxyJson = await proxyRes.json();
        return {
          home: proxyJson.home?.players?.map((p: any) => p.player?.name || p.name),
          away: proxyJson.away?.players?.map((p: any) => p.player?.name || p.name),
          confirmed: Boolean(proxyJson.confirmed),
          normalized: LineupParser.parse(proxyJson, homeTeam, awayTeam),
          rawData: proxyJson
        };
      }
    } catch (_) {}
    return cached?.data || null;
  }
}

