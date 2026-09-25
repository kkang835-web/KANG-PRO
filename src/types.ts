export type TabType = 'proto' | 'toto' | 'crawler' | 'quant_lab' | 'portfolio' | 'backtest';
export type GameType = 'pt1' | 'sc1' | 'bs1' | 'bk1';
export type TotoType = 'sc' | 'bs' | 'bk'; // sc: 축구승무패, bs: 야구승1패, bk: 농구승5패
export type SportCategory = 'all' | 'soccer' | 'baseball' | 'basketball' | 'volleyball';
export type GoldenPackageType = '10000_golden' | '20000_golden' | '30000_golden' | 'custom';

export interface TotoRoundLimits {
  sc: Record<number, number>;
  bs: Record<number, number>;
  bk: Record<number, number>;
  [key: string]: Record<number, number>;
}

export interface TotoMatchResult {
  homeScore: number;
  awayScore: number;
  outcome: 'win' | 'draw' | 'lose'; // 'win' (홈승/승), 'draw' (무/1/5점차), 'lose' (원정승/패)
  outcomeLabel: string; // '홈승' | '무승부' | '홈패' | '승' | '1' | '패' | '5'
  status: 'finished' | 'live' | 'scheduled';
}

export interface TotoMatchIntelligence {
  verdictType: 'BANKER_FAVORITE' | 'FATIGUE_ROTATION_TRAP' | 'ODDS_DISTORTION_UPSET' | 'DRAW_CLOSE_HOTSPOT' | 'UNDERDOG_UPRISING';
  verdictLabel: string;
  verdictColor: 'emerald' | 'rose' | 'amber' | 'blue' | 'purple';
  recommendedPick: ('win' | 'draw' | 'lose')[];
  recommendedPickLabel: string;
  scheduleFatigue: {
    level: 'HIGH' | 'MEDIUM' | 'NORMAL';
    description: string;
  };
  xgMetrics: {
    homeXg: number;
    awayXg: number;
    xgDiff: number;
    description: string;
  };
  headToHead: {
    record: string;
    advantage: 'home' | 'away' | 'even';
    description: string;
  };
  recentForm: {
    homeForm: string;
    awayForm: string;
    formVerdict: string;
  };
  oddsDistortion: {
    gap: number;
    fairWinProb: number;
    isOvervalued: boolean;
    description: string;
  };
  lineupNews: string;
  tacticalSummary: string;
}

export interface TotoMatch {
  matchNo: number; // 1 ~ 14
  date: string;
  league: string;
  sport: 'soccer' | 'baseball' | 'basketball';
  homeTeam: string;
  awayTeam: string;
  voteRate: {
    win: number;  // % (or Home win / 승)
    draw: number; // % (or Draw / 1 / 5점차)
    lose: number; // % (or Away win / 패)
  };
  voteCount?: {
    win: number;
    draw: number;
    lose: number;
  };
  totalVotes?: number;
  domesticOdds?: {
    win: number;
    draw?: number | null;
    lose: number;
  };
  foreignOdds?: {
    win: number;
    draw?: number | null;
    lose: number;
  };
  protoMatchItem?: MatchItem | null; // 프로토 연동 매칭 경기
  userPick?: ('win' | 'draw' | 'lose')[]; // 사용자가 선택한 복식/단식 픽들
  handicapLine?: number;
  uoLine?: number;
  result?: TotoMatchResult;
  intelligence?: TotoMatchIntelligence;
}

export interface PayoutSummaryInfo {
  raw?: string;
  rank1Amount?: string;
  rank1Votes?: string;
  rank1Payout?: string;
  rank2Amount?: string;
  rank2Votes?: string;
  rank2Payout?: string;
  rank3Amount?: string;
  rank3Votes?: string;
  rank3Payout?: string;
  rank4Amount?: string;
  rank4Votes?: string;
  rank4Payout?: string;
}

export interface TotoRoundInfo {
  totoType: TotoType;
  year: number;
  round: number;
  title: string; // e.g. "축구승무패 2026년 1회차"
  closeDate: string;
  carryOverAmount: number; // 이월금 (원)
  expectedJackpot: number; // 예상 총 1등 당첨금 (원)
  totalVotes: number; // 총 판매 투표수
  totalPrice?: number; // 총 판매금액 (원)
  aggregatedTime?: string; // 와이즈토토 대중투표현황 집계 기준 시각
  availableRounds?: number[]; // 해당 연도 발매 회차 목록
  availableYears?: number[]; // 발매 연도 목록
  matches: TotoMatch[];
  payoutSummary?: PayoutSummaryInfo;
}

export interface TotoTrapMatch {
  matchNo: number;
  homeTeam: string;
  awayTeam: string;
  trapType: 'overvalued' | 'split' | 'draw_bait' | 'sharp_shift';
  trapLabel: string;
  publicVoteRate: number;
  reason: string;
  recommendedHedging: string;
}

export interface TotoAiStrategyCommentary {
  roundDifficulty: '하급 (다수 당첨 예상)' | '중급 (표준 밸런스)' | '상급 (이월/단독 독식 위험)' | '극상 (지뢰밭 대진표)';
  difficultyScore: number; // 1 ~ 100
  oddsMakerIntent: string[];
  trapMatches: TotoTrapMatch[];
  goldenPattern: {
    favoriteCount: number;
    drawCount: number;
    upsetCount: number;
    historicalHitRate: string;
  };
  aiVerdict: string;
  recommendedStrategy: string;
}

export interface TotoPortfolioTicket {
  ticketId: number; // 1 ~ 8
  ticketName: string; // e.g. "직교 티켓 #1 (고배당 업사이드)"
  selections: ('win' | 'draw' | 'lose')[][]; // 14경기에 대한 단식/복식 픽 [14][]
  ticketPrice: number; // e.g. 4,000원, 1,000원, 8,000원
  numDoubles?: number; // 복식 개수
  numTriples?: number; // 삼식 개수
  numSingles?: number; // 단식 개수
  combinationsCount?: number; // 4, 1, 8 등
  hammingDistanceToOthers: number[]; // 다른 티켓들과의 해밍 거리
  coverageScore: string; // e.g. "상호 포위망 98.4%"
  expectedEv: number; // 예상 기댓값
  description: string;
  expectedWinners?: string;
  expectedPayout?: string;
  rating?: string;
  hitResult?: {
    correctCount: number;
    rank: 1 | 2 | 3 | 4 | null;
    isWin: boolean;
    prizeName: string;
  };
}

export interface TotoBatchTicket {
  id: number;
  rank: number;
  name: string;
  selections: ('win' | 'draw' | 'lose')[][];
  ticketCost: number;
  numDoubles: number;
  numTriples: number;
  numSingles: number;
  expectedEv: number;
  soloJackpotScore: number; // 0 ~ 100
  trapDefenseScore: number; // 0 ~ 100
  goldenRatioMatch: string; // e.g. "정배 7 : 무 4 : 역배 3 (적합도 96%)"
  simulatedHitProb: {
    rank1: string; // e.g. "0.0042%"
    rank2: string; // e.g. "0.058%"
    rank3: string; // e.g. "0.38%"
    rank4: string; // e.g. "1.95%"
  };
  strategyTag: string; // e.g. "오즈메이커 함정 헷징", "황금비율 정석", "역배 독점", "안전 정배"
  description: string;
}

export interface TotoPortfolioResult {
  totoType: TotoType;
  year: number;
  round: number;
  deckId?: string;
  deckIndex?: number;
  budgetPackage?: GoldenPackageType;
  packageSplitName?: string;
  strategyMode?: string;
  strategyName?: string;
  seed?: number;
  totalCombinations: number; // e.g. 64 조합
  totalCost: number; // e.g. 10,000원, 20,000원, 30,000원
  expectedWinners: {
    rank1: number; // 1등 예상 당첨자 수 (명)
    rank2: number; // 2등
    rank3: number; // 3등
    rank4: number; // 4등
  };
  payoutPerWinner: {
    rank1: number; // 1등 1인당 예상 당첨금 (원)
    rank2: number;
    rank3: number;
    rank4: number;
  };
  orthogonalTickets: TotoPortfolioTicket[]; // 다변화 직교 커버리지 티켓들
  antiCloningScore: number; // 94.8% (대중 적중 비대칭 분산)
  guaranteedCoverageRange: string; // "1등~4등 상호 포위 커버리지"
  simulatedHitStats?: {
    rank1HitProb: string;
    rank2HitProb: string;
    rank3HitProb: string;
    rank4HitProb: string;
    anyHitProb: string;
    simulatedTrials: number;
    expectedRoi: string;
  };
  matches?: TotoMatch[];
  aiStrategyCommentary?: TotoAiStrategyCommentary;
}

export interface OddsDetail {
  win: number;
  draw: number | null;
  lose: number;
  refundRate: string;
  trend?: 'up' | 'down' | 'flat';
}

export interface MatchItem {
  gameNo: number;
  year?: number;
  round?: number;
  date: string;
  rawDate?: string;
  time?: string;
  gameTime?: string;
  league: string;
  sport: 'soccer' | 'baseball' | 'basketball' | 'volleyball';
  categoryType: '일반' | '핸디캡' | '언더오버' | '승1패';
  categoryLabel: string; // e.g. "H +1.5", "U/O 2.5", "일반", "승1패"
  handicapOrLine?: number;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  domestic: OddsDetail;
  foreign: OddsDetail;
  status: '경기전' | '진행중' | '종료';
  score: { home: number; away: number } | null;
  hitOutcome?: 'win' | 'draw' | 'lose' | null; // Which bet actually hit
  scheduleInfoSeq?: string;
  leagueInfoSeq?: string;
  rawResultTag?: string;
  handicapLine?: number;
  uoLine?: number;
  matchOdds?: OddsDetail;
  handicapOdds?: OddsDetail;
  uoOdds?: OddsDetail;
  w1lOdds?: OddsDetail;
}

export interface RoundMetadata {
  year: number;
  round: number;
  maxRounds: number;
  roundPeriod: string;
  totalGames: number;
  domesticRefundRate: string;
  foreignRefundRate: string;
  status: string;
}

export interface MarketRecommendation {
  marketType: 'match' | 'handicap' | 'underover';
  marketLabel: string;
  pick: string;
  side: 'home' | 'draw' | 'away' | 'under' | 'over' | 'pass';
  prob: number;
  odds: number;
  fairOdds: number;
  expectedRoi: number; // % (Expected Value based ROI)
  confidence: string;
  confidenceLevel: number; // 1~5
  status: 'recommended' | 'secondary' | 'excluded' | 'pass';
  reason: string;
  isPrimary?: boolean;
  isRelativeBest?: boolean;
}

export interface PredictionResult {
  recommendedPick: string;
  recommendationType: 'home' | 'draw' | 'away' | 'under' | 'over' | 'handicap_home' | 'handicap_away' | 'pass';
  confidence: string;
  confidenceLevel: number;
  expectedProbabilities: {
    win: string;
    draw: string | null;
    lose: string;
  };
  fairOdds?: {
    win: number;
    draw: number | null;
    lose: number;
  };
  marketRecommendations?: MarketRecommendation[];
  primaryMarketType?: 'match' | 'handicap' | 'underover' | 'pass';
  recommendedPicksCount?: number;
  excludedReason?: string;
  h2hSummary: string;
  quantSummary: string;
  fullCommentary: string;
  keyPoint: string;
  isAllPass?: boolean;
  leanPick?: {
    marketLabel: string;
    pick: string;
    odds: number;
    fairOdds: number;
    prob: number;
    expectedRoi: number;
    reason: string;
  } | null;
  passActionPlan?: {
    leanStrategy: string;
    hedgeStrategy: string;
    bankrollRule: string;
    altMatchesSuggestion: string;
  } | null;
  sharpBenchmark?: SharpNoVigBenchmark;
}

export interface SportsDbTeamInfo {
  idTeam: string;
  strTeam: string;
  strBadge: string;
  strLogo?: string;
  strStadium?: string;
  intFormedYear?: string;
  strLeague?: string;
  strCountry?: string;
  strDescriptionEN?: string;
}

export interface H2HMatch {
  date: string;
  league: string;
  home: string;
  away: string;
  scoreHome: number;
  scoreAway: number;
  result: 'win' | 'draw' | 'lose'; // from perspective of current homeTeam
  isOver?: boolean;
}

export interface TeamRecentMatch {
  date: string;
  opponent: string;
  isHome: boolean;
  scoreFor: number;
  scoreAgainst: number;
  result: 'W' | 'D' | 'L';
}

export interface TeamRecentForm {
  team: string;
  recentMatches: TeamRecentMatch[];
  form: ('W' | 'D' | 'L')[];
  avgGoalsFor: number;
  avgGoalsAgainst: number;
}

export interface SeasonStats {
  homeStats: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    winRate: string;
    avgScored: number;
    avgConceded: number;
    cleanSheetRate: string;
  };
  awayStats: {
    played: number;
    win: number;
    draw: number;
    lose: number;
    winRate: string;
    avgScored: number;
    avgConceded: number;
    cleanSheetRate: string;
  };
}

export interface StandingsEntry {
  rank: number;
  team: string;
  teamId?: string;
  played: number;
  win: number;
  draw: number;
  lose: number;
  points: number;
  scored: number;
  conceded: number;
  diff: string;
  form: ('W' | 'D' | 'L')[];
}

export interface InjuryPlayer {
  name: string;
  reason: string;
  status: '결장 확정' | '출전 불투명' | '복귀 수순';
  severity: 'high' | 'medium' | 'low';
}

export interface LineupDetails {
  formation: string;
  keyStarters: string[];
  injuries: InjuryPlayer[];
}

export interface CupTournamentStats {
  isCupMatch: boolean;
  tournamentName: string; // e.g. "리그스컵 2024", "코파 리베르타도레스 16강", "FA컵 8강", "일왕배"
  stage: string; // e.g. "조별리그 3차전", "16강 토너먼트", "단판 승부"
  homeCupForm: ('W' | 'D' | 'L')[];
  awayCupForm: ('W' | 'D' | 'L')[];
  homeCupGoalDiff: number; // 토너먼트 득실 마진 (+1.4)
  awayCupGoalDiff: number; // (-0.6)
  penaltyShootoutRisk: number; // 연장/승부차기 돌입 확률 % (e.g. 28.5%)
  neutralVenue: boolean;
  groupStageStandings?: {
    rank: number;
    team: string;
    played: number;
    points: number;
    goalDiff: number;
    goalsFor: number;
    goalsAgainst: number;
  }[];
  advancementProb: {
    home: number; // e.g. 64.2%
    away: number; // e.g. 35.8%
  };
  specialCupFactor: string; // e.g. "단판 토너먼트 수비적 경기 운영 & 연장전 리스크 보정"
}

export interface WeatherEnvironmentQuantProfile {
  stadiumName: string;
  isDomeOrIndoor: boolean;
  temperatureCelsius: number; // e.g. 21.5°C
  weatherCondition: 'CLEAR' | 'RAIN' | 'HEAVY_RAIN' | 'SNOW' | 'WINDY' | 'INDOOR_DOME' | 'CLOUDY';
  weatherConditionLabel: string; // e.g. "맑음 / 쾌적", "수중전 (우천)", "외야 뒷바람 (타자유리)"
  humidityPct: number; // e.g. 58%
  windSpeedMps: number; // e.g. 3.4 m/s
  windDirectionLabel: string; // e.g. "북동풍 (홈런 타구 비거리 +4.2m 증가)", "맞바람 (타구 감속)"
  precipitationProb: number; // e.g. 15%
  airDensityIndex: number; // 0.95 ~ 1.05 (기준 1.00)
  weatherLambdaMultiplier: number; // e.g. 0.94 (우천 시 언더 가중) ~ 1.06 (고온/뒷바람 오버 가중)
  overUnderImpactType: 'OVER_FAVOR' | 'UNDER_FAVOR' | 'NEUTRAL';
  impactSummary: string;
  physicalFactorsNote: string;
  source?: 'KMA_LIVE' | 'JMA_LIVE' | 'OPEN_METEO' | 'OPEN_METEO_JAPAN' | 'INDOOR_CONTROL' | 'HISTORICAL_MODEL';
  observationStation?: string; // 관측지소 e.g. "기상청 서울(108) 지상관측소", "수원관측소(119)", "일본 기상청(JMA) 도쿄 지상관측소"
}

export interface RefereeQuantProfile {
  refereeName: string; // e.g. "안토니 테일러", "이동준 주심", "문승훈 구심", "스캇 포스터"
  roleTitle?: string;
  sport?: 'soccer' | 'baseball' | 'basketball' | 'volleyball';
  strictnessIndex?: number; // 0.85 ~ 1.15 (기준 1.00)
  cardOrFoulRate?: number; // 축구: 경기당 카드/파울, 야구: BB/K 성향, 농구: 파울 콜 빈도
  cardFrequency?: string;
  penaltyTendency?: string;
  specialImpactNote?: string;
  foulToleranceRate?: string;
  foulsPerMatch?: number | string;
  yellowCardsPerMatch?: number | string;
  strikeZoneExpansion?: string;
  homeTeamWinRateBias?: number;
  overUnderBias?: 'over_favor' | 'under_favor' | 'neutral';
  overUnderPsiMultiplier?: number; // 주심/구심 성향 계수 (ψ, e.g. 0.94 ~ 1.08)
  lambdaMultiplier?: number;
  foulTendency?: string;
  tempoCorrection?: number | string;
  tendencyType?: 'TIGHT_DEFENSIVE' | 'LOOSE_OFFENSIVE' | 'NEUTRAL_STANDARD' | 'EXTREME_STRICT' | 'PITCHER_FRIENDLY' | 'HITTER_FRIENDLY';
  summaryLabel?: string;
  impactDescription?: string;
  tacticalImpactNote?: string;
}

export interface DixonColesDetail {
  tauMatrix?: {
    score: '0-0' | '1-0' | '0-1' | '1-1';
    tau: number;
    rawPoissonProb: number;
    dixonColesProb: number;
    differencePct: number;
  }[];
  tau00?: number;
  tau10?: number;
  tau01?: number;
  tau11?: number;
  rho?: number;
  rhoCoefficient?: number; // e.g. -0.112
  lambdaHome?: number;
  muAway?: number;
  expectedTotalGoals?: number;
  independentPoissonProb00?: number;
  dixonColesAdjustedProb00?: number;
  refereeImpactCoefficient?: number;
  summaryNote?: string;
  zeroZeroBoostRatio?: number; // e.g. +14.2%
  under2_5AdjustedProb?: number;
  bttsAdjustedProb?: number;
  expectedScoreMargin?: string;
}

export interface BaseballNegativeBinomialModel {
  distributionType?: 'Negative_Binomial_Overdispersion' | string;
  dispersionParameterR?: number; // e.g. 4.85
  rDispersion?: number;
  varianceToMeanRatio?: number; // e.g. 1.42 (과분산 지수 σ²/μ > 1)
  homeFip?: number; // e.g. 3.42
  awayFip?: number; // e.g. 4.18
  fipHome?: number;
  fipAway?: number;
  homeWhip?: number; // e.g. 1.14
  awayWhip?: number; // e.g. 1.36
  whipHome?: number;
  whipAway?: number;
  bullpenEraAdj?: number;
  stadiumName?: string;
  parkFactor?: number;
  parkFactorMultiplier?: number; // e.g. 1.042
  umpireZoneMultiplier?: number; // e.g. 0.96 (구심 스트존 확대)
  umpireZoneBias?: string;
  oneRunGameProb?: number;
  minus1_5CoverProb?: number;
  plus1_5CoverProb?: number;
  modelSummary?: string;
  runMarginOverdispersionProb?: {
    oneRunGameProb: number; // 1점차 박빙 확률 e.g. 28.6%
    twoRunGameProb: number; // 2점차
    blowoutMarginProb: number; // 4점 이상 대승/대패
  };
}

export interface BasketballPacePossessionModel {
  distributionType?: 'Possession_Pace_Tempo_Engine' | string;
  homePace?: number; // e.g. 101.4 possessions/48min
  awayPace?: number; // e.g. 97.8
  pace?: number;
  projectedGamePace?: number; // e.g. 99.6
  homeOffRating?: number; // e.g. 116.2 pts/100poss
  awayOffRating?: number; // e.g. 112.5
  offensiveRatingHome?: number;
  offensiveRatingAway?: number;
  homeDefRating?: number; // e.g. 109.8
  awayDefRating?: number; // e.g. 114.1
  defensiveRatingHome?: number;
  defensiveRatingAway?: number;
  possessionEfficiencyMargin?: number;
  studentTDegreesOfFreedom?: number;
  studentTScale?: number;
  clutchFoulInflationScore?: number;
  modelSummary?: string;
  expectedHomePossessionScore?: number;
  expectedAwayPossessionScore?: number;
  expectedTotalPossessionScore?: number;
  refereeFoulPaceMultiplier?: number; // e.g. 1.025
}

export interface VolleyballMarkovSetTransitionModel {
  distributionType?: 'Markov_Set_Transition_Matrix' | string;
  homePointWinRate?: number; // e.g. 52.8%
  awayPointWinRate?: number; // e.g. 47.2%
  deuceProbPerSet?: number; // 24-24 듀스 진입 확률 e.g. 18.5%
  deuceProbabilityPerSet?: number;
  set3ReachingProb?: number;
  set4ReachingProb?: number;
  set5ReachingProb?: number;
  setTransitions?: {
    threeZero: number; // 3-0
    threeOne: number; // 3-1
    threeTwo: number; // 3-2
    twoThree: number; // 2-3
    oneThree: number; // 1-3
    zeroThree: number; // 0-3
  };
  setScoreProbabilities?: {
    '3-0': number;
    '3-1': number;
    '3-2': number;
    '2-3': number;
    '1-3': number;
    '0-3': number;
  };
  modelSummary?: string;
  expectedTotalScore?: number;
  expectedTotalPoints?: number;
}

export interface SportOptimizedDistributionModel {
  sport: 'soccer' | 'baseball' | 'basketball' | 'volleyball';
  modelName?: string;
  distributionName?: string;
  distributionType?: string;
  primaryFormula?: string;
  mathFormulaDescription?: string;
  formulaDescription?: string;
  refereeProfile?: RefereeQuantProfile;
  dixonColes?: any;
  baseballModel?: any;
  basketballModel?: any;
  volleyballModel?: any;
  soccerDixonColes?: DixonColesDetail;
  baseballNegativeBinomial?: BaseballNegativeBinomialModel;
  basketballPossession?: BasketballPacePossessionModel;
  volleyballMarkov?: VolleyballMarkovSetTransitionModel;
}

export interface LeagueStandingsInfo {
  homeRank: string;
  awayRank: string;
  homePoints: number;
  awayPoints: number;
  standings: StandingsEntry[];
  leagueId?: string;
  countryCode?: string;
  countryName?: string;
  leagueName?: string;
  normalizedLeagueName?: string;
  isCupTournament?: boolean;
  cupStats?: CupTournamentStats;
}

export interface LineupsInfo {
  homeLineup: LineupDetails;
  awayLineup: LineupDetails;
}

export interface MatchAnalysisData {
  homeTeam: string;
  awayTeam: string;
  league: string;
  sport: 'soccer' | 'baseball' | 'basketball' | 'volleyball';
  sportsDb: {
    home: SportsDbTeamInfo | null;
    away: SportsDbTeamInfo | null;
  };
  h2h: {
    total: number;
    win: number;
    draw: number;
    lose: number;
    winRate: string;
    avgGoalsTotal: number;
    matches: H2HMatch[];
  };
  homeRecentForm: TeamRecentForm;
  awayRecentForm: TeamRecentForm;
  seasonStats: SeasonStats;
  leagueStandings?: LeagueStandingsInfo;
  lineupsInfo?: LineupsInfo;
  cupTournamentStats?: CupTournamentStats;
  refereeProfile?: RefereeQuantProfile;
  weatherEnvironment?: WeatherEnvironmentQuantProfile;
}

export interface BayesianHierarchicalData {
  shrinkageWeight: number; // e.g. 0.72 (72% sample, 28% prior)
  homePosteriorMean: number;
  awayPosteriorMean: number;
  leaguePriorBaseline: number;
  varianceReductionPct: number;
  stabilityRating: string;
}

export interface DynamicEloData {
  homeElo: number;
  awayElo: number;
  eloDiff: number;
  homeEloWinProb: number;
  awayEloWinProb: number;
  decayLambda: number;
  opponentQualityFactor: string;
}

export interface FatigueIndexData {
  homeRestDays: number;
  awayRestDays: number;
  homeTravelKm: number;
  awayTravelKm: number;
  homeFatiguePenaltyPct: number;
  awayFatiguePenaltyPct: number;
  isBackToBack: boolean;
  impactSummary: string;
}

export interface SmartMoneyCLVData {
  smartMoneyDirection: 'home' | 'draw' | 'away' | 'under' | 'over' | 'neutral';
  sharpVolumeShare: number; // e.g. 68%
  clvScorePct: number; // Closing Line Value score e.g. +4.2%
  marketBiasTrend: string;
  valueGapPct: number; // Difference between True Prob and Bookmaker Odds Implied Prob e.g. +7.5%
  isOvervalued: boolean; // false = 저평가(가치픽), true = 고평가(함정픽)
  evaluationLabel: string; // e.g. "저평가 +7.5% (강력 가치픽)"
  openingOdds?: number; // 배당 오픈 시점 초기 기준 배당
  currentOdds?: number; // 실시간 현재 배당
  oddsVelocity?: number; // d(Odds)/dt (시간당 배당 변화 기울기)
  isSteamMove?: boolean; // 샤프 자금 급유입 스팀 무브 발생 여부
  steamAlert?: string; // 스팀 무브 상태 메시지
  clvGainPct?: number; // 마감 배당 가치(CLV) 우위 마진 %
  blendedTrueProb?: number; // 모델 확률 + 마감 배당 흐름 가중 결합 확률 %
  oddsDropPct?: number; // 초기 배당 대비 현재 배당 변동/하락률 (%)
  momentumFactor?: number; // 퀀트 알고리즘 모멘텀 가중치 (%p)
  favoredSideLabel?: string; // 배당 모멘텀 상태 라벨
}

export interface AdaptiveKellyData {
  rawKelly: number; // 풀 켈리 기준 비중 %
  adaptiveMultiplier: number; // 섀넌 엔트로피 기반 동적 배율 (0.15x ~ 0.35x)
  adaptiveKellyStake: number; // 최종 권장 자금 투입 비중 %
  riskBand: '적극 투자 (0.35x)' | '표준 분할 (0.25x)' | '보수 방어 (0.15x)' | '관망';
  mddDefenseRating: string; // MDD 4% 미만 방어 평가
  explanation: string;
}

export interface LeagueClusterCalibrationData {
  leagueName: string;
  avgGoals?: number;
  rho?: number; // Dixon-Coles 저득점/무승부 상관 계수 (-0.07 ~ -0.19)
  dispersionR?: number; // 음이항 과분산 파라미터
  parkFactor?: number; // 야구 구장별 파크팩터
  stadium?: string;
  summerRunMultiplier?: number; // 여름철(7~8월) 고온다습 타고투저 보정 배율 (1.065x)
  drawClusteringNote?: string;
}

export interface HandicapAnalysisData {
  handicapLine: number; // e.g. -1.5, +1.0
  homeCoverProb: number; // %
  awayCoverProb: number; // %
  drawPushProb?: number; // % for integer handicaps
  fairHandicapOdds: { home: number; away: number };
  valueGapCover: number; // %
  recommendedSide: 'home' | 'away' | 'pass';
  commentary: string;
}

export interface UnderOverAnalysisData {
  uoLine: number; // e.g. 2.5, 8.5, 165.5
  underProb: number; // %
  overProb: number; // %
  pushProb?: number; // % for integer lines (e.g., 2.0, 3.0, 9.0)
  expectedTotalScore: number;
  fairUnderOdds: number;
  fairOverOdds: number;
  valueGap: number; // %
  recommendedSide: 'under' | 'over' | 'pass';
  modalScoreRange: string;
  commentary: string;
  modelName?: string;
  sportKeyFactors?: string[];
  confidenceRating?: string;
  brierScoreEstimate?: number;
}

export interface QuantAnalysisResult {
  sport?: 'soccer' | 'baseball' | 'basketball' | 'volleyball';
  overround: string;
  shinsModel: {
    win: string;
    draw: string;
    lose: string;
    winProb?: string;
    drawProb?: string;
    loseProb?: string;
  };
  shannonEntropy: {
    bits: string;
    recommendation: string;
  };
  valueMetrics: {
    pdi: string;
    kellyFraction: string;
  };
  dixonColes: {
    lambdaHome: number;
    muAway: number;
    expectedTotalGoals: number;
    scoreProbabilities: { score: string; prob: string }[];
  };
  bayesian: BayesianHierarchicalData;
  elo: DynamicEloData;
  fatigue: FatigueIndexData;
  smartMoneyCLV: SmartMoneyCLVData;
  adaptiveKelly?: AdaptiveKellyData;
  bayesianDLM?: BayesianDLMData;
  leagueCluster?: LeagueClusterCalibrationData;
  handicapAnalysis?: HandicapAnalysisData;
  uoAnalysis?: UnderOverAnalysisData;
  soccer?: SoccerQuantData;
  baseball?: BaseballQuantData;
  basketball?: BasketballQuantData;
  cupStats?: CupTournamentStats;
  refereeProfile?: RefereeQuantProfile;
  weatherEnvironment?: WeatherEnvironmentQuantProfile;
  dixonColesDetail?: DixonColesDetail;
  sportDistribution?: SportOptimizedDistributionModel;
  backtestSummary?: BacktestSummary;
  backtest?: BacktestSummary;
  sharpBenchmark?: SharpNoVigBenchmark;
}

export interface SoccerSpecialScoreDist {
  goals: number | string;
  label: string;
  homeProb: number;
  awayProb: number;
}

export interface SoccerSpecialRecommendation {
  type: 'double' | 'triple';
  homePicks: (number | string)[];
  awayPicks: (number | string)[];
  coverageProb: number;
  strategyNote: string;
}

export interface SoccerQuantData {
  sport: 'soccer';
  shinsModel: {
    zParameter: number;
    trueProbWin: number;
    trueProbDraw: number;
    trueProbLose: number;
    fairOddsWin: number;
    fairOddsDraw: number;
    fairOddsLose: number;
    overround: number;
  };
  pdiKelly: {
    pdiWin: number;
    pdiDraw: number;
    pdiLose: number;
    kellyFractionWin: number;
    kellyFractionDraw: number;
    kellyFractionLose: number;
    evWin: number;
    evDraw: number;
    evLose: number;
    recommendedValueBet: 'win' | 'draw' | 'lose' | 'none';
  };
  shannonEntropy: {
    entropyBits: number;
    maxEntropy: number;
    normalizedEntropy: number;
    volatilityRisk: string;
    entropyColor: string;
  };
  poissonXg: {
    lambdaHome: number;
    muAway: number;
    expectedTotalGoals: number;
    scoreMatrix: { score: string; prob: number; isTop?: boolean }[];
    under2_5Prob: number;
    over2_5Prob: number;
    bttsYesProb: number;
    bttsNoProb: number;
    mostLikelyScore: string;
    specialScoreDist?: SoccerSpecialScoreDist[];
    specialRecommendations?: {
      double: SoccerSpecialRecommendation;
      triple: SoccerSpecialRecommendation;
    };
  };
}

export interface BaseballSpecialScoreDist {
  runs: string;
  label: string;
  homeProb: number;
  awayProb: number;
}

export interface BaseballSpecialRecommendation {
  type: 'double' | 'triple';
  homePicks: string[];
  awayPicks: string[];
  coverageProb: number;
  strategyNote: string;
}

export interface BasketballSpecialScoreDist {
  pts: string;
  label: string;
  homeProb: number;
  awayProb: number;
}

export interface BasketballSpecialRecommendation {
  type: 'double' | 'triple';
  homePicks: string[];
  awayPicks: string[];
  coverageProb: number;
  strategyNote: string;
}

export interface BaseballQuantData {
  sport: 'baseball';
  shinsModel: {
    trueProbWin: number;
    trueProbLose: number;
    fairOddsWin: number;
    fairOddsLose: number;
    overround: number;
  };
  skellamDistribution: {
    lambdaHomeRuns: number;
    muAwayRuns: number;
    oneRunGameProb: number;
    homeWinMargin1Prob: number;
    awayWinMargin1Prob: number;
    handicapMinus1_5Prob: number;
    handicapPlus1_5Prob: number;
    marginHistogram: { margin: string; prob: number }[];
  };
  startingPitcherParkFactor: {
    homePitcher: { name: string; era: number; fip: number; whip: number; k9: number };
    awayPitcher: { name: string; era: number; fip: number; whip: number; k9: number };
    stadium: string;
    parkFactor: number;
    pitcherAdvantage: string;
  };
  scoreMatrix: {
    expectedTotalRuns: number;
    underOverLines: { line: number; underProb: number; overProb: number }[];
    runDistribution: { runs: string; prob: number }[];
    specialScoreDist?: BaseballSpecialScoreDist[];
    specialRecommendations?: {
      double: BaseballSpecialRecommendation;
      triple: BaseballSpecialRecommendation;
    };
  };
}

export interface BasketballQuantData {
  sport: 'basketball';
  shinsModel: {
    trueProbWin: number;
    trueProbLose: number;
    fairOddsWin: number;
    fairOddsLose: number;
    overround: number;
  };
  tDistSpread: {
    meanDifferential: number;
    stdDeviation: number;
    homeCoverMinus3_5: number;
    homeCoverMinus5_5: number;
    homeCoverMinus7_5: number;
    tTailConfidence: string;
  };
  paceEfficiency: {
    pace: number;
    homeOffensiveRating: number;
    homeDefensiveRating: number;
    awayOffensiveRating: number;
    awayDefensiveRating: number;
    expectedHomeScore: number;
    expectedAwayScore: number;
    expectedTotalScore: number;
  };
  scoreIntegration: {
    underOverBands: { band: string; prob: number; isModal?: boolean }[];
    modalScoreRange: string;
    specialScoreDist?: BasketballSpecialScoreDist[];
    specialRecommendations?: {
      double: BasketballSpecialRecommendation;
      triple: BasketballSpecialRecommendation;
    };
  };
}

export interface BacktestSummary {
  period: string;
  totalMatchesTested: number;
  totalBetsPlaced: number;
  datasetBreakdown?: {
    totalPool18Years: number;
    inSampleMatches: number;
    outOfSampleMatches: number;
    executedBetsMatches: number;
    overfittingGap: number;
    generalizationScore: number;
  };
  strategies: {
    name: string;
    description: string;
    betsCount: number;
    hitsCount: number;
    hitRate: number;
    totalWagered: number;
    totalReturned: number;
    netProfit: number;
    roi: number;
    maxDrawdown: number;
    profitFactor: number;
    brierScore: number;
  }[];
  sportsBreakdown: {
    sport: string;
    sportName: string;
    matches: number;
    hitRate: number;
    roi: number;
    bestModel: string;
  }[];
  entropyCalibration: {
    range: string;
    label: string;
    matches: number;
    hitRate: number;
    roi: number;
    action: string;
  }[];
  underOverBenchmark?: {
    period: string;
    sampleSize: number;
    overallNaive: { hitRate: number; roi: number; brierScore: number };
    overallQuant: { hitRate: number; roi: number; brierScore: number };
    sports: {
      sport: string;
      sportName: string;
      matches: number;
      naiveModel: { hitRate: number; roi: number; brierScore: number };
      quantModel: { hitRate: number; roi: number; brierScore: number };
      modelName: string;
      keyMechanisms: string[];
    }[];
  };
  keyFindings: string[];
  improvementRoadmap: string[];
}

export interface CrawlStatus {
  totalRounds: number;
  cachedRounds: number;
  isCrawling: boolean;
  currentTask: string;
  progressPercent: number;
  lastUpdated: string;
}

// =======================================================================
// Toto Mathematical Model Optimization & Backtesting Types
// =======================================================================

export interface TotoDataSplitInfo {
  inSample: {
    period: string; // "2021~2024년 (70%)"
    roundsCount: number;
    matchesCount: number;
    modelsTrained: string[];
    parameterFitSummary: string;
    hitRate: number;
    brier: number;
  };
  outOfSample: {
    period: string; // "2025~2026년 (30%)"
    roundsCount: number;
    matchesCount: number;
    hitRate: number;
    brier: number;
    generalizationScore: number;
    overfittingGap: number;
    validationStatus: 'EXCELLENT_ROBUST' | 'WELL_GENERALIZED' | 'SLIGHT_OVERFIT';
  };
}

export interface TotoReliabilityBin {
  binRange: string; // e.g. "0.0~0.1", "0.1~0.2", ...
  predictedProb: number; // e.g. 0.15
  rawEmpiricalFreq: number; // 0.22 (과소평가 등)
  calibratedEmpiricalFreq: number; // 0.16 (교정 후)
  idealFreq: number; // 0.15
  sampleCount: number;
}

export interface TotoCalibrationInfo {
  metricName: string;
  rawBrierScore: number;
  plattBrierScore: number;
  isotonicBrierScore: number;
  rawECE: number; // Expected Calibration Error (%)
  calibratedECE: number;
  eceImprovementPct: number;
  targetOutcomesCorrection: {
    outcome: string; // "무승부 (축구)", "1 (야구 1점차)", "5 (농구 5점차)"
    rawBias: string; // "과소평가 -6.2%"
    scalingFactor: string; // "Platt A=1.18, B=-0.14"
    comment: string;
  }[];
  reliabilityDiagram: TotoReliabilityBin[];
}

export interface TotoFilteringOptimization {
  entropyCutoffCurve: {
    cutoffBits: number;
    combinationsCount: number;
    costReductionPct: number;
    hitRateRetentionPct: number;
    efficiencyScore: number;
    isOptimal?: boolean;
  }[];
  optimalEntropyCutoff: number; // e.g. 1.32 bits
  evThresholdCurve: {
    evThreshold: number; // e.g. 1.0, 1.1, 1.2, 1.3, 1.5, 1.8
    winFrequencyPct: number;
    averageJackpot: number;
    longTermRoiPct: number;
    recommendation: string;
    isOptimal?: boolean;
  }[];
  optimalEvThreshold: number; // e.g. 1.25
  simulatedPrizeSummary: {
    totalRounds: number;
    rank1Hits: number;
    rank2Hits: number;
    rank3Hits: number;
    rank4Hits: number;
    totalCost: number;
    totalReturn: number;
    netProfit: number;
    overallRoi: number;
    maxDrawdownPct: number;
    profitFactor: number;
  };
  equityCurve: {
    roundNo: number;
    roundLabel: string;
    baselineEquity: number;
    marketFavoriteEquity: number;
    optimizedQuantEquity: number;
    drawdowns: number;
  }[];
}

export interface TotoSurpriseAnalytics {
  voteBubbleGapAnalysis: {
    gapRange: string; // "< +10%", "+10% ~ +20%", "+20% ~ +25%", "+25% ~ +30%", "> +30%"
    matchesTested: number;
    upsetOccurred: number;
    upsetRatePct: number;
    expectedValue: number;
    actionRecommendation: string;
    isOptimalCutoff?: boolean;
  }[];
  optimalGapThreshold: number; // e.g. 25 (%)
  totalSurprisesDistribution: {
    surprisesRange: string; // "0~1개", "2~3개", "4~5개", "6~7개", "8개 이상"
    roundsCount: number;
    percentage: number;
    avgRank1Payout: string;
    isGoldenZone: boolean;
  }[];
  favoriteDefeatRatePct: number; // e.g. 38.4%
  recommendedFilterRule: string; // e.g. "전체 14경기 중 이변 마킹 총합 4~7개 필터링 적용"
  clusteredSurprises: {
    clusterType: string;
    description: string;
    historicalRounds: number;
    avgSurprisesPerRound: number;
    upsetMultiplier: number;
    entropyAdjustment: string;
    recommendedAction: string;
  }[];
  oddsDroppingAnalysis: {
    dropMagnitude: string; // "< -5%", "-5% ~ -10%", "-10% ~ -15%", "> -15%"
    signalCount: number;
    upsetHits: number;
    hitRatePct: number;
    singlePickRoiPct: number;
    confidenceLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
    strategicRule: string;
  }[];
  keyOptimizationInsights: string[];
}

export interface TotoOptimizationReport {
  sport: TotoType;
  sportName: string;
  timestamp: string;
  dataSplitting: TotoDataSplitInfo;
  calibration: TotoCalibrationInfo;
  filteringOptimization: TotoFilteringOptimization;
  surpriseAnalytics: TotoSurpriseAnalytics;
}

// =======================================================================
// Roadmap Advanced 4 Mathematical Models Interfaces
// =======================================================================

export interface BayesianDLMData {
  timeSeries: {
    step: number;
    date: string;
    rawPerformance: number;
    filteredForm: number;
    smoothedForm: number;
    variance: number;
    lowerBound: number;
    upperBound: number;
    event?: string;
  }[];
  kalmanGain: number;
  processNoiseW: number;
  measurementNoiseV: number;
  injuryImpact: {
    player: string;
    position: string;
    status: 'OUT' | 'DOUBTFUL' | 'FIT';
    absencePenalty: number;
    varianceInflation: number;
  }[];
  netInjuryPenalty: number;
  priorMean: number;
  posteriorMean: number;
  posteriorVariance: number;
  formTrend: 'RISING' | 'STABLE' | 'DECAYING';
  formVerdict: string;
}

export interface EloGlickoDecayData {
  homeElo: number;
  awayElo: number;
  homeGlickoRD: number;
  awayGlickoRD: number;
  glickoVolatility: number;
  baseHomeAdvantage: number;
  decayedHomeAdvantage: number;
  restDaysHome: number;
  restDaysAway: number;
  decayLambda: number;
  travelDistanceKm: number;
  travelFatigueDiscount: number;
  gFactorRD: number;
  glickoWinProb: number;
  glickoDrawProb: number;
  glickoLoseProb: number;
  uncertaintyBand: { minWinProb: number; maxWinProb: number };
  ratingQualitySummary: string;
}

export interface MLGradientBoostingEnsembleData {
  features: {
    name: string;
    featureKey: string;
    value: number;
    unit: string;
    importanceGainPct: number;
    shapValue: number;
  }[];
  ensembleWeights: {
    benterTwoStep?: number;
    shinsModel: number;
    poissonSkellam: number;
    h2hHistory: number;
    eloGlicko: number;
    marketSharp: number;
  };
  objectiveLossLogLoss: number;
  brierScoreLoss: number;
  crossValidationScore: number;
  predictedOutcomeProbabilities: {
    win: number;
    draw: number;
    lose: number;
  };
  treeDepth: number;
  learningRate: number;
  boostingRounds: number;
  modelExplanation: string;
}

export interface DynamicKellyBrierData {
  fullKellyFraction: number;
  dynamicKellyFraction: number; // 0.25 ~ 0.33
  optimalFractionLabel: string;
  brierScore: number;
  brierLossPenalty: number;
  brierConfidenceMultiplier: number;
  edgePercentage: number;
  expectedGrowthRate: number;
  ruinProbabilityPct: number;
  maxDrawdownRiskPct: number;
  sharpeRatio: number;
  simulatedBankrollCurve: {
    betIndex: number;
    flatBetting: number;
    fullKelly: number;
    fractionalKelly25: number;
    fractionalKelly33: number;
  }[];
  capitalAllocationAdvice: string;
}

export interface BillBenterTwoStepModelData {
  fundamentalProbabilities: {
    win: number;
    draw: number;
    lose: number;
  };
  marketImpliedProbabilities: {
    win: number;
    draw: number;
    lose: number;
  };
  combinedProbabilities: {
    win: number;
    draw: number;
    lose: number;
  };
  parameters: {
    gammaFund: number;
    gammaMarket: number;
    timeDecayLambda: number;
    temperature: number;
  };
  mispricingAnalysis: {
    winEdge: number;
    drawEdge: number;
    loseEdge: number;
    mispricingRatioWin: number;
    mispricingRatioDraw: number;
    mispricingRatioLose: number;
    crowdBiasType: 'fake_favorite' | 'underestimated_value' | 'efficient_market' | 'heavy_draw_bias';
    recommendationLabel: string;
    benterPick: 'win' | 'draw' | 'lose';
  };
  logLikelihoodGainPct: number;
  brierScoreImprovementPct: number;
  shannonEntropyDelta: number;
  step1Features: {
    name: string;
    category: string;
    value: number | string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
  }[];
}

export interface BenterABBacktestComparison {
  testedMatchesCount: number;
  period: string;
  fundamentalOnly: {
    logLoss: number;
    brierScore: number;
    solidHitRate: number;
    overallHitRate: number;
    roi: number;
    maxDrawdown: number;
    sharpeRatio: number;
    toto1stCycle: number;
    netProfitKRW: number;
  };
  benterCombined: {
    logLoss: number;
    brierScore: number;
    solidHitRate: number;
    overallHitRate: number;
    roi: number;
    maxDrawdown: number;
    sharpeRatio: number;
    toto1stCycle: number;
    netProfitKRW: number;
  };
  marketFavoriteBenchmark: {
    logLoss: number;
    brierScore: number;
    solidHitRate: number;
    overallHitRate: number;
    roi: number;
    maxDrawdown: number;
    sharpeRatio: number;
    toto1stCycle: number;
    netProfitKRW: number;
  };
  comparisonMetrics: {
    logLossReductionPct: number;
    brierImprovementPct: number;
    roiAlphaExcessPct: number;
    toto1stCycleReductionPct: number;
  };
  equityCurve: {
    matchIndex: number;
    fundamentalOnlyBalance: number;
    benterCombinedBalance: number;
    marketFavoriteBalance: number;
  }[];
  mispricingDecilePerformance: {
    decile: string;
    edgeRange: string;
    matches: number;
    winRate: number;
    roi: number;
    action: string;
  }[];
  conclusions: string[];
}


export interface RoadmapModelsPackage {
  bayesianDLM: BayesianDLMData;
  eloGlicko: EloGlickoDecayData;
  mlBoosting: MLGradientBoostingEnsembleData;
  dynamicKelly: DynamicKellyBrierData;
  xaiFeatureImportance?: XAIFeatureImportanceData;
  mcmcSurfer?: MCMCJackpotSurferData;
  oddsDropDetector?: SmartMoneyOddsDropData;
  injuryLossMatrix?: PlayerInjuryLossMatrixData;
}

export interface XAIFeatureImportanceData {
  baseProbabilityWin: number;
  baseProbabilityDraw?: number;
  baseProbabilityLose: number;
  shapValueGainSummary: {
    featureName: string;
    category: 'odds' | 'injury' | 'fip' | 'form' | 'benter';
    shapValueWinPct: number; // e.g. +8.4 or -3.2
    shapValueLosePct: number;
    importanceGainWeight: number; // e.g. 24.5%
    description: string;
  }[];
  topDriverWin: string;
  topRiskFactor: string;
  xaiExplicabilityScore: number; // e.g. 98.2%
}

export interface MCMCJackpotSurferData {
  simulationsCount: number; // e.g. 10000
  expectedSoloWinners: number; // e.g. 0.8
  soloJackpotEvRatio: number; // e.g. +184.2% EV
  carryOverProbabilityPct: number; // e.g. 24.5%
  optimalSurfingCombinations: {
    budgetKRW: number;
    doublesCount: number;
    combinationsCount: number;
    rankLabel: string;
    expectedHitProbPct: number;
    expectedEvYieldPct: number;
    recommendedStrategy: string;
  }[];
  summaryAdvice: string;
}

export interface SmartMoneyOddsDropData {
  matchId: string;
  initialOdds: { win: number; draw?: number; lose: number };
  currentOdds: { win: number; draw?: number; lose: number };
  oddsDropRatioPct: { win: number; draw?: number; lose: number }; // e.g. -12.4%
  smartMoneySignal: 'MASSIVE_INFLOW' | 'MODERATE_DROPPING' | 'NEUTRAL_STABLE' | 'REVERSE_OVERHEAT';
  clvEdgePct: number; // e.g. +8.5%
  recommendationTag: string;
}

export interface PlayerInjuryLossMatrixData {
  teamName: string;
  missingPlayers: {
    playerName: string;
    role: string; // 'ACE_STRIKER' | 'SP1_PITCHER' | 'MAIN_PG' | 'KEY_DEFENDER'
    importanceRating: number; // 1 ~ 10
    warEpmLoss: number; // e.g. -4.8%
    statusReason: string; // '부상' | '경고누적' | '휴식'
  }[];
  totalEpmWarLossPct: number; // e.g. -11.2%
  adjustedWinProbDeltaPct: number; // e.g. -8.4%
  injurySeverityIndex: 'CRITICAL' | 'WARNING' | 'MINOR' | 'CLEAN';
  summaryReport: string;
}

export interface QuantAutoTuneReport {
  timestamp: string;
  sport: TotoType | 'pt';
  latencyReductionPct: number; // e.g. 38.5% (4.2ms -> 2.6ms)
  beforeMetrics: {
    brierScore: number; // 0.171
    logLoss: number; // 0.542
    hitRatePct: number; // 68.2%
    roiPct: number; // +8.4%
    latencyMs: number; // 4.2ms
  };
  afterMetrics: {
    brierScore: number; // 0.152
    logLoss: number; // 0.485
    hitRatePct: number; // 74.5%
    roiPct: number; // +14.8%
    latencyMs: number; // 2.6ms
  };
  deltaMetrics: {
    brierImprovementPct: number; // -11.1%
    logLossReductionPct: number; // -10.5%
    hitRateGainPctPoints: number; // +6.3%p
    roiGainPctPoints: number; // +6.4%p
    latencySpeedupPct: number; // +38.1%
  };
  hyperparameters: {
    learningRate: number; // 0.042
    treeDepth: number; // 5
    brierShrink: number; // 0.22
    kellyFraction: number; // 0.25
    entropyCutoff: number; // 1.32
    evThreshold: number; // 1.28
  };
  suggestedActionItems: {
    category: string;
    status: 'OPTIMAL' | 'RECOMMENDED' | 'APPLIED';
    title: string;
    detail: string;
  }[];
  prunedModels?: {
    modelName: string;
    category: '중복 모델' | '미미/노이즈 모델' | '역효과 모델';
    originalMetric: string;
    reason: string;
    replacedBy: string;
    performanceGain: string;
  }[];
  triPillarEvolution?: TriPillarEvolutionData;
}

export interface TriPillarWeightVector {
  quant: number;        // e.g. 0.35 (35%)
  smartMoney: number;   // e.g. 0.38 (38%)
  similarOdds: number;  // e.g. 0.27 (27%)
}

export interface TriPillarEvolutionData {
  generation: string; // e.g. "Gen 3.6 (Adaptive Evolution)"
  generationNumber: number;
  fitnessScore: number; // e.g. 98.4 / 100
  totalHistoricalMatches: number; // 21,230 (18 years)
  onlineFeedbackMatches: number; // 1,480
  currentWeights: TriPillarWeightVector;
  timeDecayProfile: {
    tMinus24h: TriPillarWeightVector;
    tMinus6h: TriPillarWeightVector;
    tMinus1h: TriPillarWeightVector;
  };
  sportCalibrations: {
    sport: string;
    sportLabel: string;
    optimalWeights: TriPillarWeightVector;
    hitRateGain: number; // +X.X%p
    roiGain: number;     // +X.X%p
    recommendedTarget: string;
  }[];
  generationHistory: {
    generation: string;
    weights: TriPillarWeightVector;
    hitRate: number;
    brierScore: number;
    roi: number;
    evolutionNote: string;
  }[];
  verdictSummary: string;
}

export interface RoundSimulationStep {
  round: number; // e.g. 1, 2, ..., 30
  roundLabel: string; // e.g. "프로토 2026년 24회차"
  matchesCount: number; // 14
  baselineHitRate: number; // e.g. 58.5%
  earlyClvHitRate: number; // e.g. 67.2%
  evolvingHitRate: number; // e.g. 74.8% -> 79.5%
  baselineRoi: number; // e.g. +7.2%
  earlyClvRoi: number; // e.g. +18.4%
  evolvingRoi: number; // e.g. +28.5% -> +35.2%
  brierScore: number; // e.g. 0.165 -> 0.098
  generationLabel: string; // e.g. "Gen 3.8.4"
  activeWeights: TriPillarWeightVector;
  postMatchReview: {
    matchesTested: number;
    hitsCount: number;
    surprisesCount: number;
    keyLearning: string;
    pillarAttribution: {
      quantPillarScore: number;
      smartMoneyPillarScore: number;
      similarOddsPillarScore: number;
    };
  };
}

export interface RoundEvolutionBacktestResult {
  totalRounds: number; // 30
  totalMatches: number; // 420 (30 rounds * 14 matches)
  testPeriod: string; // "2025~2026 프로토/토토 연속 30개 회차 실전 전수 복기"
  baselineModelOverall: {
    name: string;
    hitRate: number; // 58.9%
    roi: number; // +9.2%
    brierScore: number; // 0.179
    maxDrawdown: number; // -18.4%
  };
  earlyClvModelOverall: {
    name: string;
    hitRate: number; // 68.4%
    roi: number; // +22.8%
    brierScore: number; // 0.138
    maxDrawdown: number; // -9.2%
  };
  continuousEvolvingModelOverall: {
    name: string;
    hitRate: number; // 76.8% (최종 회차 79.2% 수렴)
    roi: number; // +33.4%
    brierScore: number; // 0.104
    maxDrawdown: number; // -4.6%
    hitRateImprovementPct: number; // +17.9%p
    roiExcessPct: number; // +24.2%p
  };
  roundsHistory: RoundSimulationStep[];
  reverseProjectedClvSummary: {
    description: string;
    koreanEarlyCutoffTime: string; // "21:50 KST"
    avgClvSurplusPct: number; // +4.8%p
    overUnderAccuracyWithEarlyClv: number; // 74.2%
  };
  evolutionConclusion: string;
}

export interface MonteCarloTotoSimulationResult {
  simulationsCount: number; // e.g. 10000
  matchesCount: number; // e.g. 14
  sport: TotoType | 'pt';
  naiveRandomStrategy: {
    strategyName: string; // '대중/무작위 일반 조합'
    hitRate1stPct: number; // e.g. 0.08%
    hitRateAnyRankPct: number; // e.g. 4.2%
    expectedReturnPct: number; // e.g. -24.5%
    mddPct: number; // e.g. -68.2%
    brierScore: number; // e.g. 0.284
    avgPayoutKRW: number; // e.g. 820000
  };
  monteCarloQuantStrategy: {
    strategyName: string; // '몬테카를로 MCMC 퀀트 최적화 조합'
    hitRate1stPct: number; // e.g. 1.28%
    hitRateAnyRankPct: number; // e.g. 24.5%
    expectedReturnPct: number; // e.g. +152.4%
    mddPct: number; // e.g. -18.4%
    brierScore: number; // e.g. 0.142
    avgPayoutKRW: number; // e.g. 3450000
  };
  comparisonGain: {
    hitRate1stMultiplier: number; // e.g. 16.0x (16배 향상)
    hitRateAnyRankGainPctPoints: number; // e.g. +20.3%p
    roiGainPctPoints: number; // e.g. +176.9%p
    mddReductionPctPoints: number; // e.g. +49.8%p
    brierImprovementPct: number; // e.g. -50.0%
  };
  simulationBreakdownByDoubles: {
    doublesCount: number;
    budgetKRW: number;
    naiveHitRate1stPct: number;
    mcHitRate1stPct: number;
    naiveRoiPct: number;
    mcRoiPct: number;
    mcEvGainRatio: number; // e.g. +184.2%
    recommendation: string;
  }[];
  simulationDistributions: {
    simCountLabel: string;
    mcHitRate1stPct: number;
    mcHitRateAnyRankPct: number;
    mcRoiPct: number;
    confidenceInterval95: string; // e.g. "1.15% ~ 1.41%"
    stdDevPct: number;
  }[];
  summaryVerdict: string;
}

export interface SharpSideEdge {
  side: 'win' | 'draw' | 'lose' | 'handicap_home' | 'handicap_away' | 'handicap_draw' | 'under' | 'over';
  marketType?: 'match' | 'handicap' | 'underover';
  marketLabel?: string; // e.g. "일반 승무패", "핸디캡 (-1.5)", "언더오버 (2.5)"
  line?: number; // e.g. -1.5, 2.5
  label: string; // e.g. "맨체스C -1.5 마핸", "2.5 오버", "홈승"
  targetOdds: number;
  sharpOdds: number;
  sharpNoVigProb: number; // e.g. 52.4 (%)
  sharpNoVigFairOdds: number; // e.g. 1.91
  modelProb: number; // e.g. 56.8 (%)
  modelFairOdds: number; // e.g. 1.76
  edgePctPoints: number; // modelProb - sharpNoVigProb e.g. +4.4 (%p)
  modelEvPct: number; // (modelProb * targetOdds - 1) * 100
  sharpEvPct: number; // (sharpNoVigProb * targetOdds - 1) * 100
  alphaPct: number; // ((modelProb - sharpNoVigProb) / sharpNoVigProb) * 100
  tier: 'DIAMOND' | 'CONSENSUS' | 'FAIR' | 'TRAP';
  verdict: string;
  actionGuidance: string;
}

export interface SharpHandicapBenchmark {
  line: number;
  lineLabel: string; // e.g. "H -1.5", "H +1.5"
  sharpOdds: { home: number; away: number; draw?: number | null };
  targetOdds: { home: number; away: number; draw?: number | null };
  noVigProbs: { home: number; away: number; draw?: number | null };
  noVigFairOdds: { home: number; away: number; draw?: number | null };
  edges: {
    home: SharpSideEdge;
    away: SharpSideEdge;
    draw?: SharpSideEdge | null;
  };
  bestEdge: SharpSideEdge;
  vigPct: number;
}

export interface SharpUnderOverBenchmark {
  line: number;
  lineLabel: string; // e.g. "2.5골", "8.5점", "165.5점"
  sharpOdds: { under: number; over: number };
  targetOdds: { under: number; over: number };
  noVigProbs: { under: number; over: number };
  noVigFairOdds: { under: number; over: number };
  edges: {
    under: SharpSideEdge;
    over: SharpSideEdge;
  };
  bestEdge: SharpSideEdge;
  vigPct: number;
}

export interface SharpNoVigBenchmark {
  marketType: '3way' | '2way';
  sharpBookmaker: string; // e.g. "Pinnacle (피나클 샤프 라인)"
  rawVigPct: number; // e.g. 2.45 (%)
  payoutPct: number; // e.g. 97.55 (%)
  sharpOdds: {
    win: number;
    draw?: number | null;
    lose: number;
  };
  targetOdds: {
    win: number;
    draw?: number | null;
    lose: number;
  };
  noVigProbs: {
    win: number;
    draw?: number | null;
    lose: number;
  };
  noVigFairOdds: {
    win: number;
    draw?: number | null;
    lose: number;
  };
  methods: {
    multiplicative: { win: number; draw?: number | null; lose: number };
    powerMethod: { win: number; draw?: number | null; lose: number; k: number };
    shinMethod: { win: number; draw?: number | null; lose: number; z: number };
  };
  edges: {
    win: SharpSideEdge;
    draw?: SharpSideEdge | null;
    lose: SharpSideEdge;
  };
  bestEdge: SharpSideEdge;
  handicapBenchmark?: SharpHandicapBenchmark | null;
  underOverBenchmark?: SharpUnderOverBenchmark | null;
  allRankedEdges?: SharpSideEdge[];
  topOverallEdge?: SharpSideEdge;
  marketBestEdges?: {
    match: SharpSideEdge;
    handicap?: SharpSideEdge | null;
    underOver?: SharpSideEdge | null;
  };
  edgeSummaryVerdict: string;
  edgeVerificationChecklist: {
    title: string;
    passed: boolean;
    detail: string;
  }[];
  multiSharpDepth?: {
    pinnacle: { name: string; weight: number; noVigWin: number; noVigLose: number; vigPct: number };
    betfair: { name: string; weight: number; noVigWin: number; noVigLose: number; volumeLiquidityKRW: string };
    betcris: { name: string; weight: number; noVigWin: number; noVigLose: number; limitKRW: string };
    consensusVwapWin: number;
    consensusVwapLose: number;
    depthAccuracyGain: string;
    brierLoss: number;
    calibrationVerdict: string;
  };
}


