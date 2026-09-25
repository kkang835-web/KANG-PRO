// =======================================================================
// Soccer Toto (축구승무패 14경기) Comprehensive Backtest Simulation Engine
// =======================================================================

import { calculateCombinationKL, calculateHammingDistance, generateKLHammingPortfolio } from "./totoOptimizationEngine.js";

export interface HistoricalRoundData {
  roundId: number;
  year: number;
  roundNo: number;
  matches: {
    matchNo: number;
    homeTeam: string;
    awayTeam: string;
    league: string;
    quantProb: [number, number, number]; // [W, D, L]
    marketShare: [number, number, number]; // [W, D, L]
    actualResult: 0 | 1 | 2;
    foreignOdds: [number, number, number];
  }[];
  rank1Payout: number;
  rank2Payout: number;
  rank3Payout: number;
  rank4Payout: number;
  isCarryover: boolean;
}

export function generateSyntheticHistoricalRounds(count: number = 100): HistoricalRoundData[] {
  const rounds: HistoricalRoundData[] = [];
  const leagues = ["EPL", "라리가", "세리에A", "분데스리가", "K리그1"];
  const teams = [
    ["맨체스터 시티", "아스널", "리버풀", "첼시", "토트넘", "맨유", "뉴캐슬", "브라이튼", "웨스트햄", "에버턴"],
    ["레알 마드리드", "바르셀로나", "아틀레티코", "빌바오", "소시에다드", "베티스", "비야레알", "세비야"],
    ["인테르", "유벤투스", "AC밀란", "나폴리", "아탈란타", "로마", "라치오", "피오렌티나"]
  ];

  let seed = 987654321;
  function rnd() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  for (let r = 1; r <= count; r++) {
    const matches = [];
    let surprisesCount = 0;

    for (let m = 1; m <= 14; m++) {
      const lIdx = Math.floor(rnd() * leagues.length);
      const league = leagues[lIdx];
      const tGroup = teams[m % teams.length];
      const homeTeam = tGroup[Math.floor(rnd() * tGroup.length)];
      let awayTeam = tGroup[Math.floor(rnd() * tGroup.length)];
      while (awayTeam === homeTeam) {
        awayTeam = tGroup[Math.floor(rnd() * tGroup.length)];
      }

      // 1. 경기 밸런스 설정 (강팀 vs 약팀, 박빙 등)
      const matchType = rnd();
      let hw = 0.45, dr = 0.28, aw = 0.27;
      if (matchType < 0.35) {
        // 홈 압도적 강팀 (정배)
        hw = 0.65 + rnd() * 0.15;
        dr = 0.15 + rnd() * 0.08;
        aw = 1 - hw - dr;
      } else if (matchType < 0.65) {
        // 박빙 매치 (무승부 다발)
        hw = 0.35 + rnd() * 0.1;
        dr = 0.30 + rnd() * 0.12;
        aw = 1 - hw - dr;
      } else {
        // 원정 우세 매치
        aw = 0.50 + rnd() * 0.18;
        dr = 0.22 + rnd() * 0.1;
        hw = 1 - aw - dr;
      }

      const sumP = hw + dr + aw;
      const quantProb: [number, number, number] = [
        Math.round((hw / sumP) * 1000) / 1000,
        Math.round((dr / sumP) * 1000) / 1000,
        Math.round((aw / sumP) * 1000) / 1000
      ];

      // Market Opinion (Q): 대중의 인기팀 쏠림 현상 반영
      let mw = quantProb[0];
      let md = quantProb[1];
      let ma = quantProb[2];
      if (quantProb[0] >= 0.5) {
        mw = Math.min(0.88, quantProb[0] + 0.18);
        md = quantProb[1] * 0.65;
        ma = 1 - mw - md;
      } else if (quantProb[2] >= 0.5) {
        ma = Math.min(0.85, quantProb[2] + 0.16);
        md = quantProb[1] * 0.65;
        mw = 1 - ma - md;
      } else {
        // 박빙일 때도 대중은 승/패로 쏠리고 무승부를 기피함
        md = quantProb[1] * 0.7;
        const remain = 1 - md;
        mw = remain * (quantProb[0] / (quantProb[0] + quantProb[2]));
        ma = remain * (quantProb[2] / (quantProb[0] + quantProb[2]));
      }

      const sumQ = mw + md + ma;
      const marketShare: [number, number, number] = [
        Math.round((mw / sumQ) * 1000) / 1000,
        Math.round((md / sumQ) * 1000) / 1000,
        Math.round((ma / sumQ) * 1000) / 1000
      ];

      // 실제 결과 추출 (룰렛)
      const roll = rnd();
      let actualResult: 0 | 1 | 2 = 0;
      if (roll < quantProb[0]) actualResult = 0;
      else if (roll < quantProb[0] + quantProb[1]) actualResult = 1;
      else actualResult = 2;

      const publicPick = marketShare[0] >= marketShare[1] && marketShare[0] >= marketShare[2]
        ? 0
        : (marketShare[1] >= marketShare[2] ? 1 : 2);
      if (actualResult !== publicPick) surprisesCount++;

      matches.push({
        matchNo: m,
        homeTeam,
        awayTeam,
        league,
        quantProb,
        marketShare,
        actualResult,
        foreignOdds: [
          Math.round((1 / Math.max(0.01, quantProb[0])) * 100) / 100,
          Math.round((1 / Math.max(0.01, quantProb[1])) * 100) / 100,
          Math.round((1 / Math.max(0.01, quantProb[2])) * 100) / 100
        ] as [number, number, number]
      });
    }

    let isCarryover = false;
    let rank1Payout = 0;
    let rank2Payout = 0;
    let rank3Payout = 0;
    let rank4Payout = 0;

    if (surprisesCount >= 6) {
      if (rnd() < 0.65) {
        isCarryover = true;
        rank1Payout = 0;
      } else {
        rank1Payout = Math.round(1800000000 + rnd() * 2500000000);
      }
      rank2Payout = Math.round(30000000 + rnd() * 60000000);
      rank3Payout = Math.round(2000000 + rnd() * 4000000);
      rank4Payout = Math.round(150000 + rnd() * 350000);
    } else if (surprisesCount >= 3) {
      rank1Payout = Math.round(550000000 + rnd() * 750000000);
      rank2Payout = Math.round(12000000 + rnd() * 25000000);
      rank3Payout = Math.round(750000 + rnd() * 1500000);
      rank4Payout = Math.round(60000 + rnd() * 120000);
    } else {
      rank1Payout = Math.round(45000000 + rnd() * 80000000);
      rank2Payout = Math.round(1200000 + rnd() * 2500000);
      rank3Payout = Math.round(120000 + rnd() * 250000);
      rank4Payout = Math.round(15000 + rnd() * 35000);
    }

    rounds.push({
      roundId: r,
      year: 2024,
      roundNo: r,
      matches,
      rank1Payout,
      rank2Payout,
      rank3Payout,
      rank4Payout,
      isCarryover
    });
  }

  return rounds;
}

export interface StrategyPerformance {
  name: string;
  totalRounds: number;
  budgetPerRound: number;
  totalCost: number;
  totalReturn: number;
  netProfit: number;
  roi: number;
  rank1Hits: number;
  rank2Hits: number;
  rank3Hits: number;
  rank4Hits: number;
  maxDrawdown: number;
  sharpeRatio: number;
  equityCurve: number[];
}

export function runComprehensiveTotoBacktest(rounds: HistoricalRoundData[]): {
  publicFavoriteStrategy: StrategyPerformance;
  shannonEntropyStrategy: StrategyPerformance;
  klHammingStrategy: StrategyPerformance;
} {
  const BUDGET_PER_ROUND = 50000;

  function createTracker(name: string): StrategyPerformance {
    return {
      name,
      totalRounds: rounds.length,
      budgetPerRound: BUDGET_PER_ROUND,
      totalCost: 0,
      totalReturn: 0,
      netProfit: 0,
      roi: 0,
      rank1Hits: 0,
      rank2Hits: 0,
      rank3Hits: 0,
      rank4Hits: 0,
      maxDrawdown: 0,
      sharpeRatio: 0,
      equityCurve: [0]
    };
  }

  const stratFavorite = createTracker("대중 1위 투표율 단순 추종 (Public Favorite)");
  const stratShannon = createTracker("기존 섀넌 엔트로피 컷오프 (Shannon Entropy)");
  const stratKLHamming = createTracker("KL-Divergence + 해밍 Set Cover (업그레이드 퀀트)");

  const returnsFavorite: number[] = [];
  const returnsShannon: number[] = [];
  const returnsKLHamming: number[] = [];

  for (const round of rounds) {
    const actualResults = round.matches.map(m => m.actualResult);
    const quantProbs = round.matches.map(m => m.quantProb);
    const marketProbs = round.matches.map(m => m.marketShare);

    // 퀀트 엔진의 지능형 복식 전개 (박빙/이변 위험도 높은 경기에 복식 2~3지선다 할당)
    // 5개 경기 복식(2개씩) + 1개 경기 삼식(3개) + 8경기 단통 = 2^5 * 3 = 96개 카테시안 기본 공간
    const matchEntropies = round.matches.map((m, idx) => {
      const q = m.quantProb;
      const ent = -q.reduce((acc, p) => acc + (p > 0 ? p * Math.log2(p) : 0), 0);
      return { idx, ent, quantProb: q, marketShare: m.marketShare };
    });
    matchEntropies.sort((a, b) => b.ent - a.ent); // 불확실성 높은 순

    const highUncertaintyIdxs = new Set(matchEntropies.slice(0, 5).map(e => e.idx));
    const highestUncertaintyIdx = matchEntropies[0]?.idx;

    const userSelections: number[][] = round.matches.map((m, idx) => {
      const q = m.quantProb;
      const sortedOutcomes = [0, 1, 2].sort((a, b) => q[b] - q[a]);
      if (idx === highestUncertaintyIdx) {
        return [0, 1, 2]; // 3지선다
      }
      if (highUncertaintyIdxs.has(idx)) {
        return [sortedOutcomes[0], sortedOutcomes[1]]; // 2지선다 복식
      }
      return [sortedOutcomes[0]]; // 단통
    });

    // -------------------------------------------------------------
    // 전략 A: 대중 1위 투표율 단순 정배 추종 (50장)
    // -------------------------------------------------------------
    const favCombos: number[][] = [];
    const publicTopPicks = round.matches.map(m => {
      const ms = m.marketShare;
      return ms[0] >= ms[1] && ms[0] >= ms[2] ? 0 : (ms[1] >= ms[2] ? 1 : 2);
    });
    for (let i = 0; i < 50; i++) {
      const c = [...publicTopPicks];
      if (i > 0) {
        const modIdx = i % 14;
        c[modIdx] = ((c[modIdx] + (i % 2 === 0 ? 1 : 2)) % 3) as (0 | 1 | 2);
      }
      favCombos.push(c);
    }

    // -------------------------------------------------------------
    // 전략 B: 섀넌 엔트로피 기반 컷오프 (50장)
    // -------------------------------------------------------------
    function getCartesian(arr: number[][]): number[][] {
      return arr.reduce<number[][]>((acc, curr) => acc.flatMap(a => curr.map(c => [...a, c])), [[]]);
    }
    const allCandidates = getCartesian(userSelections);

    function getEntropy(combo: number[]): number {
      let ent = 0;
      for (let i = 0; i < combo.length; i++) {
        const p = quantProbs[i][combo[i]];
        ent -= p * Math.log2(Math.max(p, 1e-9));
      }
      return ent;
    }
    const shannonScored = allCandidates.map(c => ({ combo: c, entropy: getEntropy(c) }));
    shannonScored.sort((a, b) => a.entropy - b.entropy);
    const shannonCombos = shannonScored.slice(0, 50).map(s => s.combo);

    // -------------------------------------------------------------
    // 전략 C: 업그레이드 KL-Divergence + 해밍 거리 (>=3) Set Cover
    // -------------------------------------------------------------
    const klResult = generateKLHammingPortfolio(userSelections, quantProbs, marketProbs, {
      minKL: 0.12,
      maxKL: 0.88,
      minHammingDist: 3,
      maxPortfolioSize: 50
    });
    const klCombos = klResult.finalPortfolio.map(p => p.combo);

    // -------------------------------------------------------------
    // 결과 평가
    // -------------------------------------------------------------
    function evaluateStrategy(combos: number[][], tracker: StrategyPerformance, returnList: number[]) {
      tracker.totalCost += BUDGET_PER_ROUND;
      let roundPayout = 0;

      for (const combo of combos) {
        let correctCount = 0;
        for (let i = 0; i < 14; i++) {
          if (combo[i] === actualResults[i]) {
            correctCount++;
          }
        }

        if (correctCount === 14) {
          tracker.rank1Hits++;
          roundPayout += round.rank1Payout;
        } else if (correctCount === 13) {
          tracker.rank2Hits++;
          roundPayout += round.rank2Payout;
        } else if (correctCount === 12) {
          tracker.rank3Hits++;
          roundPayout += round.rank3Payout;
        } else if (correctCount === 11) {
          tracker.rank4Hits++;
          roundPayout += round.rank4Payout;
        }
      }

      tracker.totalReturn += roundPayout;
      const net = tracker.totalReturn - tracker.totalCost;
      tracker.equityCurve.push(net);
      returnList.push(roundPayout - BUDGET_PER_ROUND);
    }

    evaluateStrategy(favCombos, stratFavorite, returnsFavorite);
    evaluateStrategy(shannonCombos, stratShannon, returnsShannon);
    evaluateStrategy(klCombos, stratKLHamming, returnsKLHamming);
  }

  function finalizeMetrics(tracker: StrategyPerformance, returns: number[]) {
    tracker.netProfit = tracker.totalReturn - tracker.totalCost;
    tracker.roi = Math.round((tracker.netProfit / tracker.totalCost) * 10000) / 100;

    let peak = 0;
    let maxDd = 0;
    for (const val of tracker.equityCurve) {
      if (val > peak) peak = val;
      const dd = peak - val;
      if (dd > maxDd) maxDd = dd;
    }
    tracker.maxDrawdown = Math.round(maxDd);

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    tracker.sharpeRatio = stdDev > 0 ? Math.round((mean / stdDev) * 100) / 100 : 0;
  }

  finalizeMetrics(stratFavorite, returnsFavorite);
  finalizeMetrics(stratShannon, returnsShannon);
  finalizeMetrics(stratKLHamming, returnsKLHamming);

  return {
    publicFavoriteStrategy: stratFavorite,
    shannonEntropyStrategy: stratShannon,
    klHammingStrategy: stratKLHamming
  };
}

const testRounds = generateSyntheticHistoricalRounds(100);
const backtestResult = runComprehensiveTotoBacktest(testRounds);

console.log("===============================================================================");
console.log("          축구승무패 14경기 100개 회차 퀀트 백테스트 시뮬레이션 검증 보고서        ");
console.log("===============================================================================");
console.log(`■ 검증 대상 회차: 총 ${testRounds.length}개 회차 (총 ${testRounds.length * 14}개 경기 실전 시뮬레이션)`);
console.log(`■ 회차당 투자금: 50,000원 (총 누적 투자금: ${(testRounds.length * 50000).toLocaleString()}원)`);
console.log("-------------------------------------------------------------------------------");
console.log("| 지표 항목                  | 1. 대중 1위 정배 추종 | 2. 섀넌 엔트로피 필터 | 3. KL+해밍 퀀트 (신규) |");
console.log("-------------------------------------------------------------------------------");
console.log(`| 총 환급금 (Total Return)   | ${backtestResult.publicFavoriteStrategy.totalReturn.toLocaleString().padStart(17)}원 | ${backtestResult.shannonEntropyStrategy.totalReturn.toLocaleString().padStart(17)}원 | ${backtestResult.klHammingStrategy.totalReturn.toLocaleString().padStart(18)}원 |`);
console.log(`| 순수익 (Net Profit)        | ${backtestResult.publicFavoriteStrategy.netProfit.toLocaleString().padStart(17)}원 | ${backtestResult.shannonEntropyStrategy.netProfit.toLocaleString().padStart(17)}원 | ${backtestResult.klHammingStrategy.netProfit.toLocaleString().padStart(18)}원 |`);
console.log(`| 누적 수익률 (ROI)          | ${(backtestResult.publicFavoriteStrategy.roi + "%").padStart(18)} | ${(backtestResult.shannonEntropyStrategy.roi + "%").padStart(18)} | ${(backtestResult.klHammingStrategy.roi + "%").padStart(19)} |`);
console.log(`| 1등 적중 (14경기 All)      | ${(backtestResult.publicFavoriteStrategy.rank1Hits + "회").padStart(18)} | ${(backtestResult.shannonEntropyStrategy.rank1Hits + "회").padStart(18)} | ${(backtestResult.klHammingStrategy.rank1Hits + "회").padStart(19)} |`);
console.log(`| 2등 적중 (13경기)          | ${(backtestResult.publicFavoriteStrategy.rank2Hits + "회").padStart(18)} | ${(backtestResult.shannonEntropyStrategy.rank2Hits + "회").padStart(18)} | ${(backtestResult.klHammingStrategy.rank2Hits + "회").padStart(19)} |`);
console.log(`| 3등 적중 (12경기)          | ${(backtestResult.publicFavoriteStrategy.rank3Hits + "회").padStart(18)} | ${(backtestResult.shannonEntropyStrategy.rank3Hits + "회").padStart(18)} | ${(backtestResult.klHammingStrategy.rank3Hits + "회").padStart(19)} |`);
console.log(`| 4등 적중 (11경기)          | ${(backtestResult.publicFavoriteStrategy.rank4Hits + "회").padStart(18)} | ${(backtestResult.shannonEntropyStrategy.rank4Hits + "회").padStart(18)} | ${(backtestResult.klHammingStrategy.rank4Hits + "회").padStart(19)} |`);
console.log(`| 최대 낙폭 (MDD)            | ${backtestResult.publicFavoriteStrategy.maxDrawdown.toLocaleString().padStart(17)}원 | ${backtestResult.shannonEntropyStrategy.maxDrawdown.toLocaleString().padStart(17)}원 | ${backtestResult.klHammingStrategy.maxDrawdown.toLocaleString().padStart(18)}원 |`);
console.log(`| 샤프 지수 (Sharpe Ratio)   | ${backtestResult.publicFavoriteStrategy.sharpeRatio.toFixed(2).padStart(18)} | ${backtestResult.shannonEntropyStrategy.sharpeRatio.toFixed(2).padStart(18)} | ${backtestResult.klHammingStrategy.sharpeRatio.toFixed(2).padStart(19)} |`);
console.log("===============================================================================");
