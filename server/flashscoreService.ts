import { translateTeamNameToEnglish } from './teamTranslator';

const RAPIDAPI_HOST = 'flashscore-api1.p.rapidapi.com';
const API_BASE_URL = `https://${RAPIDAPI_HOST}/api/flashscore/v2`;

// In-Memory Cache to maximize efficiency within RapidAPI quota limits (e.g., 30 requests/day)
// Stores responses with TTL so repeat requests cost 0 API calls.
interface CacheEntry {
  expiresAt: number;
  data: any;
}

const flashscoreCache = new Map<string, CacheEntry>();

function getHeaders() {
  const apiKey = process.env.RAPIDAPI_KEY || '3de6eb6d6dmshf169f7ba5710730p17b64ajsn8fface862e0f';
  return {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
    'Accept': 'application/json'
  };
}

async function fetchFromFlashscore(endpointPath: string, queryParams: Record<string, string | number> = {}, ttlMs: number = 86400000) {
  const url = new URL(`${API_BASE_URL}${endpointPath}`);
  Object.entries(queryParams).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      url.searchParams.append(key, String(val));
    }
  });

  const cacheKey = url.toString();
  const now = Date.now();

  // Check cache first
  if (flashscoreCache.has(cacheKey)) {
    const entry = flashscoreCache.get(cacheKey)!;
    if (now < entry.expiresAt) {
      return entry.data;
    } else {
      flashscoreCache.delete(cacheKey);
    }
  }

  try {
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders()
    });

    if (res.status === 429) {
      console.warn(`Flashscore RapidAPI Quota Exceeded [HTTP 429] for ${url.toString()}`);
      return { success: false, quotaExhausted: true, error: 'Daily RapidAPI rate limit reached (30 calls/day)', data: [] };
    }

    if (res.status === 403 || res.status === 401) {
      console.warn(`Flashscore RapidAPI Access Restricted [HTTP ${res.status}] for ${url.toString()}`);
      return { success: false, forbidden: true, error: `RapidAPI Access Restricted (HTTP ${res.status})`, data: [] };
    }

    if (!res.ok) {
      console.warn(`Flashscore API Error [${res.status}] for ${url.toString()}`);
      const text = await res.text();
      return { success: false, error: `HTTP ${res.status}: ${text}`, data: [] };
    }

    const data = await res.json();
    
    // Cache successful responses
    if (data && ttlMs > 0) {
      flashscoreCache.set(cacheKey, { expiresAt: now + ttlMs, data });
    }

    return data;
  } catch (err: any) {
    console.error(`Flashscore API network error: ${err?.message || err}`);
    return { success: false, error: err?.message || 'Network error', data: [] };
  }
}

/**
 * 1. General Endpoints
 */
export async function getFlashscoreSports() {
  return fetchFromFlashscore('/general/sports', {}, 86400000 * 7); // 7 days
}

export async function getFlashscoreCountries(sportId: number = 1) {
  return fetchFromFlashscore('/general/countries', { sport_id: sportId }, 86400000 * 7);
}

export async function getFlashscoreTournaments(sportId: number = 1, countryId: string) {
  return fetchFromFlashscore('/general/tournaments', { sport_id: sportId, country_id: countryId }, 86400000 * 7);
}

export async function searchFlashscore(query: string) {
  return fetchFromFlashscore('/general/search', { query }, 86400000 * 3); // 3 days
}

/**
 * 2. Matches Endpoints
 */
export async function getFlashscoreLiveMatches(sportId: number = 1) {
  return fetchFromFlashscore('/matches/live', { sport_id: sportId }, 15000); // 15 seconds for live
}

export async function getFlashscoreMatchesList(sportId: number = 1, day: number = 0) {
  return fetchFromFlashscore('/matches/list', { sport_id: sportId, day }, 3600000); // 1 hour
}

export async function getFlashscoreMatchesByDate(sportId: number = 1, dateStr: string) {
  return fetchFromFlashscore('/matches/list-by-date', { sport_id: sportId, date: dateStr }, 86400000); // 1 day
}

export async function getFlashscoreMatchDetails(matchId: string) {
  return fetchFromFlashscore('/matches/details', { match_id: matchId }, 86400000);
}

export async function getFlashscoreMatchSummary(matchId: string) {
  return fetchFromFlashscore('/matches/match/summary', { match_id: matchId }, 86400000);
}

export async function getFlashscoreMatchStats(matchId: string) {
  return fetchFromFlashscore('/matches/match/stats', { match_id: matchId }, 86400000);
}

export async function getFlashscoreMatchLineups(matchId: string) {
  return fetchFromFlashscore('/matches/match/lineups', { match_id: matchId }, 86400000);
}

export async function getFlashscoreMatchH2H(matchId: string) {
  return fetchFromFlashscore('/matches/h2h', { match_id: matchId }, 86400000 * 2); // 2 days
}

export async function getFlashscoreMatchOdds(matchId: string, geoIpCode?: string) {
  return fetchFromFlashscore('/matches/odds', { match_id: matchId, ...(geoIpCode ? { geo_ip_code: geoIpCode } : {}) }, 1800000); // 30 mins
}

export async function getFlashscoreMatchStandings(matchId: string, type: 'overall' | 'home' | 'away' | 'form' = 'overall') {
  return fetchFromFlashscore('/matches/standings', { match_id: matchId, type }, 86400000 * 2);
}

/**
 * 3. Teams Endpoints
 */
export async function getFlashscoreTeamDetails(teamUrl: string) {
  return fetchFromFlashscore('/teams/details', { team_url: teamUrl }, 86400000 * 3);
}

export async function getFlashscoreTeamResults(teamId: string, page: number = 1) {
  return fetchFromFlashscore('/teams/results', { team_id: teamId, page }, 86400000);
}

export async function getFlashscoreTeamFixtures(teamId: string, page: number = 1) {
  return fetchFromFlashscore('/teams/fixtures', { team_id: teamId, page }, 86400000);
}

/**
 * Helper: Find match details by team names & sport with Smart Combined Memory Cache
 */
export async function findFlashscoreMatchByTeams(homeTeamName: string, awayTeamName: string, sport: string = 'soccer') {
  const combinedCacheKey = `match_teams_lookup_${homeTeamName.toLowerCase()}_${awayTeamName.toLowerCase()}_${sport.toLowerCase()}`;
  const now = Date.now();

  // Check top-level combined cache
  if (flashscoreCache.has(combinedCacheKey)) {
    const entry = flashscoreCache.get(combinedCacheKey)!;
    if (now < entry.expiresAt) {
      return entry.data;
    } else {
      flashscoreCache.delete(combinedCacheKey);
    }
  }

  try {
    const sportIdMap: Record<string, number> = {
      soccer: 1,
      football: 1,
      tennis: 2,
      basketball: 3,
      hockey: 4,
      volleyball: 12,
      baseball: 3
    };
    const sportId = sportIdMap[sport.toLowerCase()] || 1;

    const englishHomeName = translateTeamNameToEnglish(homeTeamName);
    const englishAwayName = translateTeamNameToEnglish(awayTeamName);

    // 1. Search for home team (try English first, then raw Korean)
    let homeSearch = await searchFlashscore(englishHomeName);
    if (homeSearch?.quotaExhausted) {
      return { found: false, quotaExhausted: true, reason: 'RapidAPI daily request quota exhausted' };
    }

    let homeResults = homeSearch?.data || [];
    if (!homeResults.length && englishHomeName !== homeTeamName) {
      homeSearch = await searchFlashscore(homeTeamName);
      homeResults = homeSearch?.data || [];
    }

    const homeTeamObj = Array.isArray(homeResults) 
      ? homeResults.find((item: any) => item.type === 'team' || item.name || item.id)
      : null;

    if (!homeTeamObj) {
      const result = { found: false, reason: 'Home team not found on Flashscore' };
      flashscoreCache.set(combinedCacheKey, { expiresAt: now + 3600000, data: result }); // cache negative result for 1 hr
      return result;
    }

    const teamId = homeTeamObj.id || homeTeamObj.team_id;
    if (teamId) {
      const [results, fixtures] = await Promise.all([
        getFlashscoreTeamResults(teamId).catch(() => null),
        getFlashscoreTeamFixtures(teamId).catch(() => null)
      ]);

      const allMatches = [...(fixtures?.data || []), ...(results?.data || [])];
      
      const reqHomeKor = homeTeamName.toLowerCase();
      const reqAwayKor = awayTeamName.toLowerCase();
      const reqHomeEng = englishHomeName.toLowerCase();
      const reqAwayEng = englishAwayName.toLowerCase();

      const matched = allMatches.find((m: any) => {
        const hName = (m.home_team?.name || m.home_team || '').toLowerCase();
        const aName = (m.away_team?.name || m.away_team || '').toLowerCase();

        const isAwayMatch = aName.includes(reqAwayEng) || reqAwayEng.includes(aName) ||
                            aName.includes(reqAwayKor) || reqAwayKor.includes(aName);
        const isHomeMatch = hName.includes(reqHomeEng) || reqHomeEng.includes(hName) ||
                            hName.includes(reqHomeKor) || reqHomeKor.includes(hName);

        return isAwayMatch || isHomeMatch;
      });

      if (matched && matched.match_id) {
        const [details, h2h, odds, lineups, standings] = await Promise.all([
          getFlashscoreMatchDetails(matched.match_id).catch(() => null),
          getFlashscoreMatchH2H(matched.match_id).catch(() => null),
          getFlashscoreMatchOdds(matched.match_id).catch(() => null),
          getFlashscoreMatchLineups(matched.match_id).catch(() => null),
          getFlashscoreMatchStandings(matched.match_id).catch(() => null)
        ]);

        const fullResult = {
          found: true,
          matchId: matched.match_id,
          matchedMatch: matched,
          details,
          h2h,
          odds,
          lineups,
          standings,
          source: 'Flashscore RapidAPI'
        };

        // Cache combined result for 24 hours
        flashscoreCache.set(combinedCacheKey, { expiresAt: now + 86400000, data: fullResult });
        return fullResult;
      }
    }

    // Fallback: Direct Search Active Match List
    const directList = await getFlashscoreMatchesList(sportId, 0);
    const activeList = directList?.data || [];
    const foundDirect = activeList.find((m: any) => {
      const h = (m.home_team?.name || '').toLowerCase();
      const a = (m.away_team?.name || '').toLowerCase();
      const reqH = homeTeamName.toLowerCase();
      const reqA = awayTeamName.toLowerCase();
      return (h.includes(reqH) || reqH.includes(h)) && (a.includes(reqA) || reqA.includes(a));
    });

    if (foundDirect && foundDirect.match_id) {
      const [details, h2h, odds, lineups, standings] = await Promise.all([
        getFlashscoreMatchDetails(foundDirect.match_id).catch(() => null),
        getFlashscoreMatchH2H(foundDirect.match_id).catch(() => null),
        getFlashscoreMatchOdds(foundDirect.match_id).catch(() => null),
        getFlashscoreMatchLineups(foundDirect.match_id).catch(() => null),
        getFlashscoreMatchStandings(foundDirect.match_id).catch(() => null)
      ]);

      const fullResult = {
        found: true,
        matchId: foundDirect.match_id,
        matchedMatch: foundDirect,
        details,
        h2h,
        odds,
        lineups,
        standings,
        source: 'Flashscore RapidAPI'
      };

      flashscoreCache.set(combinedCacheKey, { expiresAt: now + 86400000, data: fullResult });
      return fullResult;
    }

    const notFoundResult = { found: false, homeTeamObj, searchedListCount: activeList.length };
    flashscoreCache.set(combinedCacheKey, { expiresAt: now + 3600000, data: notFoundResult });
    return notFoundResult;
  } catch (err: any) {
    return { found: false, error: err?.message || 'Error searching match on Flashscore' };
  }
}
