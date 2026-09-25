import React, { useState, useEffect, useMemo } from 'react';
import { TotoType, TotoRoundInfo, MatchItem, TotoPortfolioResult, TotoMatch } from '../types';
import { resolveRoundByDate, getTodayDateString } from '../utils/calendarRoundResolver';
import { 
  Trophy, RefreshCw, Sparkles, RotateCcw, Zap, Target, 
  ChevronLeft, ChevronRight, Brain, AlertTriangle, ShieldCheck, 
  CheckCircle2, TrendingUp, Info, Check, Coins, Layers, ArrowUpRight, Award, Copy
} from 'lucide-react';

interface TotoTableProps {
  selectedTotoType: TotoType;
  selectedYear: number;
  selectedRound: number;
  onSelectTotoType: (t: TotoType) => void;
  onYearChange: (y: number) => void;
  onRoundChange: (r: number) => void;
  onOpenQuantModal: (match: MatchItem) => void;
  onOpenPortfolioWithPicks?: (type: TotoType, year: number, round: number, picks: Record<number, ('win'|'draw'|'lose')[]>) => void;
}

export type StrategyRole = 
  | 'anchor_home' 
  | 'anchor_away' 
  | 'fake_favorite_defense' 
  | 'draw_hidden_value' 
  | 'tight_match_double' 
  | 'clutch_game_double' 
  | 'general_single';

export interface MatchStrategyMeta {
  role: StrategyRole;
  badgeLabel: string;
  badgeColor: string;
  description: string;
  dataReason?: string;
  recommendedPicks: ('win' | 'draw' | 'lose')[];
}

export interface PortfolioPreset {
  cost: number;
  combinations: number;
  doubles: number;
  triples: number;
  label: string;
  sub: string;
  isSweetSpot?: boolean;
  isCarryoverTarget?: boolean;
}

export const PORTFOLIO_PRESETS: PortfolioPreset[] = [
  { cost: 1000, combinations: 1, doubles: 0, triples: 0, label: '1,000원', sub: '프로토 14경기 단통 축' },
  { cost: 2000, combinations: 2, doubles: 1, triples: 0, label: '2,000원', sub: '단통 13 + 박빙 복식 1' },
  { cost: 4000, combinations: 4, doubles: 2, triples: 0, label: '4,000원', sub: '실속: 단통 12 + 박빙 복식 2' },
  { cost: 8000, combinations: 8, doubles: 3, triples: 0, label: '8,000원', sub: '★ 바벨: 단통 11 + 박빙 복식 3', isSweetSpot: true },
  { cost: 16000, combinations: 16, doubles: 4, triples: 0, label: '16,000원', sub: '정밀: 단통 10 + 박빙 복식 4' },
  { cost: 24000, combinations: 24, doubles: 3, triples: 1, label: '24,000원', sub: '단통 10 + 복식 3 + 삼식 1' },
  { cost: 32000, combinations: 32, doubles: 5, triples: 0, label: '32,000원', sub: '스나이퍼: 단통 9 + 박빙 복식 5' },
  { cost: 48000, combinations: 48, doubles: 4, triples: 1, label: '48,000원', sub: '★ 이월대비: 단통 9 + 복식 4 + 삼식 1', isCarryoverTarget: true },
  { cost: 64000, combinations: 64, doubles: 6, triples: 0, label: '64,000원', sub: '단통 8 + 박빙 복식 6' },
  { cost: 96000, combinations: 96, doubles: 5, triples: 1, label: '96,000원', sub: '단통 8 + 복식 5 + 삼식 1' },
];

/**
 * 14경기 결합 확률 공간 & 1등 당첨자수(≤5명 독식) 제약 조건 기반 퀀트 포트폴리오 자동 마킹 엔진
 * - targetDoubles (복식 수), targetTriples (삼식 수)
 * - iterationIndex: 클릭할 때마다(0, 1, 2, 3...) 결합 확률 공간에서 상위 랭크의 새로운 조합을 순차적으로 탐색 및 생성
 */
export function computeBayesianLogitPortfolio(
  type: TotoType,
  matches: TotoMatch[],
  targetDoubles: number = 4,
  iterationIndex: number = 0,
  targetTriples: number = 0
): {
  picks: Record<number, ('win' | 'draw' | 'lose')[]>;
  strategyMetas: Record<number, MatchStrategyMeta>;
  combinationRank: number;
} {
  const picks: Record<number, ('win' | 'draw' | 'lose')[]> = {};
  const strategyMetas: Record<number, MatchStrategyMeta> = {};

  if (!matches || matches.length === 0) {
    return { picks, strategyMetas, combinationRank: 1 };
  }

  const isBaseball = type === 'bs';
  const isBasketball = type === 'bk';
  const drawSymbol = isBaseball ? '1' : (isBasketball ? '5' : '무');

  const totalLinesSold = 3500000;
  const maxAllowedWinners = 5.0; // 1등 독식(≤5명) 상한선

  interface MatchProbMeta {
    matchNo: number;
    match: TotoMatch;
    pBayes: { win: number; draw: number; lose: number };
    qVote: { win: number; draw: number; lose: number };
    firstPick: 'win' | 'draw' | 'lose';
    secondPick: 'win' | 'draw' | 'lose';
    thirdPick: 'win' | 'draw' | 'lose';
    evRatio: { win: number; draw: number; lose: number };
    marginLoss: number;
    hedgeUrgency: number;
    publicOverheat: number;
    isAnchorCandidate: boolean;
  }

  // 1. Compute Bayesian Posterior Probabilities and Logit Weights for all 14 matches
  const matchMetas: MatchProbMeta[] = matches.map(m => {
    const pWinVote = Math.max(0.01, m.voteRate.win / 100);
    const pDrawVote = Math.max(0.01, m.voteRate.draw / 100);
    const pLoseVote = Math.max(0.01, m.voteRate.lose / 100);

    let pOddsWin = pWinVote;
    let pOddsDraw = pDrawVote;
    let pOddsLose = pLoseVote;

    if (isBaseball || isBasketball) {
      const domWin = typeof m.domesticOdds?.win === 'number' && m.domesticOdds.win > 1.0 ? m.domesticOdds.win : 0;
      const domLose = typeof m.domesticOdds?.lose === 'number' && m.domesticOdds.lose > 1.0 ? m.domesticOdds.lose : 0;
      const forWin = typeof m.foreignOdds?.win === 'number' && m.foreignOdds.win > 1.0 ? m.foreignOdds.win : 0;
      const forLose = typeof m.foreignOdds?.lose === 'number' && m.foreignOdds.lose > 1.0 ? m.foreignOdds.lose : 0;

      const effWin = domWin > 1.0 ? domWin : (forWin > 1.0 ? forWin : 0);
      const effLose = domLose > 1.0 ? domLose : (forLose > 1.0 ? forLose : 0);

      let ratioWin = pWinVote / ((pWinVote + pLoseVote) || 1);
      let ratioLose = pLoseVote / ((pWinVote + pLoseVote) || 1);

      if (effWin > 1.0 && effLose > 1.0) {
        const rawW = 1 / effWin;
        const rawL = 1 / effLose;
        const sum2 = rawW + rawL;
        ratioWin = rawW / sum2;
        ratioLose = rawL / sum2;
      }

      const winLoseDiff = Math.abs(pWinVote - pLoseVote) * 100;
      const closenessFactor = Math.max(0, (30 - winLoseDiff) * 0.003);
      pOddsDraw = Math.max(0.12, Math.min(0.42, pDrawVote + closenessFactor));
      
      const remain = Math.max(0.01, 1.0 - pOddsDraw);
      pOddsWin = remain * ratioWin;
      pOddsLose = remain * ratioLose;
    } else {
      const domWin = typeof m.domesticOdds?.win === 'number' && m.domesticOdds.win > 1.0 ? m.domesticOdds.win : 0;
      const domDraw = typeof m.domesticOdds?.draw === 'number' && m.domesticOdds.draw > 1.0 ? m.domesticOdds.draw : 0;
      const domLose = typeof m.domesticOdds?.lose === 'number' && m.domesticOdds.lose > 1.0 ? m.domesticOdds.lose : 0;

      const forWin = typeof m.foreignOdds?.win === 'number' && m.foreignOdds.win > 1.0 ? m.foreignOdds.win : 0;
      const forDraw = typeof m.foreignOdds?.draw === 'number' && m.foreignOdds.draw > 1.0 ? m.foreignOdds.draw : 0;
      const forLose = typeof m.foreignOdds?.lose === 'number' && m.foreignOdds.lose > 1.0 ? m.foreignOdds.lose : 0;

      const effWin = domWin > 1.0 ? domWin : (forWin > 1.0 ? forWin : 0);
      const effDraw = domDraw > 1.0 ? domDraw : (forDraw > 1.0 ? forDraw : 0);
      const effLose = domLose > 1.0 ? domLose : (forLose > 1.0 ? forLose : 0);

      if (effWin > 1.0 && effDraw > 1.0 && effLose > 1.0) {
        const rawW = 1 / effWin;
        const rawD = 1 / effDraw;
        const rawL = 1 / effLose;
        const sum3 = rawW + rawD + rawL;
        pOddsWin = rawW / sum3;
        pOddsDraw = rawD / sum3;
        pOddsLose = rawL / sum3;
      }
    }

    // Bayesian Dirichlet-Multinomial fusion: Prior(Odds 60%) + Likelihood(Vote 40%)
    const rawBayesWin = Math.pow(pOddsWin, 0.60) * Math.pow(pWinVote, 0.40);
    const rawBayesDraw = Math.pow(pOddsDraw, 0.60) * Math.pow(pDrawVote, 0.40);
    const rawBayesLose = Math.pow(pOddsLose, 0.60) * Math.pow(pLoseVote, 0.40);
    const sumBayes = rawBayesWin + rawBayesDraw + rawBayesLose;

    const pBayes = {
      win: rawBayesWin / sumBayes,
      draw: rawBayesDraw / sumBayes,
      lose: rawBayesLose / sumBayes,
    };

    const qVote = {
      win: pWinVote,
      draw: pDrawVote,
      lose: pLoseVote
    };

    const evRatio = {
      win: pBayes.win / pWinVote,
      draw: pBayes.draw / pDrawVote,
      lose: pBayes.lose / pLoseVote
    };

    // Sort outcomes by Bayesian joint probability
    const outcomes: ('win' | 'draw' | 'lose')[] = ['win', 'draw', 'lose'];
    outcomes.sort((a, b) => pBayes[b] - pBayes[a]);

    const firstPick = outcomes[0];
    const secondPick = outcomes[1];
    const thirdPick = outcomes[2];

    const marginLoss = Math.max(0.001, Math.log(pBayes[firstPick] + 0.001) - Math.log(pBayes[secondPick] + 0.001));

    // Public Overheat & Hedge Urgency
    const publicOverheat = Math.max(0, (pWinVote * 100) - (pOddsWin * 100));
    const winLoseDiff = Math.abs(m.voteRate.win - m.voteRate.lose);
    const entropy = -((pBayes.win * Math.log(pBayes.win + 0.001)) + (pBayes.draw * Math.log(pBayes.draw + 0.001)) + (pBayes.lose * Math.log(pBayes.lose + 0.001)));
    const hedgeUrgency = (entropy * 50) + (100 - winLoseDiff) * 0.6 + (publicOverheat * 1.5) + (m.voteRate.draw * 1.2) + (evRatio.draw * 15);

    const isAnchorCandidate = (m.voteRate.win >= 65 || m.voteRate.lose >= 60 || pBayes[firstPick] >= 0.62) && publicOverheat < 10;

    return {
      matchNo: m.matchNo,
      match: m,
      pBayes,
      qVote,
      firstPick,
      secondPick,
      thirdPick,
      evRatio,
      marginLoss,
      hedgeUrgency,
      publicOverheat,
      isAnchorCandidate,
    };
  });

  const numTriples = Math.max(0, Math.min(2, Math.min(14, targetTriples)));
  const numDoubles = Math.max(0, Math.min(8, Math.min(14 - numTriples, targetDoubles)));

  // 2. Rank candidate matches for double/triple-hedging (highest hedge urgency first)
  const sortedByHedge = [...matchMetas].sort((a, b) => b.hedgeUrgency - a.hedgeUrgency);
  const sortedByEV = [...matchMetas].sort((a, b) => {
    const maxEVA = Math.max(a.evRatio.win, a.evRatio.draw, a.evRatio.lose);
    const maxEVB = Math.max(b.evRatio.win, b.evRatio.draw, b.evRatio.lose);
    return maxEVB - maxEVA;
  });

  // 3. Mathematical Allocation of Triples and Doubles
  let chosenTripleMatchNos: number[] = [];
  if (numTriples > 0) {
    const tripleOffset = (iterationIndex % 2 === 1 && sortedByHedge.length > numTriples) ? 1 : 0;
    chosenTripleMatchNos = sortedByHedge.slice(tripleOffset, tripleOffset + numTriples).map(m => m.matchNo);
  }

  const candidateForDoubles = sortedByHedge.filter(m => !chosenTripleMatchNos.includes(m.matchNo));

  let chosenDoubleMatchNos: number[] = [];
  if (numDoubles > 0) {
    const maxShift = Math.max(1, candidateForDoubles.length - numDoubles);
    const shiftOffset = iterationIndex % maxShift;
    chosenDoubleMatchNos = candidateForDoubles.slice(shiftOffset, shiftOffset + numDoubles).map(m => m.matchNo);
    if (chosenDoubleMatchNos.length < numDoubles) {
      chosenDoubleMatchNos = candidateForDoubles.slice(0, numDoubles).map(m => m.matchNo);
    }
  }

  // 4. Calculate initial combination and expected winners
  const tempPicks: Record<number, ('win' | 'draw' | 'lose')[]> = {};

  matchMetas.forEach(meta => {
    if (chosenTripleMatchNos.includes(meta.matchNo)) {
      tempPicks[meta.matchNo] = ['win', 'draw', 'lose'];
    } else if (chosenDoubleMatchNos.includes(meta.matchNo)) {
      if (meta.firstPick === 'draw' || meta.secondPick === 'draw') {
        tempPicks[meta.matchNo] = [meta.firstPick, meta.secondPick];
      } else if (meta.pBayes.draw >= 0.20 || meta.match.voteRate.draw >= 20 || meta.publicOverheat >= 10) {
        tempPicks[meta.matchNo] = [meta.firstPick, 'draw'];
      } else {
        tempPicks[meta.matchNo] = [meta.firstPick, meta.secondPick];
      }
    } else {
      tempPicks[meta.matchNo] = [meta.firstPick];
    }
  });

  // Calculate current expected winners
  const calcExpectedWinners = (p: Record<number, ('win' | 'draw' | 'lose')[]>) => {
    let probMass = 1.0;
    let combos = 1;
    matchMetas.forEach(m => {
      const matchPicks = p[m.matchNo] || [m.firstPick];
      combos *= matchPicks.length;
      let sumVoteProb = 0;
      matchPicks.forEach(pk => {
        sumVoteProb += (m.match.voteRate[pk] || 0) / 100;
      });
      probMass *= sumVoteProb;
    });
    return totalLinesSold * (probMass / Math.max(1, combos));
  };

  let currentWinners = calcExpectedWinners(tempPicks);

  // 5. Anti-Dilution & Dynamic Iteration Exploration (Underdogs 역배, Draws 무승부/1점차/5점차)
  const singleMatches = matchMetas.filter(
    m => !chosenTripleMatchNos.includes(m.matchNo) && !chosenDoubleMatchNos.includes(m.matchNo)
  );

  // Sort single matches by efficiency: (Drop in Expected Winners) / (Loss in True Bayes Prob)
  const sortedAntiDilution = [...singleMatches].sort((a, b) => {
    const aVoteRatio = a.qVote[a.firstPick] / Math.max(0.01, a.qVote[a.secondPick]);
    const bVoteRatio = b.qVote[b.firstPick] / Math.max(0.01, b.qVote[b.secondPick]);
    return bVoteRatio - aVoteRatio;
  });

  // Sort single matches by highest EV ratio of the 2nd/3rd underdog outcomes (역배 기대치 순)
  const sortedByUnderdogEV = [...singleMatches].sort((a, b) => {
    const maxUnderdogA = Math.max(a.evRatio[a.secondPick], a.evRatio[a.thirdPick]);
    const maxUnderdogB = Math.max(b.evRatio[b.secondPick], b.evRatio[b.thirdPick]);
    return maxUnderdogB - maxUnderdogA;
  });

  let flipCount = 0;
  let flipMatchNos: number[] = [];
  let underdogMatchNos: number[] = [];

  // Enforce expectedWinners <= 5.0 for base monopoly condition
  while (currentWinners > maxAllowedWinners && flipCount < sortedAntiDilution.length) {
    const candidate = sortedAntiDilution[flipCount];
    if (candidate) {
      tempPicks[candidate.matchNo] = [candidate.secondPick];
      flipMatchNos.push(candidate.matchNo);
      currentWinners = calcExpectedWinners(tempPicks);
    }
    flipCount++;
  }

  // If iterationIndex > 0, systematically explore distinct high-EV underdog / draw pathways
  if (iterationIndex > 0 && singleMatches.length > 0) {
    const shiftStep = iterationIndex;
    
    // Rotate 1~2 single matches to secondPick (Draw/Tight margin) or thirdPick (Reverse Underdog 역배)
    const targetIdx1 = (shiftStep - 1) % sortedByUnderdogEV.length;
    const cand1 = sortedByUnderdogEV[targetIdx1];
    if (cand1) {
      // For odd iterations, pick 2nd pick (Draw/Close margin); for even iterations >= 2, pick 3rd pick (High-payoff Underdog 역배)
      const pickToUse = (shiftStep % 2 === 0 && cand1.evRatio[cand1.thirdPick] > 0.8) ? cand1.thirdPick : cand1.secondPick;
      tempPicks[cand1.matchNo] = [pickToUse];
      if (pickToUse === cand1.thirdPick) {
        underdogMatchNos.push(cand1.matchNo);
      } else {
        flipMatchNos.push(cand1.matchNo);
      }
    }

    // For higher iterations (3+), rotate a 2nd single match to diversify portfolio
    if (shiftStep >= 3 && sortedByUnderdogEV.length > 1) {
      const targetIdx2 = (shiftStep) % sortedByUnderdogEV.length;
      const cand2 = sortedByUnderdogEV[targetIdx2];
      if (cand2 && cand2.matchNo !== cand1?.matchNo) {
        const pickToUse2 = cand2.secondPick;
        tempPicks[cand2.matchNo] = [pickToUse2];
        flipMatchNos.push(cand2.matchNo);
      }
    }
  }

  // 6. Finalize picks and Strategy Metas
  matchMetas.forEach(meta => {
    const isTriple = chosenTripleMatchNos.includes(meta.matchNo);
    const isDouble = chosenDoubleMatchNos.includes(meta.matchNo);
    const isFlipped = flipMatchNos.includes(meta.matchNo);
    const isUnderdog = underdogMatchNos.includes(meta.matchNo);

    let role: StrategyRole = 'general_single';
    let badgeLabel = '📌 밸류 단통';
    let badgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
    let description = '기대값(EV) 최적 단통 1순위 마킹';

    if (meta.pBayes.win >= 0.60 || meta.match.voteRate.win >= 62) {
      role = 'anchor_home';
      badgeLabel = '🏆 홈 우세 단통 [승]';
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      description = '홈팀 전력 우세 및 승률 최상위 (단통 승 축)';
    } else if (meta.pBayes.lose >= 0.55 || meta.match.voteRate.lose >= 58) {
      role = 'anchor_away';
      badgeLabel = '🏆 원정 우세 단통 [패]';
      badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      description = '원정 강팀 안정적 수비 및 전력 우위 (단통 패 축)';
    } else if (meta.publicOverheat >= 12) {
      role = 'fake_favorite_defense';
      badgeLabel = `🛡️ 가짜 정배 방어 [${drawSymbol}/패]`;
      badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
      description = `대중 과열 거품 매치 → 역배/${drawSymbol} 헷징 방어`;
    } else if (meta.pBayes.draw >= 0.25 || meta.match.voteRate.draw >= 25) {
      role = 'draw_hidden_value';
      badgeLabel = isBaseball ? '⚖️ 1점차 은폐 밸류' : (isBasketball ? '⚖️ 5점차 은폐 밸류' : '⚖️ 무승부 은폐 밸류');
      badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
      description = isBaseball ? '야구 1점차 박빙 승부처 방어망' : (isBasketball ? '농구 5점차 접전 승부처 방어망' : '축구 저득점 무승부 흐름 방어망');
    } else if (Math.abs(meta.match.voteRate.win - meta.match.voteRate.lose) < 18) {
      role = isBaseball ? 'tight_match_double' : (isBasketball ? 'clutch_game_double' : 'tight_match_double');
      badgeLabel = isBaseball ? '⚾ 1점차 박빙' : (isBasketball ? '🏀 5점차 접전' : '⚡ 팽팽한 접전');
      badgeColor = 'bg-indigo-100 text-indigo-800 border-indigo-300';
      description = '상대 전적 및 지표 팽팽한 복식 방어망';
    }

    // Intuitive Quant Strategy Badge Classification (User-Centric Indicators)
    const isDrawSteamMove = meta.evRatio.draw > 1.22 || (meta.pBayes.draw >= 0.28 && meta.qVote.draw <= 0.24);
    const isUnderdogAlert = (meta.firstPick !== 'win' && meta.pBayes.lose >= 0.32 && meta.match.voteRate.win >= 52) || isUnderdog;
    const isLowScoreClutch = (isBaseball ? meta.pBayes.draw >= 0.22 : (isBasketball ? meta.pBayes.draw >= 0.24 : meta.pBayes.draw >= 0.26));
    const isH2HTight = Math.abs(meta.match.voteRate.win - meta.match.voteRate.lose) < 16;
    const isPublicOverheat = meta.publicOverheat >= 12;
    const isHighEV = meta.evRatio[meta.firstPick] > 1.15;

    const drawTruePercent = (meta.pBayes.draw * 100).toFixed(1);
    const drawVotePercent = (meta.qVote.draw * 100).toFixed(1);
    const drawEVRatio = meta.evRatio.draw.toFixed(2);
    const winLoseDiff = Math.abs(meta.match.voteRate.win - meta.match.voteRate.lose).toFixed(1);

    let baseBadgeLabel = '📌 밸류 단통';
    let baseBadgeColor = 'bg-slate-100 text-slate-800 border-slate-300 font-bold';
    let baseDescription = '기대값(EV) 최적 단통 1순위 마킹';
    let baseDataReason = `해외 오즈 승률 ${(meta.pBayes[meta.firstPick] * 100).toFixed(1)}% vs 대중 투표 ${(meta.qVote[meta.firstPick] * 100).toFixed(1)}%`;

    if (isDrawSteamMove) {
      baseBadgeLabel = `🔥 무승부 배당 우위 [${drawSymbol}]`;
      baseBadgeColor = 'bg-amber-100 text-amber-950 border-amber-400 font-black';
      baseDescription = '해외 배당 확률이 대중 투표율 대비 수치상 대폭 우세';
      baseDataReason = `해외 오즈 승률 ${drawTruePercent}% vs 대중 투표 ${drawVotePercent}% (EV ${drawEVRatio}배)`;
    } else if (isUnderdogAlert) {
      baseBadgeLabel = `⚡ 역배 확률 경보 [패]`;
      baseBadgeColor = 'bg-rose-100 text-rose-900 border-rose-400 font-black';
      baseDescription = '정배 거품 포착 & 역배 승률 급상승 이변 감지';
      baseDataReason = `정배 투표 ${meta.match.voteRate.win}% 과열 vs 역배 승률 ${(meta.pBayes.lose * 100).toFixed(1)}%`;
    } else if (isLowScoreClutch) {
      baseBadgeLabel = isBaseball ? '⚾ 1점차 접전 [1]' : (isBasketball ? '🏀 5점차 접전 [5]' : '🔒 저득점 박빙 [무]');
      baseBadgeColor = 'bg-indigo-100 text-indigo-950 border-indigo-300 font-black';
      baseDescription = '저득점 팽팽한 흐름 & 무승부/박빙 가능성 우세';
      baseDataReason = `무승부 해외 승률 ${drawTruePercent}% (승/패 투표차 ${winLoseDiff}%p 백중세)`;
    } else if (isH2HTight) {
      baseBadgeLabel = '⚔️ 상대전적 팽팽 [박빙]';
      baseBadgeColor = 'bg-sky-100 text-sky-950 border-sky-300 font-black';
      baseDescription = '양 팀 전력 및 상성 맞대결 지표 팽팽한 승부처';
      baseDataReason = `승/패 투표차 단 ${winLoseDiff}%p (상대전적 및 승률 팽팽)`;
    } else if (isPublicOverheat) {
      baseBadgeLabel = `💣 대중 과열 역발상 [${drawSymbol}/패]`;
      baseBadgeColor = 'bg-orange-100 text-orange-950 border-orange-400 font-black';
      baseDescription = '대중 쏠림 과열 매치 → 역발상 헷지 방어';
      baseDataReason = `대중 쏠림 과열도 +${meta.publicOverheat.toFixed(1)}%p (거품 방어)`;
    } else if (isHighEV) {
      const pickSym = meta.firstPick === 'win' ? '승' : (meta.firstPick === 'draw' ? drawSymbol : '패');
      baseBadgeLabel = `📈 EV+ 고기대값 [${pickSym}]`;
      baseBadgeColor = 'bg-emerald-100 text-emerald-950 border-emerald-400 font-black';
      baseDescription = '배당 대비 적중 확률 우수한 고기대값(EV) 마킹';
      baseDataReason = `고기대값 EV ${meta.evRatio[meta.firstPick].toFixed(2)}배 (해외 승률 ${(meta.pBayes[meta.firstPick] * 100).toFixed(1)}%)`;
    } else if (meta.pBayes.win >= 0.58 || meta.pBayes.lose >= 0.55) {
      const topPickSym = meta.firstPick === 'win' ? '승' : '패';
      baseBadgeLabel = `🏆 해외 승률 최상위 축 [${topPickSym}]`;
      baseBadgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-black';
      baseDescription = '해외 오즈 승률 최상위 안정적 고적중 축';
      baseDataReason = `해외 오즈 승률 ${(meta.pBayes[meta.firstPick] * 100).toFixed(1)}% (압도적 우세 축)`;
    }

    if (isTriple) {
      const all3: ('win' | 'draw' | 'lose')[] = ['win', 'draw', 'lose'];
      picks[meta.matchNo] = all3;
      strategyMetas[meta.matchNo] = {
        role: 'clutch_game_double',
        badgeLabel: `👑 전방위 삼식 방어 [올커버]`,
        badgeColor: 'bg-purple-100 text-purple-950 border-purple-300 ring-1 ring-purple-400 font-black',
        description: '초고위험 박빙 매치: 3개 결과 100% 올커버 방어',
        dataReason: `투표격차 ${winLoseDiff}%p (예측 불허 극심한 접전)`,
        recommendedPicks: all3,
      };
    } else if (isDouble) {
      const chosen2 = tempPicks[meta.matchNo] || [meta.firstPick, meta.secondPick];
      const orderedPicks = (['win', 'draw', 'lose'] as const).filter(p => chosen2.includes(p));
      picks[meta.matchNo] = orderedPicks;
      const formattedPicks = orderedPicks.map(p => p === 'win' ? '승' : (p === 'draw' ? drawSymbol : '패')).join('/');
      strategyMetas[meta.matchNo] = {
        role,
        badgeLabel: `🛡️ 복식 추천 [${formattedPicks}]`,
        badgeColor: 'bg-amber-100 text-amber-950 border-amber-400 ring-1 ring-amber-400/50 font-black',
        description: `${baseBadgeLabel.split(' ')[1] || '박빙 매치'}: 무승부/역배 이변 위험 2방향 복식 방어`,
        dataReason: baseDataReason,
        recommendedPicks: orderedPicks,
      };
    } else {
      const singlePick = tempPicks[meta.matchNo]?.[0] || meta.firstPick;
      picks[meta.matchNo] = [singlePick];
      
      strategyMetas[meta.matchNo] = {
        role: meta.isAnchorCandidate ? role : 'general_single',
        badgeLabel: baseBadgeLabel,
        badgeColor: baseBadgeColor,
        description: baseDescription,
        dataReason: baseDataReason,
        recommendedPicks: [singlePick],
      };
    }
  });

  return {
    picks,
    strategyMetas,
    combinationRank: iterationIndex + 1,
  };
}

export interface SemiAutoResult {
  picks: Record<number, ('win' | 'draw' | 'lose')[]>;
  isSemiAuto: boolean;
  fixedCount: number;
  unfixedCount: number;
  combinationRank: number;
  allocatedDoubles: number;
  allocatedTriples: number;
  toastMessage: string;
}

/**
 * ⚡ 반자동(Semi-Automatic) 및 전자동 결합 포트폴리오 생성기
 * - 사용자가 14경기 중 일부(예: 5경기)를 직접 선택/고정하면, 해당 고정 마킹을 100% 보존
 * - 미선택된 나머지 경기(예: 9경기)에 대해서만 목표 금액 예산 내에서 퀀트/베이지안 최적 단통·복식·삼식 자동 배분
 */
export function computeSemiAutoPortfolio({
  type,
  matches,
  existingPicks,
  targetCost,
  iterationIndex = 0
}: {
  type: TotoType;
  matches: TotoMatch[];
  existingPicks: Record<number, ('win' | 'draw' | 'lose')[]>;
  targetCost: number;
  iterationIndex?: number;
}): SemiAutoResult {
  if (!matches || matches.length === 0) {
    return {
      picks: {},
      isSemiAuto: false,
      fixedCount: 0,
      unfixedCount: 0,
      combinationRank: 1,
      allocatedDoubles: 0,
      allocatedTriples: 0,
      toastMessage: '경기 정보가 없습니다.'
    };
  }

  // 1. 유저가 이미 선택/마킹한 고정 경기 추출
  const fixedMatchNos = matches
    .filter(m => (existingPicks[m.matchNo] || []).length > 0)
    .map(m => m.matchNo);

  const unfixedMatches = matches.filter(m => !fixedMatchNos.includes(m.matchNo));

  // Case A: 전자동 (유저 마킹이 0개이거나 14개 모두 이미 마킹된 경우)
  if (fixedMatchNos.length === 0 || unfixedMatches.length === 0) {
    const preset = PORTFOLIO_PRESETS.find(p => p.cost === targetCost) || { doubles: 3, triples: 0, combinations: 8 };
    const fullRes = computeBayesianLogitPortfolio(type, matches, preset.doubles, iterationIndex, preset.triples);
    const combos = Math.pow(2, preset.doubles) * Math.pow(3, preset.triples);
    return {
      picks: fullRes.picks,
      isSemiAuto: false,
      fixedCount: 0,
      unfixedCount: matches.length,
      combinationRank: fullRes.combinationRank,
      allocatedDoubles: preset.doubles,
      allocatedTriples: preset.triples,
      toastMessage: `⚡ ${targetCost.toLocaleString()}원 (${combos === 1 ? '단통 1' : `${combos}조합`}) 제${fullRes.combinationRank}순위 1등 최적화 조합 생성 완료 (클릭 시 다음 순위)`
    };
  }

  // Case B: 반자동 (유저가 1~13개 경기를 고정 마킹한 상태)
  const finalPicks: Record<number, ('win' | 'draw' | 'lose')[]> = {};

  // 유저의 고정 마킹을 100% 그대로 유지
  fixedMatchNos.forEach(mNo => {
    finalPicks[mNo] = [...(existingPicks[mNo] || [])];
  });

  // 유저 고정 마킹이 소모한 조합 수 계산
  const fixedCombos = fixedMatchNos.reduce((acc, mNo) => acc * (existingPicks[mNo]?.length || 1), 1);
  const targetCombos = Math.max(1, Math.round(targetCost / 1000));

  let availableDoubles = 0;
  let availableTriples = 0;

  if (targetCombos > fixedCombos) {
    const remainingMult = Math.floor(targetCombos / fixedCombos);
    if (remainingMult >= 3 && unfixedMatches.length >= 1 && [3, 6, 12, 24, 48].includes(remainingMult)) {
      availableTriples = 1;
      const remainingForDoubles = Math.floor(remainingMult / 3);
      availableDoubles = Math.min(unfixedMatches.length - 1, Math.floor(Math.log2(Math.max(1, remainingForDoubles))));
    } else if (remainingMult >= 2) {
      availableDoubles = Math.min(unfixedMatches.length, Math.floor(Math.log2(remainingMult)));
    }
  }

  // 미선택된 경기들만을 대상으로 최적 퀀트 배분 산출
  const unfixedRes = computeBayesianLogitPortfolio(
    type,
    unfixedMatches,
    availableDoubles,
    iterationIndex,
    availableTriples
  );

  unfixedMatches.forEach(m => {
    finalPicks[m.matchNo] = unfixedRes.picks[m.matchNo] || ['win'];
  });

  const finalCombos = matches.reduce((acc, m) => acc * (finalPicks[m.matchNo]?.length || 1), 1);
  const finalCost = finalCombos * 1000;

  const desc = availableTriples > 0
    ? `복식 ${availableDoubles}개, 삼식 ${availableTriples}개`
    : (availableDoubles > 0 ? `복식 ${availableDoubles}개` : '단통');

  const rankText = iterationIndex > 0 ? `제${iterationIndex + 1}순위 ` : '';

  return {
    picks: finalPicks,
    isSemiAuto: true,
    fixedCount: fixedMatchNos.length,
    unfixedCount: unfixedMatches.length,
    combinationRank: iterationIndex + 1,
    allocatedDoubles: availableDoubles,
    allocatedTriples: availableTriples,
    toastMessage: `⚡ 반자동 ${rankText}완성! 내 고정 ${fixedMatchNos.length}경기 유지 + 미선택 ${unfixedMatches.length}경기 18년 퀀트 조합 갱신 (${finalCost.toLocaleString()}원 / ${finalCombos}조합, ${desc})`
  };
}

// Backward compatibility alias
export const computeQuantStrategy = (type: TotoType, matches: TotoMatch[], targetDoubles: number = 4) => {
  return computeBayesianLogitPortfolio(type, matches, targetDoubles, 0);
};

export function TotoTable({
  selectedTotoType,
  selectedYear,
  selectedRound,
  onSelectTotoType,
  onYearChange,
  onRoundChange,
  onOpenQuantModal,
}: TotoTableProps) {
  const [limits, setLimits] = useState<Record<string, Record<number, number>>>({});
  const [roundData, setRoundData] = useState<TotoRoundInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userPicks, setUserPicks] = useState<Record<number, ('win' | 'draw' | 'lose')[]>>({});
  const [lockedMatchNos, setLockedMatchNos] = useState<number[]>([]);
  const [lockedPicks, setLockedPicks] = useState<Record<number, ('win' | 'draw' | 'lose')[]>>({});
  const [isReviewMode, setIsReviewMode] = useState<boolean>(false);
  const [selectedPresetCost, setSelectedPresetCost] = useState<number>(0);
  const [presetIterationCounts, setPresetIterationCounts] = useState<Record<number, number>>({});
  const [autoSelectionToast, setAutoSelectionToast] = useState<string | null>(null);

  const [savedUserPicks, setSavedUserPicks] = useState<Record<number, ('win' | 'draw' | 'lose')[]> | null>(null);

  // Fetch TotoLimits on mount
  useEffect(() => {
    fetch('/api/toto/limits')
      .then(r => r.json())
      .then(d => setLimits(d))
      .catch(console.error);
  }, []);

  // Out-of-bounds round correction when limits, sport or year change
  useEffect(() => {
    const defaultMax = selectedTotoType === 'sc' ? 85 : (selectedTotoType === 'bs' ? 85 : 50);
    const maxR = limits?.[selectedTotoType]?.[selectedYear] || defaultMax;
    if (selectedRound > maxR && selectedYear < 2026) {
      onRoundChange(maxR);
    } else if (selectedRound < 1) {
      onRoundChange(1);
    }
  }, [selectedTotoType, selectedYear, limits, selectedRound, onRoundChange]);

  // Fetch Toto Round Data when totoType, year, round change
  useEffect(() => {
    fetchRoundData(selectedTotoType, selectedYear, selectedRound);
  }, [selectedTotoType, selectedYear, selectedRound]);

  const handlePrevRound = () => {
    if (selectedRound > 1) {
      onRoundChange(selectedRound - 1);
    } else {
      const prevYear = selectedYear - 1;
      if (prevYear >= 2009) {
        onYearChange(prevYear);
        const defaultPrevMax = selectedTotoType === 'sc' ? 85 : (selectedTotoType === 'bs' ? 85 : 50);
        const maxPrev = limits[selectedTotoType]?.[prevYear] || defaultPrevMax;
        onRoundChange(maxPrev);
      }
    }
  };

  const handleNextRound = () => {
    const defaultMax = selectedTotoType === 'sc' ? 85 : (selectedTotoType === 'bs' ? 85 : 50);
    const currentLimits = limits[selectedTotoType] || {};
    const maxR = currentLimits[selectedYear] || (roundData?.availableRounds && roundData.availableRounds[0]) || defaultMax;
    
    if (selectedRound < maxR) {
      onRoundChange(selectedRound + 1);
    } else if (selectedYear < 2026) {
      const nextYear = selectedYear + 1;
      onYearChange(nextYear);
      onRoundChange(1);
    } else if (selectedYear === 2026 && selectedRound < defaultMax) {
      onRoundChange(selectedRound + 1);
    }
  };

  const fetchRoundData = async (type: TotoType, year: number, round: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/toto/round?type=${type}&year=${year}&round=${round}`);
      if (res.ok) {
        const data: TotoRoundInfo = await res.json();
        setRoundData(data);
        
        // Automatically activate review mode if round has finished matches
        const hasFinishedMatches = data.matches.some(m => m.result !== null && m.result !== undefined && m.result.outcome !== null);
        setIsReviewMode(hasFinishedMatches);

        // Initialized clean state: let user select amount preset or generate combinations
        setUserPicks({});
        setLockedPicks({});
        setLockedMatchNos([]);
        setSavedUserPicks(null);
        setSelectedPresetCost(0);
        setPresetIterationCounts({});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Compute Strategy Meta for currently loaded matches
  const currentStrategy = useMemo(() => {
    if (!roundData?.matches) return { picks: {}, strategyMetas: {}, combinationRank: 1 };
    const cost = selectedPresetCost > 0 ? selectedPresetCost : 8000;
    const preset = PORTFOLIO_PRESETS.find(p => p.cost === cost) || { doubles: 3, triples: 0 };
    const iter = Math.max(0, (presetIterationCounts[cost] || 1) - 1);
    return computeBayesianLogitPortfolio(selectedTotoType, roundData.matches, preset.doubles, iter, preset.triples);
  }, [selectedTotoType, roundData, selectedPresetCost, presetIterationCounts]);

  // Calculate total combinations from current user markings
  const currentTotalCombinations = useMemo(() => {
    if (!roundData?.matches || roundData.matches.length === 0) return 0;
    const hasAnyPick = roundData.matches.some(m => (userPicks[m.matchNo] || []).length > 0);
    if (!hasAnyPick) return 0;

    const allHavePicks = roundData.matches.every(m => (userPicks[m.matchNo] || []).length > 0);
    if (!allHavePicks) {
      return roundData.matches.reduce((acc, m) => {
        const p = userPicks[m.matchNo] || [];
        return p.length > 0 ? acc * p.length : acc;
      }, 1);
    }
    return roundData.matches.reduce((acc, m) => {
      const p = userPicks[m.matchNo] || [];
      return acc * p.length;
    }, 1);
  }, [roundData, userPicks]);

  const currentTotalCost = currentTotalCombinations * 1000;

  // Expected winner stats calculation based on public vote distribution
  const expectedWinnerStats = useMemo(() => {
    if (!roundData?.matches || roundData.matches.length === 0) return null;

    const totalSalesKRW = roundData.totalSalesAmount || (roundData.totalVotes ? roundData.totalVotes * 1000 : 3500000000);
    const totalLinesSold = Math.max(100000, Math.round(totalSalesKRW / 1000));
    const jackpotPoolKRW = roundData.expectedJackpot || Math.round(totalSalesKRW * 0.5);

    let totalProbMass = 1.0;
    let hasAnyPick = false;
    let totalCombos = 1;

    roundData.matches.forEach(m => {
      const picks = userPicks[m.matchNo] || [];
      if (picks.length > 0) {
        hasAnyPick = true;
        totalCombos *= picks.length;
        let sumVoteProb = 0;
        picks.forEach(p => {
          sumVoteProb += (m.voteRate[p] || 0) / 100;
        });
        totalProbMass *= sumVoteProb;
      } else {
        totalProbMass *= 1.0;
      }
    });

    if (!hasAnyPick) {
      return {
        expectedWinners: 0,
        payoutPerPerson: jackpotPoolKRW,
        isCarryOverLikely: false,
        winnerStatusLabel: '마킹 대기 중',
        statusColor: 'text-slate-400 bg-slate-800 border-slate-700'
      };
    }

    const avgProbPerCombo = totalProbMass / Math.max(1, totalCombos);
    const expectedWinners = totalLinesSold * avgProbPerCombo;

    let winnerStatusLabel = '';
    let statusColor = '';
    let isCarryOverLikely = false;

    if (expectedWinners < 0.2) {
      isCarryOverLikely = true;
      winnerStatusLabel = `이월 유력 (${expectedWinners.toFixed(2)}명 / 독점 잭팟)`;
      statusColor = 'text-rose-300 bg-rose-950/80 border-rose-700/80';
    } else if (expectedWinners < 1.0) {
      winnerStatusLabel = `초고배당 독점 (${expectedWinners.toFixed(2)}명 예상 / 단독 1등 소수)`;
      statusColor = 'text-amber-300 bg-amber-950/80 border-amber-700/80';
    } else if (expectedWinners <= 5.0) {
      winnerStatusLabel = `고배당 독식권 (${expectedWinners.toFixed(1)}명 예상 / 상위 퀀트 마킹)`;
      statusColor = 'text-emerald-300 bg-emerald-950/80 border-emerald-700/80';
    } else if (expectedWinners <= 30.0) {
      winnerStatusLabel = `표준 당첨 분배 (${Math.round(expectedWinners)}명 예상 / 중위권 밸런스)`;
      statusColor = 'text-blue-300 bg-blue-950/80 border-blue-700/80';
    } else {
      winnerStatusLabel = `대중 정배 과열 (${Math.round(expectedWinners)}명 다수 당첨 / 당첨금 하락)`;
      statusColor = 'text-purple-300 bg-purple-950/80 border-purple-700/80';
    }

    const payoutPerPerson = Math.round(jackpotPoolKRW / Math.max(1, expectedWinners));

    return {
      expectedWinners,
      payoutPerPerson,
      isCarryOverLikely,
      winnerStatusLabel,
      statusColor,
      totalLinesSold,
      jackpotPoolKRW
    };
  }, [roundData, userPicks]);

  const handlePickToggle = (matchNo: number, pick: 'win' | 'draw' | 'lose') => {
    const current = userPicks[matchNo] || [];
    let updated: ('win' | 'draw' | 'lose')[];
    if (current.includes(pick)) {
      updated = current.filter(p => p !== pick);
    } else {
      updated = [...current, pick];
    }
    const newPicks = { ...userPicks, [matchNo]: updated };
    setUserPicks(newPicks);
    setSavedUserPicks(newPicks);

    // 사용자가 직접 마킹을 수정하면 해당 경기를 고정(Lock)하여 반자동 생성 시 영구 보존
    if (updated.length > 0) {
      setLockedPicks(prev => ({ ...prev, [matchNo]: updated }));
      setLockedMatchNos(prev => prev.includes(matchNo) ? prev : [...prev, matchNo]);
    } else {
      setLockedPicks(prev => {
        const next = { ...prev };
        delete next[matchNo];
        return next;
      });
      setLockedMatchNos(prev => prev.filter(n => n !== matchNo));
    }
  };

  const handleToggleLock = (matchNo: number) => {
    const isLocked = lockedMatchNos.includes(matchNo);
    if (isLocked) {
      setLockedMatchNos(prev => prev.filter(n => n !== matchNo));
      setLockedPicks(prev => {
        const next = { ...prev };
        delete next[matchNo];
        return next;
      });
      setAutoSelectionToast(`🔓 ${matchNo}번 경기 고정 해제 (자동 배분 대상으로 전환)`);
      setTimeout(() => setAutoSelectionToast(null), 2000);
    } else {
      const current = userPicks[matchNo] || [];
      if (current.length === 0) {
        const m = roundData?.matches.find(item => item.matchNo === matchNo);
        const topPick: ('win' | 'draw' | 'lose')[] = (m && m.voteRate.draw > m.voteRate.win && m.voteRate.draw > m.voteRate.lose) ? ['draw'] : ((m && m.voteRate.lose > m.voteRate.win) ? ['lose'] : ['win']);
        setUserPicks(prev => ({ ...prev, [matchNo]: topPick }));
        setLockedPicks(prev => ({ ...prev, [matchNo]: topPick }));
      } else {
        setLockedPicks(prev => ({ ...prev, [matchNo]: current }));
      }
      setLockedMatchNos(prev => prev.includes(matchNo) ? prev : [...prev, matchNo]);
      setAutoSelectionToast(`🔒 ${matchNo}번 경기 고정 완료 (반자동 생성 시 100% 보존)`);
      setTimeout(() => setAutoSelectionToast(null), 2000);
    }
  };

  const handleUnlockAll = () => {
    setLockedMatchNos([]);
    setLockedPicks({});
    setAutoSelectionToast('🔓 모든 경기 고정이 해제되었습니다. (전자동 모드로 전환)');
    setTimeout(() => setAutoSelectionToast(null), 2500);
  };

  const handleApplyPreset = (doubles: number, triples: number, cost: number) => {
    if (!roundData?.matches) return;
    const currentIter = presetIterationCounts[cost] || 0;
    const nextIter = currentIter + 1;
    setPresetIterationCounts(prev => ({ ...prev, [cost]: nextIter }));
    setSelectedPresetCost(cost);

    // 고정된 경기가 1~13개 있는 경우 고정 마킹(lockedPicks)을 기반으로 계속 차순위 생성
    const isSemi = lockedMatchNos.length > 0 && lockedMatchNos.length < 14;
    const effectivePicks = isSemi ? lockedPicks : (lockedMatchNos.length === 0 ? {} : userPicks);

    const semiResult = computeSemiAutoPortfolio({
      type: selectedTotoType,
      matches: roundData.matches,
      existingPicks: effectivePicks,
      targetCost: cost,
      iterationIndex: nextIter - 1
    });

    setUserPicks(semiResult.picks);
    setSavedUserPicks(semiResult.picks);
    setAutoSelectionToast(semiResult.toastMessage);
    setTimeout(() => setAutoSelectionToast(null), 3500);
  };

  const handleAutoSelect = () => {
    if (!roundData?.matches) return;
    const targetCost = selectedPresetCost > 0 ? selectedPresetCost : 8000;

    const currentIter = presetIterationCounts[targetCost] || 0;
    const nextIter = currentIter + 1;
    setPresetIterationCounts(prev => ({ ...prev, [targetCost]: nextIter }));
    setSelectedPresetCost(targetCost);

    const isSemi = lockedMatchNos.length > 0 && lockedMatchNos.length < 14;
    const effectivePicks = isSemi ? lockedPicks : (lockedMatchNos.length === 0 ? {} : userPicks);

    const semiResult = computeSemiAutoPortfolio({
      type: selectedTotoType,
      matches: roundData.matches,
      existingPicks: effectivePicks,
      targetCost,
      iterationIndex: nextIter - 1
    });

    setUserPicks(semiResult.picks);
    setSavedUserPicks(semiResult.picks);
    setAutoSelectionToast(semiResult.toastMessage);
    setTimeout(() => setAutoSelectionToast(null), 3500);
  };

  const handleCopyCurrentSlip = () => {
    if (!roundData) return;
    const isBaseball = selectedTotoType === 'bs';
    const isBasketball = selectedTotoType === 'bk';
    const drawSymbol = isBaseball ? '1' : (isBasketball ? '5' : '무');
    const title = selectedTotoType === 'sc' ? '축구승무패' : (selectedTotoType === 'bs' ? '야구승1패' : '농구승5패');
    
    const slipLabel = `${currentTotalCost.toLocaleString()}원 (${currentTotalCombinations.toLocaleString()}조합)`;

    let text = `[와이즈토토 ${title} ${selectedRound}회차 - ${slipLabel}]\n`;
    const matchPicks: string[] = [];
    roundData.matches.forEach(m => {
      const picks = userPicks[m.matchNo] || [];
      const formatted = picks.map(p => p === 'win' ? '승' : (p === 'draw' ? drawSymbol : '패')).join('/');
      matchPicks.push(`${m.matchNo}번(${m.homeTeam.substring(0, 3)}):${formatted || '-'}`);
    });
    text += `${matchPicks.join(', ')}\n`;
    text += `* 구매금액: ${currentTotalCost.toLocaleString()}원 (${currentTotalCombinations.toLocaleString()}조합)`;

    navigator.clipboard.writeText(text).then(() => {
      setAutoSelectionToast(`📋 ${slipLabel} 마킹 번호가 클립보드에 복사되었습니다!`);
      setTimeout(() => setAutoSelectionToast(null), 3000);
    });
  };

  const handleApplyActualResultsAsPicks = () => {
    if (!roundData?.matches || roundData.matches.length === 0) return;
    const actualPicks: Record<number, ('win' | 'draw' | 'lose')[]> = {};
    let actualCount = 0;
    let fallbackCount = 0;

    roundData.matches.forEach(m => {
      if (m.result?.outcome) {
        actualPicks[m.matchNo] = [m.result.outcome];
        actualCount++;
      } else if (m.intelligence?.recommendedPick && m.intelligence.recommendedPick.length > 0) {
        actualPicks[m.matchNo] = [m.intelligence.recommendedPick[0]];
        fallbackCount++;
      } else {
        // Higher vote rate fallback
        const vr = m.voteRate;
        const best: 'win' | 'draw' | 'lose' = (vr.win >= vr.draw && vr.win >= vr.lose) ? 'win' : (vr.draw >= vr.lose ? 'draw' : 'lose');
        actualPicks[m.matchNo] = [best];
        fallbackCount++;
      }
    });

    setUserPicks(actualPicks);
    setIsReviewMode(true);
    if (actualCount > 0) {
      setAutoSelectionToast(`🎯 ${actualCount}경기 실제 정답 결과 마킹 동기화 완료! (내 원래 마킹은 언제든 복원 가능)`);
    } else {
      setAutoSelectionToast(`🎯 경기 시작 전 회차: AI 고적중 정답 시뮬레이션 14경기 마킹 동기화 완료!`);
    }
    setTimeout(() => setAutoSelectionToast(null), 3000);
  };

  const handleRestoreUserPicks = () => {
    if (savedUserPicks) {
      setUserPicks(savedUserPicks);
      setAutoSelectionToast('🔄 이전에 선택했던 내 포트폴리오 마킹으로 복원되었습니다.');
      setTimeout(() => setAutoSelectionToast(null), 2500);
    }
  };

  const handleResetPicks = () => {
    setUserPicks({});
    setSavedUserPicks({});
    setLockedPicks({});
    setLockedMatchNos([]);
    setSelectedPresetCost(0);
    setPresetIterationCounts({});
    setAutoSelectionToast('🧹 마킹 및 고정 설정이 모두 초기화되었습니다. (0조합 / 0원)');
    setTimeout(() => setAutoSelectionToast(null), 2500);
  };

  const activeLockCount = lockedMatchNos.length;
  const isSemiAutoReady = activeLockCount > 0 && activeLockCount < 14;

  const currentLimits = limits[selectedTotoType] || {};
  const defaultMaxCap = selectedTotoType === 'sc' ? 85 : (selectedTotoType === 'bs' ? 85 : 50);
  const maxRoundsForYear = currentLimits[selectedYear] || (roundData?.availableRounds && roundData.availableRounds[0]) || defaultMaxCap;

  const roundOptions = useMemo(() => {
    const list = roundData?.availableRounds && roundData.availableRounds.length > 0
      ? [...roundData.availableRounds]
      : Array.from({ length: maxRoundsForYear }, (_, i) => maxRoundsForYear - i);
    if (!list.includes(selectedRound)) {
      list.push(selectedRound);
      list.sort((a, b) => b - a);
    }
    return list;
  }, [roundData?.availableRounds, maxRoundsForYear, selectedRound]);

  // Hit & Review Diagnostics calculations
  const finishedMatches = roundData?.matches.filter(m => m.result && m.result.outcome) || [];
  const totalFinishedMatches = finishedMatches.length;
  const userHitCount = finishedMatches.filter(m => {
    const p = userPicks[m.matchNo] || [];
    return p.includes(m.result!.outcome as any);
  }).length;

  const getUserRankInfo = (hits: number, total: number) => {
    if (total === 0) return { label: '경기 시작 전', color: 'bg-slate-700 text-slate-300' };
    if (total < 14) return { label: `경기 진행 중 (${total}경기 중 ${hits}개 적중)`, color: 'bg-blue-700 text-white' };
    if (hits === 14) return { label: '🏆 1등 14경기 올킬 당첨!', color: 'bg-amber-500 text-slate-950 font-black ring-2 ring-amber-300' };
    if (hits === 13) return { label: '🥈 2등 당첨! (13/14)', color: 'bg-slate-300 text-slate-900 font-black' };
    if (hits === 12) return { label: '🥉 3등 당첨! (12/14)', color: 'bg-amber-600 text-white font-black' };
    if (hits === 11) return { label: '🎖️ 4등 당첨! (11/14)', color: 'bg-indigo-600 text-white font-black' };
    return { label: `낙첨 (${hits}/14 경기 적중)`, color: 'bg-slate-700 text-slate-300' };
  };
  const userRankInfo = getUserRankInfo(userHitCount, totalFinishedMatches);

  const titleNames = {
    sc: '⚽ 축구승무패 (14경기)',
    bs: '⚾ 야구승1패 (14경기)',
    bk: '🏀 농구승5패 (14경기)'
  };

  const activeTripleCount = roundData?.matches.filter(m => (userPicks[m.matchNo] || []).length === 3).length || 0;
  const activeDoubleCount = roundData?.matches.filter(m => (userPicks[m.matchNo] || []).length === 2).length || 0;
  const activeSingleCount = roundData?.matches.filter(m => (userPicks[m.matchNo] || []).length === 1).length || 0;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 text-slate-950 p-2 rounded-xl font-black text-lg flex items-center justify-center shadow-xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white">{titleNames[selectedTotoType]}</h2>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-800">
                14경기 퀀트 포트폴리오 최적화 시스템
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {roundData?.title} | 마감: {roundData?.closeDate}
            </p>
          </div>
        </div>

        {/* Toto Type Tabs & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={async () => {
                onSelectTotoType('sc');
                const cal = resolveRoundByDate();
                try {
                  const res = await fetch('/api/active-rounds');
                  const active = await res.json();
                  if (active && active.sc) onRoundChange(active.sc);
                  else onRoundChange(cal.totoSoccerRound);
                } catch (e) {
                  onRoundChange(cal.totoSoccerRound);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                selectedTotoType === 'sc' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              ⚽ 축구승무패
            </button>
            <button
              onClick={async () => {
                onSelectTotoType('bs');
                const cal = resolveRoundByDate();
                try {
                  const res = await fetch('/api/active-rounds');
                  const active = await res.json();
                  if (active && active.bs) onRoundChange(active.bs);
                  else onRoundChange(cal.totoBaseballRound);
                } catch (e) {
                  onRoundChange(cal.totoBaseballRound);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                selectedTotoType === 'bs' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              ⚾ 야구승1패
            </button>
            <button
              onClick={async () => {
                onSelectTotoType('bk');
                const cal = resolveRoundByDate();
                try {
                  const res = await fetch('/api/active-rounds');
                  const active = await res.json();
                  if (active && active.bk) onRoundChange(active.bk);
                  else onRoundChange(cal.totoBasketballRound);
                } catch (e) {
                  onRoundChange(cal.totoBasketballRound);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                selectedTotoType === 'bk' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              🏀 농구승5패
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <button
              onClick={handlePrevRound}
              disabled={selectedYear === 2009 && selectedRound === 1}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-amber-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="이전 회차"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <select
              value={selectedYear}
              onChange={(e) => {
                const y = Number(e.target.value);
                onYearChange(y);
                const defaultMax = selectedTotoType === 'sc' ? 85 : (selectedTotoType === 'bs' ? 85 : 50);
                const maxR = (limits[selectedTotoType] || {})[y] || defaultMax;
                if (selectedRound > maxR && y < 2026) onRoundChange(maxR);
              }}
              className="bg-slate-900 text-amber-400 text-xs font-black px-2 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden cursor-pointer"
            >
              {(roundData?.availableYears && roundData.availableYears.length > 0
                ? roundData.availableYears
                : limits[selectedTotoType] 
                  ? Object.keys(limits[selectedTotoType]).map(Number).sort((a, b) => b - a) 
                  : Array.from({ length: 18 }, (_, i) => 2026 - i)
              ).map(y => (
                <option key={y} value={y}>{y}년도</option>
              ))}
            </select>

            <select
              value={selectedRound}
              onChange={(e) => onRoundChange(Number(e.target.value))}
              className="bg-slate-900 text-amber-400 text-xs font-black px-2 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden cursor-pointer"
            >
              {roundOptions.map(r => (
                <option key={r} value={r}>{r}회차</option>
              ))}
            </select>

            <button
              onClick={handleNextRound}
              disabled={selectedYear >= 2026 && selectedRound >= defaultMaxCap}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-amber-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="다음 회차"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => fetchRoundData(selectedTotoType, selectedYear, selectedRound)}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-all cursor-pointer ml-1"
              title="데이터 새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Calendar Date Picker Widget for Toto */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 shadow-inner">
            <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
              <span>📅</span>
              <span className="hidden sm:inline">캘린더 회차선택:</span>
            </span>
            <input 
              type="date"
              defaultValue={getTodayDateString()}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                const roundInfo = resolveRoundByDate(val);
                let targetRound = roundInfo.totoSoccerRound;
                if (selectedTotoType === 'bs') targetRound = roundInfo.totoBaseballRound;
                else if (selectedTotoType === 'bk') targetRound = roundInfo.totoBasketballRound;

                if (roundInfo.year !== selectedYear) {
                  onYearChange(roundInfo.year);
                }
                onRoundChange(targetRound);
              }}
              className="bg-slate-900 text-amber-400 text-xs font-mono font-black border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer shadow-xs hover:border-amber-400/50 transition-colors"
              title="달력에서 특정 날짜를 클릭하면 해당 날짜가 포함된 토토 회차로 즉시 이동하여 경기를 조회합니다."
            />
          </div>
        </div>
      </div>

      {/* Wisetoto Official Public Voting Synchronization Banner */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            공시 투표현황 실시간 연동
          </span>
          {roundData?.aggregatedTime && (
            <span className="text-xs text-slate-500 font-medium">
              집계 기준: <strong className="text-slate-800 font-bold">{roundData.aggregatedTime}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono flex-wrap">
          <div className="text-slate-600">
            총 투표수: <strong className="text-slate-900 font-bold font-mono">{(roundData?.totalVotes || 0).toLocaleString()}</strong> 표
          </div>
          <div className="text-slate-600">
            총 판매금액: <strong className="text-blue-700 font-bold font-mono">{(roundData?.totalPrice || (roundData?.totalVotes || 0) * 1000).toLocaleString()}</strong> 원
          </div>
          <div className="text-slate-600">
            전회차 이월금: <strong className={`${(roundData?.carryOverAmount || 0) > 0 ? 'text-red-600' : 'text-slate-500'} font-bold font-mono`}>
              {(roundData?.carryOverAmount || 0) > 0 ? `${(roundData?.carryOverAmount || 0).toLocaleString()} 원` : '0원'}
            </strong>
          </div>
          <a
            href={`https://www.wisetoto.com/gameinfo/toto_calc.htm?game_category=${selectedTotoType}1&game_year=${selectedYear}&game_round=${selectedRound}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg transition-colors inline-flex items-center gap-1"
          >
            <span>와이즈토토 원문 ↗</span>
          </a>
        </div>
      </div>

      {/* Real-Time Expected Winners & Review Diagnostics KPI Panel */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-amber-400 flex items-center gap-1.5">
                  <span>🎯 프로토 × 토토 하이브리드 조합 최적화 엔진</span>
                </h3>
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {isReviewMode ? '🔍 실전 복기 모드' : '⚡ 하이브리드 배치 & 유저 자율 선택'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                <strong>프로토 분석(해외 오즈 승률 1위 고적중 단통 축)</strong>과 <strong>토토 분석(박빙 경기 무승부/역배 복식 방어)</strong>을 결합한 하이브리드 마킹 시스템입니다. 유저가 자유롭게 선택지를 수정·조정할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsReviewMode(!isReviewMode)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5 border ${
                isReviewMode 
                  ? 'bg-amber-500 text-slate-950 border-amber-300 ring-2 ring-amber-300 font-black' 
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
              }`}
              title="정답 결과와 내 마킹을 한눈에 대조 복기하는 뷰 모드를 토글합니다."
            >
              <span>🔍 정답결과 및 복기 진단실</span>
              {totalFinishedMatches > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-amber-300 font-mono">
                  {userHitCount}/{totalFinishedMatches}
                </span>
              )}
            </button>

            {(isReviewMode || totalFinishedMatches > 0) && (
              <>
                <button
                  onClick={handleApplyActualResultsAsPicks}
                  title="실제 경기 종료 결과를 마킹에 동기화하여 100% 정답 올킬 라인을 확인합니다."
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>실제 정답 동기화</span>
                </button>
                {savedUserPicks && (
                  <button
                    onClick={handleRestoreUserPicks}
                    title="이전에 내가 선택했던 퀀트/수동 마킹으로 되돌립니다."
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>내 원래 마킹 복원</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* 3 Status KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* 1. Expected Winner Count & Monopoly Index */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>🎯 1등 당첨 예상 인원수</span>
              <span className="font-mono text-emerald-400 font-bold">
                {expectedWinnerStats?.totalLinesSold ? `발매: ${expectedWinnerStats.totalLinesSold.toLocaleString()}조합` : '-'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-amber-400">
                {expectedWinnerStats?.expectedWinners !== undefined
                  ? (expectedWinnerStats.expectedWinners < 1.0
                      ? `${expectedWinnerStats.expectedWinners.toFixed(2)}명`
                      : `${expectedWinnerStats.expectedWinners.toFixed(1)}명`)
                  : '0명'}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {expectedWinnerStats?.expectedWinners !== undefined && expectedWinnerStats.expectedWinners <= 5.0 ? '★ 독식 목표 달성' : '(대중 분배)'}
              </span>
            </div>
            <div className="pt-1">
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded font-black border ${expectedWinnerStats?.statusColor || 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                {expectedWinnerStats?.winnerStatusLabel || '마킹 선택 필요'}
              </span>
            </div>
          </div>

          {/* 2. Expected Payout per Winner */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>💰 1인당 예상 당첨금 (1등)</span>
              <span className="font-mono text-emerald-300 font-bold">
                {expectedWinnerStats?.jackpotPoolKRW ? `총 잭팟: ${(expectedWinnerStats.jackpotPoolKRW / 100000000).toFixed(1)}억원` : '-'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-300 truncate">
                {expectedWinnerStats?.payoutPerPerson
                  ? (expectedWinnerStats.payoutPerPerson >= 100000000
                      ? `${(expectedWinnerStats.payoutPerPerson / 100000000).toFixed(2)}억원`
                      : `${Math.round(expectedWinnerStats.payoutPerPerson / 10000).toLocaleString()}만원`)
                  : '-'}
              </span>
            </div>
            <div className="pt-1">
              <span className="inline-block text-[10px] px-2 py-0.5 rounded font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {expectedWinnerStats?.isCarryOverLikely ? '🔥 이월금 발생 독점 대박 기회' : '안티클로닝 독점 밸류 마킹'}
              </span>
            </div>
          </div>

          {/* 3. Portfolio Combination Cost & Review Score */}
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>📊 내 마킹 & 복기 성적</span>
              <span className="font-mono text-amber-400 font-bold">
                {currentTotalCost.toLocaleString()}원
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-white">
                {totalFinishedMatches > 0 ? `${userHitCount} / ${totalFinishedMatches}` : `${currentTotalCombinations.toLocaleString()}조합`}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {totalFinishedMatches > 0
                  ? `경기 적중 (${Math.round((userHitCount / Math.max(1, totalFinishedMatches)) * 100)}%)`
                  : `(단통 ${activeSingleCount} + 복식 ${activeDoubleCount}${activeTripleCount > 0 ? ` + 삼식 ${activeTripleCount}` : ''})`}
              </span>
            </div>
            <div className="pt-1">
              <span className="inline-block text-[10px] px-2 py-0.5 rounded font-black bg-blue-500/20 text-blue-300 border border-blue-400/30">
                {totalFinishedMatches > 0 ? userRankInfo.label : '14경기 시스템 마킹 중'}
              </span>
            </div>
          </div>
        </div>

        {/* Side-by-Side Review Scorecard Banner (When Review Mode or Matches finished) */}
        {isReviewMode && totalFinishedMatches > 0 && (
          <div className="bg-slate-950/80 p-4 rounded-xl border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-black text-sm">📋 14경기 정답 결과 & 내 선택 마킹 동시 대조표</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-black">
                  {userRankInfo.label}
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                총 {totalFinishedMatches}경기 완료 (적중: <strong className="text-emerald-400 font-bold">{userHitCount}</strong> / 미적중: <strong className="text-rose-400 font-bold">{totalFinishedMatches - userHitCount}</strong>)
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {roundData?.matches.map(m => {
                const picks = userPicks[m.matchNo] || [];
                const res = m.result?.outcome;
                const isHit = res && picks.includes(res as any);
                const hasRes = Boolean(res);
                const isBaseballMatch = selectedTotoType === 'bs' || m.sport === 'baseball' || m.sport === 'bs';
                const isBasketballMatch = selectedTotoType === 'bk' || m.sport === 'basketball' || m.sport === 'bk';
                const labelDraw = isBaseballMatch ? '1' : (isBasketballMatch ? '5' : '무');
                const resLabel = res === 'win' ? '승' : (res === 'draw' ? labelDraw : (res === 'lose' ? '패' : '-'));
                const myPickStr = picks.map(p => p === 'win' ? '승' : (p === 'draw' ? labelDraw : '패')).join('/') || '미마킹';

                return (
                  <div
                    key={m.matchNo}
                    className={`p-2 rounded-lg border text-xs font-mono flex flex-col justify-between ${
                      !hasRes
                        ? 'bg-slate-900 border-slate-700 text-slate-400'
                        : isHit
                          ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                          : 'bg-rose-950/60 border-rose-500/80 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>No.{m.matchNo}</span>
                      <span className={`text-[10px] px-1 py-0.2 rounded font-black ${
                        !hasRes ? 'bg-slate-800 text-slate-400' : isHit ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                      }`}>
                        {!hasRes ? '진행전' : isHit ? '✓ 적중' : '✗ 오답'}
                      </span>
                    </div>
                    <div className="text-[11px] truncate text-slate-300 font-medium my-0.5" title={`${m.homeTeam} vs ${m.awayTeam}`}>
                      {m.homeTeam.substring(0, 3)} vs {m.awayTeam.substring(0, 3)}
                    </div>
                    <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                      <span className="text-amber-300 font-bold">정답: [{resLabel}]</span>
                      <span className="text-slate-300 font-bold">내마킹: [{myPickStr}]</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 14 Matches Table & Interactive Pick Selection */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Table Filter / Auto Selection Bar */}
        <div className="p-4 bg-slate-900 text-white border-b border-slate-800 space-y-3">
          {/* Amount Options + Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5 mr-1">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>금액 옵션:</span>
              </span>

              {/* Amount Presets: Click once for #1 optimal, click again for #2, #3, etc. */}
              <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700 flex-wrap">
                {PORTFOLIO_PRESETS.map((preset) => {
                  const isSelected = selectedPresetCost === preset.cost && currentTotalCost === preset.cost;
                  const currentIteration = presetIterationCounts[preset.cost] || 0;
                  return (
                    <button
                      key={preset.cost}
                      onClick={() => handleApplyPreset(preset.doubles, preset.triples, preset.cost)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer shadow-2xs flex flex-col items-center relative ${
                        isSelected
                          ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-slate-950 ring-2 ring-amber-300 font-black shadow-md scale-105'
                          : 'bg-slate-700/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600/60'
                      }`}
                      title={`${preset.sub} (클릭 시마다 다음 순위 최적 조합 생성)`}
                    >
                      <div className="flex items-center gap-1">
                        <span className="leading-tight">{preset.label}</span>
                        {isSelected && currentIteration > 0 && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-slate-950 text-amber-300 font-mono font-bold">
                            #{currentIteration}
                          </span>
                        )}
                      </div>
                      <span className={`text-[9px] font-mono ${isSelected ? 'text-slate-900 font-bold' : 'opacity-80'}`}>
                        {preset.combinations === 1 ? '단통 1' : `${preset.combinations}조합`}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons: 자동생성, 정답동기화, 복기토글, 조합복사, 초기화 */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {isSemiAutoReady && (
                  <div className="px-2.5 py-1.5 bg-amber-500/20 border border-amber-400/50 rounded-xl text-amber-300 text-xs font-black flex items-center gap-1.5">
                    <span>🔒 {activeLockCount}경기 고정 중</span>
                    <span className="text-amber-400/60">|</span>
                    <span>⚡ {14 - activeLockCount}경기 반자동 대기</span>
                    <button
                      onClick={handleUnlockAll}
                      className="ml-1 px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-[10px] font-bold border border-slate-600 transition-colors cursor-pointer"
                      title="모든 고정을 풀고 14경기 전자동 모드로 전환합니다."
                    >
                      고정 해제
                    </button>
                  </div>
                )}

                <button
                  onClick={handleAutoSelect}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-xs font-black border border-amber-300 transition-all cursor-pointer shadow-md flex items-center gap-1.5 hover:scale-105 active:scale-95"
                  title={
                    isSemiAutoReady
                      ? `사용자가 고정한 ${activeLockCount}경기를 100% 보존하고, 나머지 ${14 - activeLockCount}경기를 18년 퀀트 최적 조합으로 자동 갱신합니다. (클릭할 때마다 계속 차순위 조합 생성)`
                      : "1등 당첨 확률 및 독점 가치가 극대화되도록 로짓·베이지안 통합 수리 모델로 최적화 조합을 즉시 생성합니다. (클릭 시마다 다음 순위 조합 생성)"
                  }
                >
                  <Zap className="w-4 h-4 text-slate-950 fill-slate-950 animate-pulse" />
                  <span>
                    {isSemiAutoReady
                      ? `⚡ 반자동 생성 (${14 - activeLockCount}경기 차순위 갱신)`
                      : '⚡ 자동 생성'}
                  </span>
                </button>

                <button
                  onClick={handleApplyActualResultsAsPicks}
                  className="px-3 py-2 bg-emerald-700/90 hover:bg-emerald-600 text-white rounded-xl text-xs font-black border border-emerald-500/80 transition-all cursor-pointer shadow-md flex items-center gap-1.5 hover:scale-105 active:scale-95"
                  title="공식 경기 종료 결과 정답으로 마킹을 즉시 동기화합니다."
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>🎯 정답 동기화</span>
                </button>

                <button
                  onClick={() => setIsReviewMode(!isReviewMode)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-2xs flex items-center gap-1 ${
                    isReviewMode ? 'bg-amber-500 text-slate-950 border-amber-400 font-black' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  }`}
                  title="정답 결과와 내 마킹을 동시에 상세 비교하는 복기 모드를 전환합니다."
                >
                  <span>🔍 복기 모드 {isReviewMode ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  onClick={handleCopyCurrentSlip}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                  title="현재 마킹된 번호와 조합을 클립보드에 복사 (베트맨 즉시 마킹 가능)"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-400" />
                  <span>조합 복사</span>
                </button>

                <button
                  onClick={handleResetPicks}
                  className="px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer shadow-2xs"
                  title="전체 마킹 초기화"
                >
                  초기화
                </button>
              </div>
            </div>

            {/* Right: Current Picks & Expected Winner Badge */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-amber-300 font-black flex items-center gap-2">
                <span>마킹: {currentTotalCombinations.toLocaleString()}조합</span>
                <span className="text-amber-400 font-bold">({currentTotalCost.toLocaleString()}원)</span>
              </div>
              {expectedWinnerStats && (
                <div className="bg-emerald-950/80 px-2.5 py-1.5 rounded-xl border border-emerald-700/80 text-emerald-300 font-black flex items-center gap-1">
                  <span className="text-[11px]">🎯 1등 예상: {expectedWinnerStats.expectedWinners < 1.0 ? expectedWinnerStats.expectedWinners.toFixed(2) : expectedWinnerStats.expectedWinners.toFixed(1)}명</span>
                </div>
              )}
            </div>
          </div>

          {/* Toast Notification Bar */}
          {autoSelectionToast && (
            <div className="py-1.5 px-3 bg-amber-500/15 border border-amber-400/40 rounded-lg text-amber-300 text-xs font-semibold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{autoSelectionToast}</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 border-b border-gray-200 font-bold">
                <th className="p-2.5 text-center w-12">No.</th>
                <th className="p-2.5 text-center w-24 whitespace-nowrap">일시</th>
                <th className="p-2.5 text-center whitespace-nowrap min-w-[70px]">리그</th>
                <th className="p-2.5 text-center min-w-[190px]">홈팀 vs 원정팀</th>
                <th className="p-2.5 text-center min-w-[120px]">결과 및 복기 판정</th>
                <th className="p-2.5 text-center min-w-[210px]">대중 투표율 (마킹 선택)</th>
                <th className="p-2.5 text-center min-w-[170px]">퀀트 전략 분류 & 배치 역할</th>
                <th className="p-2.5 text-center min-w-[155px] bg-blue-50/50 text-blue-900 border-l border-r border-blue-200/70">
                  국내배당 ({selectedTotoType === 'sc' ? '승/무/패' : (selectedTotoType === 'bs' ? '승/1/패' : '승/5/패')})
                </th>
                <th className="p-2.5 text-center min-w-[155px] bg-slate-50/80 text-slate-800 border-r border-slate-200">
                  해외배당 ({selectedTotoType === 'sc' ? '승/무/패' : (selectedTotoType === 'bs' ? '승/1/패' : '승/5/패')})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roundData?.matches.map((m) => {
                const picks = userPicks[m.matchNo] || [];
                const isBaseball = selectedTotoType === 'bs' || m.sport === 'baseball' || m.sport === 'bs';
                const isBasketball = selectedTotoType === 'bk' || m.sport === 'basketball' || m.sport === 'bk';
                const labelWin = '승';
                const labelDraw = isBaseball ? '1' : (isBasketball ? '5' : '무');
                const labelLose = '패';

                const domWin = m.domesticOdds?.win ?? (isBaseball 
                  ? +(88.0 / Math.max(1.0, (m.voteRate.win / ((m.voteRate.win + m.voteRate.lose) || 1)) * 100)).toFixed(2) 
                  : +(88.0 / Math.max(0.1, m.voteRate.win)).toFixed(2));
                const domDraw = (m.domesticOdds?.draw !== undefined && m.domesticOdds.draw !== null)
                  ? m.domesticOdds.draw
                  : (isBaseball ? 0 : +(88.0 / Math.max(0.1, m.voteRate.draw)).toFixed(2));
                const domLose = m.domesticOdds?.lose ?? (isBaseball 
                  ? +(88.0 / Math.max(1.0, (m.voteRate.lose / ((m.voteRate.win + m.voteRate.lose) || 1)) * 100)).toFixed(2) 
                  : +(88.0 / Math.max(0.1, m.voteRate.lose)).toFixed(2));

                const forWin = m.foreignOdds?.win ?? (isBaseball 
                  ? +(94.5 / Math.max(1.0, (m.voteRate.win / ((m.voteRate.win + m.voteRate.lose) || 1)) * 100)).toFixed(2)
                  : +(94.5 / Math.max(0.1, m.voteRate.win)).toFixed(2));
                const forDraw = (m.foreignOdds?.draw !== undefined && m.foreignOdds.draw !== null)
                  ? (isBaseball ? 0 : m.foreignOdds.draw)
                  : (isBaseball ? 0 : +(94.5 / Math.max(0.1, m.voteRate.draw)).toFixed(2));
                const forLose = m.foreignOdds?.lose ?? (isBaseball 
                  ? +(94.5 / Math.max(1.0, (m.voteRate.lose / ((m.voteRate.win + m.voteRate.lose) || 1)) * 100)).toFixed(2)
                  : +(94.5 / Math.max(0.1, m.voteRate.lose)).toFixed(2));

                const hasResult = Boolean(m.result && m.result.outcome && m.result.status === 'finished');
                const resultOutcome = hasResult ? m.result?.outcome : null;
                const hasScore = hasResult && m.result?.homeScore !== null && m.result?.awayScore !== null && !isNaN(Number(m.result?.homeScore));
                const resultOutcomeLabel = resultOutcome === 'win' ? labelWin : (resultOutcome === 'draw' ? labelDraw : labelLose);

                const isHit = hasResult && picks.includes(resultOutcome as any);
                const myPickFormatted = picks.map(p => p === 'win' ? labelWin : (p === 'draw' ? labelDraw : labelLose)).join('/') || '미마킹';

                const strategyMeta = currentStrategy.strategyMetas[m.matchNo];
                const isLocked = lockedMatchNos.includes(m.matchNo);

                return (
                  <tr key={m.matchNo} className={`transition-colors ${isLocked ? 'bg-amber-500/10 border-l-4 border-amber-500' : 'hover:bg-amber-50/30'}`}>
                    <td className="p-2 text-center font-bold font-mono">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="text-slate-800 font-bold">{m.matchNo}</span>
                        <button
                          onClick={() => handleToggleLock(m.matchNo)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black transition-all cursor-pointer flex items-center gap-0.5 ${
                            isLocked
                              ? 'bg-amber-500 text-slate-950 ring-1 ring-amber-400 shadow-2xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                          }`}
                          title={isLocked ? "현재 경기 고정 해제 (클릭 시 자동 배분 대상으로 전환)" : "현재 경기 고정 (클릭 시 반자동 생성 시 100% 보존)"}
                        >
                          {isLocked ? '🔒 고정' : '🔓'}
                        </button>
                      </div>
                    </td>
                    <td className="p-2.5 text-center text-gray-500 text-[11px] whitespace-nowrap">{m.date}</td>
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-bold text-[11px] whitespace-nowrap tracking-tight">
                        {m.league}
                      </span>
                    </td>
                    <td className="p-2.5 font-bold text-slate-900">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 max-w-[260px] mx-auto w-full">
                        <span className="text-right truncate text-slate-900 font-bold text-xs" title={m.homeTeam}>
                          {m.homeTeam}
                        </span>
                        
                        <div className="w-[54px] flex items-center justify-center shrink-0">
                          {hasScore ? (
                            <span className="w-full text-center font-mono font-black text-[11px] py-0.5 bg-slate-900 text-amber-400 rounded-md border border-slate-700 shadow-2xs whitespace-nowrap">
                              {m.result?.homeScore} : {m.result?.awayScore}
                            </span>
                          ) : hasResult ? (
                            <span className="w-full text-center font-mono font-black text-[11px] py-0.5 bg-slate-900 text-amber-400 rounded-md border border-slate-700 shadow-2xs whitespace-nowrap">
                              {resultOutcomeLabel}
                            </span>
                          ) : (
                            <span className="w-full text-center font-mono font-bold text-[10px] py-0.5 bg-slate-100 text-slate-400 rounded-md border border-slate-200 uppercase whitespace-nowrap">
                              VS
                            </span>
                          )}
                        </div>

                        <span className="text-left truncate text-slate-900 font-bold text-xs" title={m.awayTeam}>
                          {m.awayTeam}
                        </span>
                      </div>
                    </td>

                    {/* Result & Simultaneous User Pick Outcome Badge Column */}
                    <td className="p-2.5 text-center">
                      {hasResult ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-black shadow-2xs ${
                              resultOutcome === 'win'
                                ? 'bg-blue-600 text-white'
                                : resultOutcome === 'draw'
                                  ? 'bg-slate-600 text-white'
                                  : 'bg-red-600 text-white'
                            }`}>
                              정답 [{resultOutcomeLabel}]
                            </span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-black ${
                              isHit ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}>
                              {isHit ? '✓ 적중' : '✗ 미적중'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-600 font-medium">
                            내 마킹: <strong className={isHit ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>[{myPickFormatted}]</strong>
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">-</span>
                      )}
                    </td>

                    {/* Vote Rates & User Pick Buttons (Uniform Width & Height) */}
                    <td className="p-2 text-center">
                      <div className="grid grid-cols-3 gap-1.5 w-full">
                        {/* Win Button */}
                        <button
                          onClick={() => handlePickToggle(m.matchNo, 'win')}
                          className={`h-8 px-1 rounded-lg font-mono text-center border transition-all cursor-pointer flex items-center justify-center ${
                            hasResult && resultOutcome === 'win' && picks.includes('win')
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs ring-2 ring-emerald-400 font-black'
                              : hasResult && resultOutcome !== 'win' && picks.includes('win')
                                ? 'bg-rose-700/85 text-white border-rose-600 line-through opacity-85 font-bold'
                                : hasResult && resultOutcome === 'win' && !picks.includes('win')
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-400 font-black'
                                  : picks.includes('win')
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs ring-1 ring-blue-400 font-black'
                                    : 'bg-slate-50 text-gray-700 hover:bg-slate-100 border-gray-200 font-bold'
                          }`}
                        >
                          <span className="text-[11px] whitespace-nowrap leading-none flex items-center justify-center gap-1">
                            {hasResult && resultOutcome === 'win' && picks.includes('win') && '✓ '}
                            {hasResult && resultOutcome === 'win' && !picks.includes('win') && '★ '}
                            <span className="font-semibold">{labelWin}</span> {m.voteRate.win}%
                          </span>
                        </button>

                        {/* Draw Button */}
                        <button
                          onClick={() => handlePickToggle(m.matchNo, 'draw')}
                          className={`h-8 px-1 rounded-lg font-mono text-center border transition-all cursor-pointer flex items-center justify-center ${
                            hasResult && resultOutcome === 'draw' && picks.includes('draw')
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs ring-2 ring-emerald-400 font-black'
                              : hasResult && resultOutcome !== 'draw' && picks.includes('draw')
                                ? 'bg-rose-700/85 text-white border-rose-600 line-through opacity-85 font-bold'
                                : hasResult && resultOutcome === 'draw' && !picks.includes('draw')
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-400 font-black'
                                  : picks.includes('draw')
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs ring-1 ring-amber-400 font-black'
                                    : 'bg-slate-50 text-gray-700 hover:bg-slate-100 border-gray-200 font-bold'
                          }`}
                        >
                          <span className="text-[11px] whitespace-nowrap leading-none flex items-center justify-center gap-1">
                            {hasResult && resultOutcome === 'draw' && picks.includes('draw') && '✓ '}
                            {hasResult && resultOutcome === 'draw' && !picks.includes('draw') && '★ '}
                            <span className="font-semibold">{labelDraw}</span> {m.voteRate.draw}%
                          </span>
                        </button>

                        {/* Lose Button */}
                        <button
                          onClick={() => handlePickToggle(m.matchNo, 'lose')}
                          className={`h-8 px-1 rounded-lg font-mono text-center border transition-all cursor-pointer flex items-center justify-center ${
                            hasResult && resultOutcome === 'lose' && picks.includes('lose')
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs ring-2 ring-emerald-400 font-black'
                              : hasResult && resultOutcome !== 'lose' && picks.includes('lose')
                                ? 'bg-rose-700/85 text-white border-rose-600 line-through opacity-85 font-bold'
                                : hasResult && resultOutcome === 'lose' && !picks.includes('lose')
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-400 font-black'
                                  : picks.includes('lose')
                                    ? 'bg-red-600 text-white border-red-600 shadow-2xs ring-1 ring-red-400 font-black'
                                    : 'bg-slate-50 text-gray-700 hover:bg-slate-100 border-gray-200 font-bold'
                          }`}
                        >
                          <span className="text-[11px] whitespace-nowrap leading-none flex items-center justify-center gap-1">
                            {hasResult && resultOutcome === 'lose' && picks.includes('lose') && '✓ '}
                            {hasResult && resultOutcome === 'lose' && !picks.includes('lose') && '★ '}
                            <span className="font-semibold">{labelLose}</span> {m.voteRate.lose}%
                          </span>
                        </button>
                      </div>
                    </td>

                    {/* Quant Strategy Role Tag & Precise Data Grounds */}
                    <td className="p-2 text-center">
                      {strategyMeta ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black border ${strategyMeta.badgeColor}`}>
                            {strategyMeta.badgeLabel}
                          </span>
                          {strategyMeta.dataReason && (
                            <span className="text-[9.5px] font-mono text-slate-800 bg-amber-50/90 px-1.5 py-0.5 rounded border border-amber-300 font-bold whitespace-nowrap shadow-2xs" title={`데이터 근거: ${strategyMeta.dataReason}`}>
                              📊 {strategyMeta.dataReason}
                            </span>
                          )}
                          <span className="text-[9px] text-gray-500 font-medium truncate max-w-[170px]" title={strategyMeta.description}>
                            {strategyMeta.description}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[10px]">-</span>
                      )}
                    </td>

                    {/* Domestic Odds (Clean Pure Numbers Only) */}
                    <td className="p-2.5 text-center border-l border-r border-blue-100 bg-blue-50/20">
                      <div className="flex items-center justify-center gap-1 font-mono text-xs">
                        <div className="flex-1 py-1.5 px-1 bg-white border border-blue-200 rounded-lg font-black text-blue-900 shadow-2xs text-center" title="국내 승 배당">
                          {typeof domWin === 'number' ? domWin.toFixed(2) : domWin}
                        </div>
                        <div 
                          className={`flex-1 py-1.5 px-1 rounded-lg font-black shadow-2xs text-center border ${
                            domDraw === 0 ? 'text-slate-400 bg-slate-100/80 border-slate-200' : 'text-slate-700 bg-white border-blue-200'
                          }`}
                          title={domDraw === 0 ? '배당 없음' : `국내 ${labelDraw} 배당`}
                        >
                          {domDraw === 0 ? '-' : (typeof domDraw === 'number' ? domDraw.toFixed(2) : domDraw)}
                        </div>
                        <div className="flex-1 py-1.5 px-1 bg-white border border-blue-200 rounded-lg font-black text-red-800 shadow-2xs text-center" title="국내 패 배당">
                          {typeof domLose === 'number' ? domLose.toFixed(2) : domLose}
                        </div>
                      </div>
                    </td>

                    {/* Foreign Odds (Clean Pure Numbers Only) */}
                    <td className="p-2.5 text-center border-r border-slate-100 bg-slate-50/30">
                      <div className="flex items-center justify-center gap-1 font-mono text-xs">
                        <div className="flex-1 py-1.5 px-1 bg-white border border-slate-200 rounded-lg font-black text-slate-900 shadow-2xs text-center" title="해외 승 배당">
                          {typeof forWin === 'number' ? forWin.toFixed(2) : forWin}
                        </div>
                        <div 
                          className={`flex-1 py-1.5 px-1 rounded-lg font-black shadow-2xs text-center border ${
                            forDraw === 0 ? 'text-slate-400 bg-slate-100/80 border-slate-200' : 'text-slate-700 bg-white border-slate-200'
                          }`}
                          title={forDraw === 0 ? '배당 없음' : `해외 ${labelDraw} 배당`}
                        >
                          {forDraw === 0 ? '-' : (typeof forDraw === 'number' ? forDraw.toFixed(2) : forDraw)}
                        </div>
                        <div className="flex-1 py-1.5 px-1 bg-white border border-slate-200 rounded-lg font-black text-slate-900 shadow-2xs text-center" title="해외 패 배당">
                          {typeof forLose === 'number' ? forLose.toFixed(2) : forLose}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
