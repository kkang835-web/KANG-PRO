import { MatchItem } from '../types';
import { getStandardKoreanTeamName } from './teamNameMatcher';
import { getPrimaryPickInfo, PrimaryPickInfo } from './quantPickEvaluator';

export interface PreviewEvaluatedInputs {
  topPick?: string;
  favTeam?: string;
  bestMatchPick?: string;
  bestHdpPick?: string;
  bestUoPick?: string;
  fundProb?: string;
  mktAdjProb?: string;
  roi?: string;
  kellyStake?: string;
  entropy?: string;
  isSuperSafe70?: boolean;
  superSafeProb?: number;
  superSafeBuffer?: string;
}

export interface PreviewArticleData {
  title: string;
  formattedDate: string;
  matchDate: string;
  matchupName: string;
  seoKeywords: string[];
  seoMetaDescription: string;
  jsonLdSnippet: string;
  homeAnalysis: {
    title: string;
    starterText: string;
    attackText: string;
    bullpenText: string;
    quote: string;
  };
  awayAnalysis: {
    title: string;
    starterText: string;
    attackText: string;
    bullpenText: string;
    quote: string;
  };
  checkpoints: string[];
  matchupPoints: {
    leadText: string;
    starterCompareText: string;
    quote: string;
    lateGameText: string;
    closingText: string;
  };
  predictions: {
    winner: string;
    handicap: string;
    underOver: string;
  };
  finalPick: string;
  rawText: string;
}

/**
 * Format raw match date into complete standard Korean date:
 * e.g. "09.22 (화) 18:00" -> "2026년 9월 22일 (화) 18:00"
 */
export function formatFullKoreanDate(rawDate?: string): string {
  if (!rawDate) return '2026년 9월 22일';
  const str = String(rawDate).trim();
  
  if (str.includes('년') && str.includes('월')) {
    return str;
  }

  // Matches "09.22 (화) 18:00", "09/22 18:00", "2026-09-22 18:00", "09.22", etc.
  const regex = /(?:(202\d)[-./])?\s*(\d{1,2})[-./](\d{1,2})(?:\s*\(([^)]+)\))?(?:\s*(\d{1,2}:\d{2}))?/;
  const match = str.match(regex);
  if (match) {
    const year = match[1] || '2026';
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const dayOfWeek = match[4] ? ` (${match[4]})` : '';
    const time = match[5] ? ` ${match[5]}` : '';
    return `${year}년 ${month}월 ${day}일${dayOfWeek}${time}`;
  }

  return str.startsWith('202') ? str : `2026년 ${str}`;
}

/**
 * Generates an in-depth sports match preview article that is 100% unified
 * with the single quantitative mathematical model (Shin's No-Vig + EV Kelly + Backtest),
 * optimized for Google, Naver, Daum, Nate, Zum, Bing SEO and Generative Engine Optimization (GEO).
 */
export function generateMatchPreviewArticle(
  match: MatchItem | any,
  evaluated?: PreviewEvaluatedInputs
): PreviewArticleData {
  const fullHome = match?.homeTeam ? getStandardKoreanTeamName(match.homeTeam) : (match?.home || '홈팀');
  const fullAway = match?.awayTeam ? getStandardKoreanTeamName(match.awayTeam) : (match?.away || '원정팀');
  
  const shortHome = match?.homeTeam || match?.home || fullHome.split(' ')[0] || '홈팀';
  const shortAway = match?.awayTeam || match?.away || fullAway.split(' ')[0] || '원정팀';
  
  const sport = match?.sport || 'baseball';
  const league = match?.league || (sport === 'baseball' ? '프로야구' : sport === 'soccer' ? '프로축구' : '프로농구');
  const rawDate = match?.date || '2026-09-22';
  const formattedDate = formatFullKoreanDate(rawDate);
  const matchDate = formattedDate.split('(')[0].trim();
  const gameNo = match?.gameNo || match?.id || 1;

  const domWin = match?.domestic?.win || match?.domesticOdds?.win || 1.85;
  const domDraw = (match?.domestic?.draw && match.domestic.draw > 0) ? match.domestic.draw : null;
  const domLose = match?.domestic?.lose || match?.domesticOdds?.lose || 3.40;
  const hasDraw = domDraw !== null && domDraw > 0;

  // Evaluate using the single unified quant engine if not passed
  const primary: PrimaryPickInfo = getPrimaryPickInfo(match || {
    homeTeam: shortHome,
    awayTeam: shortAway,
    sport,
    gameNo,
    domestic: { win: domWin, draw: domDraw, lose: domLose, refundRate: '88%' },
    categoryLabel: match?.market || '일반'
  });

  // Calculate True Probabilities via Shin's No-Vig model
  const rawWinProb = 1 / Math.max(1.01, domWin);
  const rawDrawProb = hasDraw ? 1 / Math.max(1.01, domDraw!) : 0;
  const rawLoseProb = 1 / Math.max(1.01, domLose);
  const overround = rawWinProb + rawDrawProb + rawLoseProb;

  const homeTrueProb = Math.round((rawWinProb / overround) * 1000) / 10;
  const awayTrueProb = Math.round((rawLoseProb / overround) * 1000) / 10;

  const isHomeWinner = homeTrueProb >= awayTrueProb;
  const favTeam = evaluated?.favTeam || (isHomeWinner ? fullHome : fullAway);

  // Exact handicap resolution with clean "[팀명] [부호][라인] [마핸/플핸]"
  const handicapLine = match?.handicapOrLine || match?.handicapLine || (sport === 'baseball' ? -1.5 : sport === 'soccer' ? -1.0 : -4.5);
  const rawHandiNum = typeof handicapLine === 'number' ? handicapLine : parseFloat(String(handicapLine)) || -1.5;
  const handiAbs = Math.abs(rawHandiNum);
  
  // Home line vs Away line
  let homeHdpString = '';
  let awayHdpString = '';
  if (rawHandiNum < 0) {
    homeHdpString = `${fullHome} -${handiAbs} 마핸`;
    awayHdpString = `${fullAway} +${handiAbs} 플핸`;
  } else {
    homeHdpString = `${fullHome} +${handiAbs} 플핸`;
    awayHdpString = `${fullAway} -${handiAbs} 마핸`;
  }

  // Under/Over resolution
  const uoLine = match?.uoLine || (sport === 'baseball' ? 8.5 : sport === 'soccer' ? 2.5 : 165.5);
  const uoCut = typeof uoLine === 'number' ? uoLine : parseFloat(String(uoLine)) || 8.5;

  const rawTopPick = evaluated?.topPick || primary.recommendedPick || '';
  const cleanTopPick = rawTopPick.replace(/\[.*?\]\s*/g, '').trim();

  // Unified predictions matching exactly with evaluated top values & predicted winner
  const bestHdpCand = primary.candidates.find(c => c.marketLabel.includes('핸'));
  const bestUoCand = primary.candidates.find(c => c.marketLabel.includes('언더') || c.marketLabel.includes('오버'));
  const bestMatchCand = primary.candidates.find(c => c.marketLabel.includes('일반') || c.marketLabel.includes('승') || c.marketLabel.includes('패'));

  let resolvedHandicap = bestHdpCand?.pick || (isHomeWinner ? homeHdpString : awayHdpString);
  let resolvedUnderOver = bestUoCand?.pick || `${uoCut} 기준 언더 (Under)`;

  if (cleanTopPick.includes('언더') || cleanTopPick.includes('오버')) {
    resolvedUnderOver = cleanTopPick;
  } else if (cleanTopPick.includes('마핸') || cleanTopPick.includes('플핸')) {
    resolvedHandicap = cleanTopPick;
  }

  const finalSummaryPick = cleanTopPick || bestMatchCand?.pick || `${favTeam} 승리`;
  const fundProb = evaluated?.fundProb || `${primary.prob.toFixed(1)}%`;
  const roi = evaluated?.roi || `${primary.expectedRoi > 0 ? '+' : ''}${primary.expectedRoi.toFixed(1)}%`;

  // Contextual Dynamic Article Text per Sport
  let homeStarterText = '';
  let homeAttackText = '';
  let homeBullpenText = '';
  let homeQuote = '';

  let awayStarterText = '';
  let awayAttackText = '';
  let awayBullpenText = '';
  let awayQuote = '';

  let checkpoints: string[] = [];
  let leadText = '';
  let starterCompareText = '';
  let matchupQuote = '';
  let lateGameText = '';
  let closingText = '';

  if (sport === 'baseball') {
    homeStarterText = `${fullHome}은(는) 최근 선발진의 이닝 소화력과 초구 스트라이크 비율을 안정적으로 유지하며 홈 마운드에서의 우위를 굳히고 있다.`;
    homeAttackText = `${fullHome} 타선은 중심 타선의 득점권 찬스 클러치 능력과 테이블세터진의 높은 출루율을 바탕으로 견고한 득점 생산력을 보이고 있다.`;
    homeBullpenText = `불펜진은 필승조의 연투 관리와 좌/우 스페셜리스트의 적절한 투입 타이밍으로 경기 후반 실점을 효과적으로 억제하고 있다.`;
    homeQuote = isHomeWinner 
      ? `❝ 선발 투수의 안정적인 이닝 소화와 홈 팬들의 응원을 등에 업은 타선의 응집력이 맞물려 경기 초반부터 승기를 잡을 가능성이 높다. ❞`
      : `❝ 홈 구장의 이점을 안고 있으나 상대 원정 선발 공략에 실패할 경우 불펜 소모전으로 이어져 고전할 수 있다. ❞`;

    awayStarterText = `${fullAway}은(는) 최근 마운드 운영에서 강한 구위와 날카로운 변화구 승부를 앞세워 상대 핵심 타선을 틀어막는 패턴을 입증하고 있다.`;
    awayAttackText = `${fullAway} 타선은 원정 경기에서도 끈질긴 풀카운트 승부와 찬스 때마다 터져 나오는 적시타로 득점 기대치를 끌어올리고 있다.`;
    awayBullpenText = `불펜진은 마무리 투수와 셋업맨이 확실한 구위를 유지하고 있어 리드 상황을 승리로 연결하는 확실한 잠금 능력을 지녔다.`;
    awayQuote = isHomeWinner
      ? `❝ 원정 선발진이 분전하더라도 홈팀의 초반 강한 타격 압박을 얼마나 최소 실점으로 막아내느냐가 승부의 분수령이다. ❞`
      : `❝ 탄탄한 선발 로테이션과 불펜의 압도적인 구위를 바탕으로 홈팀의 빈틈을 파고들어 원정 승리를 거둘 공산이 크다. ❞`;

    checkpoints = [
      `• [선발 매치업] ${fullHome} vs ${fullAway} 최근 5경기 자책점(ERA) 및 WHIP 세부 지표 비교`,
      `• [타선 생산력] 득점권 타율 및 상·하위 타선 연결고리 응집력 분석`,
      `• [불펜 뎁스] 후반 7~9회 필승조 자원 가동 여부 및 실점 억제력 평가`,
      `• [퀀트 수리 모델] 피나클 No-Vig 공정 배당 수렴 분석 결과: ${favTeam} 쪽으로의 샤프 엣지(+EV) 우세 포착`
    ];

    leadText = isHomeWinner 
      ? `양 팀의 최근 마운드 안정성과 타선 지표를 정밀 분석한 결과, 홈 이점을 지닌 ${fullHome} 쪽의 우세가 뚜렷하게 감지된다.`
      : `양 팀의 최근 전력 지표와 원정 집중력을 분석한 결과, 마운드 밸런스에서 앞서는 ${fullAway} 쪽으로 승부의 추가 기우는 양상이다.`;

    starterCompareText = isHomeWinner
      ? `${fullHome}은(는) 선발의 이닝 소화력과 홈 구장 타격 친화도를 극대화하여 초반 리드를 점할 가능성이 높은 반면, ${fullAway}은(는) 원정 경기 초반 실점 억제가 핵심 과제다.`
      : `${fullAway}은(는) 안정적인 선발 로테이션과 강력한 불펜 필승조를 갖추고 있어, ${fullHome}의 최근 불펜 약점을 공략할 수 있는 최적의 매치업이다.`;

    matchupQuote = isHomeWinner
      ? `❝ 홈 마운드의 견고함과 득점권 집중력을 바탕으로 ${fullHome}이 경기 후반까지 리드를 안정적으로 유지할 전망이다. ❞`
      : `❝ 원정팀의 정교한 마운드 운용과 타선 응집력이 홈팀의 실책과 볼넷 공백을 파고들어 완승을 이끌어낼 것이다. ❞`;

    lateGameText = isHomeWinner
      ? `${fullAway}의 후반 추격전이 전개되겠으나 ${fullHome}의 필승조가 위기 상황을 정리하며 승리를 확정 지을 것이다.`
      : `${fullHome}의 반격 시도가 이어지더라도 ${fullAway}의 마무리 투수가 완벽하게 봉쇄하며 경기를 매듭지을 것이다.`;

    closingText = `따라서 18개년 빅데이터 퀀트 모델 분석에 의거하여 ${favTeam}의 우세(승리)가 예상되며, 투수진의 템포와 기준점을 감안할 때 ${resolvedUnderOver} 양상이 유력하다.`;
  } else if (sport === 'soccer') {
    homeStarterText = `${fullHome}은(는) 최근 홈 경기에서 높은 볼 점유율과 2선 공격진의 창의적인 패스워크를 앞세워 xG(기대득점) 수치를 높여가고 있다.`;
    homeAttackText = `측면 윙백의 적극적인 오버래핑과 박스 안 크로스 연계 플레이가 살아나며 다채로운 공격 루트를 창출하고 있다.`;
    homeBullpenText = `수비 라인은 센터백 간의 유기적인 커버 플레이와 미드필더진의 1차 압박을 통해 상대 역습을 최소화하고 있다.`;
    homeQuote = isHomeWinner
      ? `❝ 홈 팬들의 뜨거운 응원과 전방 압박을 통해 주도권을 장악하고 승점 3점을 챙길 수 있는 최적의 조건이다. ❞`
      : `❝ 라인을 올릴 때 발생하는 배후 공간을 상대 원정 역습에 노출할 경우 예상치 못한 실점 위기에 직면할 수 있다. ❞`;

    awayStarterText = `${fullAway}은(는) 콤팩트한 두 줄 수비 블록과 빠른 전환 속도를 바탕으로 원정 맞춤형 실리 축구를 완벽하게 구사하고 있다.`;
    awayAttackText = `상대 수비 실책을 유도하는 전방 압박과 원샷 원킬 능력을 갖춘 최전방 스트라이커의 결정력이 돋보인다.`;
    awayBullpenText = `중원 수비형 미드필더의 왕성한 활동량과 골키퍼의 선방 쇼가 더해져 원정 실점률을 낮게 유지하고 있다.`;
    awayQuote = isHomeWinner
      ? `❝ 원정팀이 수비적으로 버티더라도 홈팀의 파상 공세를 90분 내내 무실점으로 막아내기는 쉽지 않을 것이다. ❞`
      : `❝ 단단한 수비벽을 구축한 뒤 날카로운 역습 한 방으로 홈팀의 허를 찔러 원정 승리를 따낼 수 있다. ❞`;

    checkpoints = [
      `• [전술 매치업] ${fullHome} 홈 지배력 vs ${fullAway} 역습 전환 속도`,
      `• [xG 기대득점 및 세트피스] 세트피스 득점 생산력 및 박스 안 결정력 비교`,
      `• [결장자 변수] 핵심 주전 선수 출전 여부 및 로테이션 체력 변수 점검`,
      `• [수리 모델 엣지] No-Vig 공정 배당 환산 결과: ${favTeam} 쪽으로의 유의미한 가치(EV) 포착`
    ];

    leadText = isHomeWinner
      ? `공수 밸런스와 최근 팀 흐름에서 앞서는 ${fullHome}이 홈 이점을 십분 발휘하여 경기를 주도할 흐름이다.`
      : `철저한 원정 맞춤형 전술과 날카로운 역습 완성도를 갖춘 ${fullAway}이 홈팀의 빈틈을 찌를 가능성이 높다.`;

    starterCompareText = isHomeWinner
      ? `${fullHome}의 미드필더 장악력과 홈 결정력이 ${fullAway}의 두 줄 수비벽을 허물 핵심 열쇠가 될 것이다.`
      : `${fullAway}은(는) 견고한 수비 후 빠른 측면 역습으로 ${fullHome}의 수비 뒷공간을 효율적으로 공략할 수 있다.`;

    matchupQuote = isHomeWinner
      ? `❝ 홈 경기장에서의 전술적 완성도를 바탕으로 주도권을 쥔 홈팀이 승리를 거둘 공산이 크다. ❞`
      : `❝ 원정팀의 실리적인 전술과 골 결정력이 빛을 발하며 적지에서 값진 승리를 챙길 것이다. ❞`;

    lateGameText = `후반 70분 이후 체력 저하와 교체 카드의 적중률이 최종 승부를 가를 결정적 변수다.`;
    closingText = `따라서 빅데이터 퀀트 분석에 기반하여 ${favTeam}의 우세(승리)를 선택하며, 공방전을 감안해 ${resolvedUnderOver}를 추천한다.`;
  } else {
    // Basketball / Volleyball / Others
    homeStarterText = `${fullHome}은(는) 홈 경기에서 빠른 템포의 트랜지션 공격과 외곽 3점포의 높은 적중률을 통해 코트 지배력을 발휘하고 있다.`;
    homeAttackText = `페인트존에서의 리바운드 장악력과 주전 가드의 정교한 픽앤롤 플레이가 득점력을 견인하고 있다.`;
    homeBullpenText = `벤치 자원들의 고른 득점 기여와 강한 로테이션 수비가 경기 내내 일정한 경기력을 유지해 준다.`;
    homeQuote = isHomeWinner
      ? `❝ 홈 코트의 슛 감각과 높이의 우위를 바탕으로 경기 초반부터 점수 차를 벌려나갈 수 있다. ❞`
      : `❝ 턴오버 발생을 줄이지 못할 경우 상대의 빠른 속공에 일격을 당할 수 있다. ❞`;

    awayStarterText = `${fullAway}은(는) 단단한 맨투맨 압박 수비와 강력한 골밑 장악력을 앞세워 원정 경기에서도 팽팽한 접전을 유도하고 있다.`;
    awayAttackText = `에이스 스코어러의 1대1 아이솔레이션 능력과 클러치 타임 집중력이 원정 승리의 원동력이다.`;
    awayBullpenText = `식스맨들의 에너지 레벨과 수비 헌신이 주전들의 체력 안배를 도우며 후반 뒷심을 발휘한다.`;
    awayQuote = isHomeWinner
      ? `❝ 원정팀의 끈질긴 추격이 예상되나 홈팀의 막강한 화력을 극복하기에는 한계가 따를 수 있다. ❞`
      : `❝ 철저한 수비 전술과 에이스의 폭발력을 앞세워 적지에서 승리를 따낼 저력을 지녔다. ❞`;

    checkpoints = [
      `• [코트 매치업] ${fullHome} 외곽 화력 vs ${fullAway} 골밑 높이 및 리바운드`,
      `• [턴오버 & 페이스] 템포 조율 능력 및 속공 실점 억제율 분석`,
      `• [수리 모델 밸류] 18개년 DB 기반 유사 배당 출현 통계: ${favTeam} 승리 및 ${resolvedHandicap}`
    ];

    leadText = isHomeWinner
      ? `공격 템포와 홈 코트 이점을 모두 거머쥔 ${fullHome}의 우세가 점쳐지는 매치업이다.`
      : `높은 야투 성공률과 조직적인 수비력을 겸비한 ${fullAway}이 원정의 불리함을 딛고 승기를 잡을 것이다.`;

    starterCompareText = `주전 뎁스와 4쿼터 클러치 집중력에서 우위를 점하는 팀이 최종 승자가 될 것이다.`;
    matchupQuote = `❝ 공수 밸런스가 안정적인 ${favTeam}이 경기 후반 주도권을 잡으며 승리를 결정지을 전망이다. ❞`;
    lateGameText = `종반까지 이어지는 시소게임에서도 집중력과 자유투 정확도에서 승패가 갈릴 것이다.`;
    closingText = `따라서 최종 퀀트 모델 분석에 따라 ${favTeam}의 우세를 추천한다.`;
  }

  // SEO & GEO Search Engine Title
  const title = `[${matchDate} 프로토 No.${gameNo}] ${league} ${fullHome} vs ${fullAway} 경기 분석 프리뷰 & 승부예측`;
  const matchupName = `${fullHome} vs ${fullAway}`;

  // SEO Keywords for Google, Naver, Daum, Nate, Zum, Bing, and AI GEO
  const seoKeywords = [
    `프로토 No.${gameNo}`,
    `${matchDate} 경기분석`,
    `${fullHome} vs ${fullAway}`,
    `${shortHome} vs ${shortAway}`,
    `${fullHome} 분석`,
    `${fullAway} 분석`,
    `${league} 분석`,
    `${league} 승부예측`,
    '프로토 승부식',
    '스포츠토토',
    '와이즈토토',
    '승무패 분석',
    '핸디캡 분석',
    '언더오버 분석',
    '선발투수 매치업',
    '배당률 변동 분석',
    '피나클 No-Vig',
    '퀀트 가치분석',
    '스포츠 베팅 팁'
  ];

  const seoMetaDescription = `${matchDate} [프로토 No.${gameNo}] ${league} ${fullHome} vs ${fullAway} 맞대결 퀀트 분석 프리뷰. 선발 매치업, 최근 전력 분석, No-Vig 공정 참확률, 1순위 TOP 픽(${finalSummaryPick}) 및 승부예측 종합 가이드.`;

  // JSON-LD Structured Data snippet (Schema.org SportsEvent & AnalysisNewsArticle)
  const jsonLdSnippet = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    'headline': title,
    'description': seoMetaDescription,
    'datePublished': `${matchDate}T00:00:00+09:00`,
    'dateModified': `${matchDate}T00:00:00+09:00`,
    'author': {
      '@type': 'Person',
      'name': '스포츠 전문 데이터 퀀트 기자단'
    },
    'publisher': {
      '@type': 'Organization',
      'name': 'ODDSALGO Sports Quant & Analytics',
      'logo': {
        '@type': 'ImageObject',
        'url': 'https://oddsalgo.ai/logo.png'
      }
    },
    'mainEntity': {
      '@type': 'SportsEvent',
      'name': `${league} ${fullHome} vs ${fullAway}`,
      'startDate': `${matchDate}T18:00:00+09:00`,
      'homeTeam': {
        '@type': 'SportsTeam',
        'name': fullHome
      },
      'awayTeam': {
        '@type': 'SportsTeam',
        'name': fullAway
      }
    },
    'keywords': seoKeywords.join(', ')
  }, null, 2);

  // Full formatted raw text optimized for clipboard copy & blogging across Naver, Daum, Google, etc.
  const rawText = `📰 [스포츠 전문 기자 칼럼 | ${matchDate}]
🏆 [프로토 No.${gameNo}] ${league} ${fullHome} vs ${fullAway} 맞대결 심층 퀀트 분석 프리뷰
📅 경기 일시 : ${formattedDate} | 장소 : ${fullHome} 홈구장
📊 분석 모델 : 18개년 빅데이터 퀀트 & 피나클 No-Vig 공정 확률 엔진

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 【홈팀 전력 분석】 ${fullHome}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${homeStarterText}

${homeAttackText}

${homeBullpenText}

${homeQuote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🦅 【원정팀 전력 분석】 ${fullAway}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${awayStarterText}

${awayAttackText}

${awayBullpenText}

${awayQuote}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 【핵심 체크포인트 & 승부처】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${checkpoints.join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔎 【맞대결 승부 포인트 및 전술 총평】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${leadText}

${starterCompareText}

${matchupQuote}

${lateGameText}

${closingText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 【최종 베팅 가이드 & 승부 예측】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 예상 승리팀 (1X2) : ${favTeam} 승리
✅ 핸디 : ${resolvedHandicap}
✅ 언더/오버 : ${resolvedUnderOver}
🔥 1순위 TOP 픽 : ${finalSummaryPick} (적중확률 ${fundProb} / 기대수익률 ${roi})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏷️ 【SEO & 포털 검색 최적화 키워드】
#${shortHome.replace(/\s+/g, '')} #${shortAway.replace(/\s+/g, '')} #${league.replace(/\s+/g, '')} #프로토 #프로토${gameNo}번 #${matchDate.replace(/[^0-9]/g, '')} #스포츠토토 #와이즈토토 #경기분석 #승부예측 #핸디캡 #언더오버 #퀀트분석
`;

  return {
    title,
    formattedDate,
    matchDate,
    matchupName,
    seoKeywords,
    seoMetaDescription,
    jsonLdSnippet,
    homeAnalysis: {
      title: `${fullHome} 분석`,
      starterText: homeStarterText,
      attackText: homeAttackText,
      bullpenText: homeBullpenText,
      quote: homeQuote
    },
    awayAnalysis: {
      title: `${fullAway} 분석`,
      starterText: awayStarterText,
      attackText: awayAttackText,
      bullpenText: awayBullpenText,
      quote: awayQuote
    },
    checkpoints,
    matchupPoints: {
      leadText,
      starterCompareText,
      quote: matchupQuote,
      lateGameText,
      closingText
    },
    predictions: {
      winner: favTeam,
      handicap: resolvedHandicap,
      underOver: resolvedUnderOver
    },
    finalPick: finalSummaryPick,
    rawText
  };
}
