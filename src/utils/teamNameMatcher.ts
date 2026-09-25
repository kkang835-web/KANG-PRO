// Comprehensive Korean Betman (와이즈토토/프로토/베트맨) Abbreviated Names <-> Standard English & Full Korean Names Matcher

export interface TeamMatchInfo {
  koreanShort: string;
  koreanFull: string;
  english: string;
  aliases: string[];
  league: string;
  sport: 'soccer' | 'baseball' | 'basketball' | 'volleyball';
}

export const TEAM_DICTIONARY: TeamMatchInfo[] = [
  // MLS (축구)
  { koreanShort: '샌디에FC', koreanFull: '샌디에이고 FC', english: 'San Diego FC', aliases: ['샌디에이고', '샌디에고', 'san diego'], league: 'USA MLS', sport: 'soccer' },
  { koreanShort: '필라유니', koreanFull: '필라델피아 유니온', english: 'Philadelphia Union', aliases: ['필라델피아', 'philadelphia union'], league: 'USA MLS', sport: 'soccer' },
  { koreanShort: '마이애미', koreanFull: '인터 마이애미', english: 'Inter Miami', aliases: ['인터마이애미', 'inter miami'], league: 'USA MLS', sport: 'soccer' },
  { koreanShort: 'LA갤럭시', koreanFull: 'LA 갤럭시', english: 'LA Galaxy', aliases: ['엘에이갤럭시', 'la galaxy'], league: 'USA MLS', sport: 'soccer' },
  { koreanShort: 'LAFC', koreanFull: '로스앤젤레스 FC', english: 'Los Angeles FC', aliases: ['엘에이에프씨', 'la fc'], league: 'USA MLS', sport: 'soccer' },
  { koreanShort: '시애사운', koreanFull: '시애틀 사운더스', english: 'Seattle Sounders', aliases: ['시애틀', 'seattle sounders'], league: 'USA MLS', sport: 'soccer' },
  { koreanShort: '뉴욕시티', koreanFull: '뉴욕 시티 FC', english: 'New York City FC', aliases: ['nycfc', 'new york city'], league: 'USA MLS', sport: 'soccer' },
  { koreanShort: '뉴욕레드', koreanFull: '뉴욕 레드불스', english: 'New York Red Bulls', aliases: ['레드불스', 'new york red bulls'], league: 'USA MLS', sport: 'soccer' },
  { koreanShort: '콜럼크루', koreanFull: '콜럼버스 크루', english: 'Columbus Crew', aliases: ['콜럼버스', 'columbus crew'], league: 'USA MLS', sport: 'soccer' },

  // MLB (야구)
  { koreanShort: '샌프자이', koreanFull: '샌프란시스코 자이언츠', english: 'San Francisco Giants', aliases: ['샌프란', '자이언츠', 'sf giants', 'san francisco'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '샌디파드', koreanFull: '샌디에이고 파드리스', english: 'San Diego Padres', aliases: ['샌디', '파드리스', 'sd padres', 'san diego padres'], league: 'MLB', sport: 'baseball' },
  { koreanShort: 'LA다저스', koreanFull: '로스앤젤레스 다저스', english: 'Los Angeles Dodgers', aliases: ['다저스', 'la dodgers', 'dodgers'], league: 'MLB', sport: 'baseball' },
  { koreanShort: 'LA에인절', koreanFull: '로스앤젤레스 에인절스', english: 'Los Angeles Angels', aliases: ['에인절스', 'la angels', 'angels'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '뉴욕양키', koreanFull: '뉴욕 양키스', english: 'New York Yankees', aliases: ['양키스', 'ny yankees', 'yankees'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '뉴욕메츠', koreanFull: '뉴욕 메츠', english: 'New York Mets', aliases: ['메츠', 'ny mets', 'mets'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '보스레드', koreanFull: '보스턴 레드삭스', english: 'Boston Red Sox', aliases: ['보스턴', 'red sox', 'boston'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '휴스애스', koreanFull: '휴스턴 애스트로스', english: 'Houston Astros', aliases: ['휴스턴', 'astros', 'houston'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '애틀브레', koreanFull: '애틀랜타 브레이브스', english: 'Atlanta Braves', aliases: ['애틀랜타', 'braves', 'atlanta'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '필라필리', koreanFull: '필라델피아 필리스', english: 'Philadelphia Phillies', aliases: ['필리스', 'phillies', 'philadelphia'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '토론블루', koreanFull: '토론토 블루제이스', english: 'Toronto Blue Jays', aliases: ['블루제이스', 'blue jays', 'toronto'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '시카화삭', koreanFull: '시카고 화이트삭스', english: 'Chicago White Sox', aliases: ['화이트삭스', 'white sox', 'chicago white sox'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '시카컵스', koreanFull: '시카고 컵스', english: 'Chicago Cubs', aliases: ['컵스', 'cubs', 'chicago cubs'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '볼티오리', koreanFull: '볼티모어 오리올스', english: 'Baltimore Orioles', aliases: ['볼티모어', 'orioles', 'baltimore'], league: 'MLB', sport: 'baseball' },
  { koreanShort: '탬파레이', koreanFull: '탬파베이 레이스', english: 'Tampa Bay Rays', aliases: ['탬파베이', 'rays', 'tampa bay'], league: 'MLB', sport: 'baseball' },

  // EPL (프리미어리그)
  { koreanShort: '맨체유나', koreanFull: '맨체스터 유나이티드', english: 'Manchester United', aliases: ['맨유', 'man utd', 'manchester united'], league: 'EPL', sport: 'soccer' },
  { koreanShort: '맨체시티', koreanFull: '맨체스터 시티', english: 'Manchester City', aliases: ['맨시티', 'man city', 'manchester city'], league: 'EPL', sport: 'soccer' },
  { koreanShort: '아스널', koreanFull: '아스널', english: 'Arsenal', aliases: ['아스날', 'arsenal'], league: 'EPL', sport: 'soccer' },
  { koreanShort: '리버풀', koreanFull: '리버풀', english: 'Liverpool', aliases: ['liverpool'], league: 'EPL', sport: 'soccer' },
  { koreanShort: '첼시', koreanFull: '첼시', english: 'Chelsea', aliases: ['chelsea'], league: 'EPL', sport: 'soccer' },
  { koreanShort: '토트넘', koreanFull: '토트넘 홋스퍼', english: 'Tottenham Hotspur', aliases: ['토트넘', 'spurs', 'tottenham'], league: 'EPL', sport: 'soccer' },
  { koreanShort: '뉴캐슬', koreanFull: '뉴캐슬 유나이티드', english: 'Newcastle United', aliases: ['newcastle'], league: 'EPL', sport: 'soccer' },
  { koreanShort: '아스톤빌', koreanFull: '아스톤 빌라', english: 'Aston Villa', aliases: ['아스톤빌라', 'aston villa'], league: 'EPL', sport: 'soccer' },

  // La Liga (라리가)
  { koreanShort: '레알마드', koreanFull: '레알 마드리드', english: 'Real Madrid', aliases: ['레알', 'real madrid'], league: 'La Liga', sport: 'soccer' },
  { koreanShort: '바르셀로', koreanFull: 'FC 바르셀로나', english: 'Barcelona', aliases: ['바르샤', '바르셀로나', 'barcelona'], league: 'La Liga', sport: 'soccer' },
  { koreanShort: '아틀마드', koreanFull: '아틀레티코 마드리드', english: 'Atletico Madrid', aliases: ['AT마드리드', 'atletico madrid'], league: 'La Liga', sport: 'soccer' },

  // NBA (농구)
  { koreanShort: '골든워리', koreanFull: '골든스테이트 워리어스', english: 'Golden State Warriors', aliases: ['골스', 'warriors', 'golden state'], league: 'NBA', sport: 'basketball' },
  { koreanShort: 'LA레이커', koreanFull: 'LA 레이커스', english: 'Los Angeles Lakers', aliases: ['레이커스', 'lakers', 'la lakers'], league: 'NBA', sport: 'basketball' },
  { koreanShort: 'LA클리퍼', koreanFull: 'LA 클리퍼스', english: 'Los Angeles Clippers', aliases: ['클리퍼스', 'clippers', 'la clippers'], league: 'NBA', sport: 'basketball' },
  { koreanShort: '보스셀틱', koreanFull: '보스턴 셀틱스', english: 'Boston Celtics', aliases: ['셀틱스', 'celtics', 'boston celtics'], league: 'NBA', sport: 'basketball' },
  { koreanShort: '밀워벅스', koreanFull: '밀워키 벅스', english: 'Milwaukee Bucks', aliases: ['밀워키', 'bucks', 'milwaukee'], league: 'NBA', sport: 'basketball' },
  { koreanShort: '덴버너게', koreanFull: '덴버 너게츠', english: 'Denver Nuggets', aliases: ['덴버', 'nuggets', 'denver'], league: 'NBA', sport: 'basketball' },
  { koreanShort: '마이히트', koreanFull: '마이애미 히트', english: 'Miami Heat', aliases: ['히트', 'heat', 'miami heat'], league: 'NBA', sport: 'basketball' },
  { koreanShort: '피닉선즈', koreanFull: '피닉스 선즈', english: 'Phoenix Suns', aliases: ['선즈', 'suns', 'phoenix suns'], league: 'NBA', sport: 'basketball' },
  { koreanShort: '댈러매버', koreanFull: '댈러스 매버릭스', english: 'Dallas Mavericks', aliases: ['매버릭스', 'mavericks', 'dallas'], league: 'NBA', sport: 'basketball' }
];

/**
 * Clean & normalize team names by removing whitespace, special characters, and converting to lowercase.
 */
function normalizeStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, '')
    .trim();
}

/**
 * Fuzzy / Dictionary-based team matcher that connects Korean Betman short names
 * with RapidAPI / Overseas Bookmaker team names.
 */
export function matchBetmanToOverseas(koreanName: string, foreignName: string): boolean {
  if (!koreanName || !foreignName) return false;
  
  const normK = normalizeStr(koreanName);
  const normF = normalizeStr(foreignName);

  if (normK === normF || normF.includes(normK) || normK.includes(normF)) {
    return true;
  }

  // Look up dictionary entry
  const entry = TEAM_DICTIONARY.find(t => {
    const dShort = normalizeStr(t.koreanShort);
    const dFull = normalizeStr(t.koreanFull);
    const dEng = normalizeStr(t.english);
    const dAliases = t.aliases.map(a => normalizeStr(a));

    const matchesKorean = normK === dShort || normK === dFull || normK.includes(dShort) || dShort.includes(normK) || dAliases.includes(normK);
    const matchesForeign = normF === dEng || normF.includes(dEng) || dEng.includes(normF) || dAliases.includes(normF);

    return matchesKorean && matchesForeign;
  });

  if (entry) return true;

  // Partial Levenshtein / substring similarity
  if (normK.length >= 2 && normF.length >= 2) {
    const kPrefix = normK.slice(0, 2);
    const fPrefix = normF.slice(0, 2);
    if (kPrefix === fPrefix) return true;
  }

  return false;
}

/**
 * Formats a Betman short team name to its full, clear official name.
 */
export function getStandardKoreanTeamName(shortName: string): string {
  const norm = normalizeStr(shortName);
  const found = TEAM_DICTIONARY.find(t => {
    return normalizeStr(t.koreanShort) === norm || normalizeStr(t.koreanFull) === norm || t.aliases.some(a => normalizeStr(a) === norm);
  });
  return found ? found.koreanFull : shortName;
}
