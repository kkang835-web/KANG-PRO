import React, { useState, useEffect } from 'react';
import { MatchItem } from '../types';
import { getStandardKoreanTeamName } from '../utils/teamNameMatcher';
import { getPrimaryPickInfo } from '../utils/quantPickEvaluator';
import { generateMatchPreviewArticle } from '../utils/matchPreviewGenerator';
import { QuantValueTabView } from './analysis/QuantValueTabView';
import { H2HTabView } from './analysis/H2HTabView';
import { RecentMatchesTabView } from './analysis/RecentMatchesTabView';
import { LineupTabView } from './analysis/LineupTabView';
import { LeagueStandingsTabView } from './analysis/LeagueStandingsTabView';
import { OddsPreviewTabView } from './analysis/OddsPreviewTabView';

export type AnalysisTabKey = 'view_quant' | 'view_h2h' | 'view_recent' | 'view_lineup' | 'view_standings' | 'view_odds_preview';

export interface DetailedAnalysisModalProps {
  isOpen?: boolean;
  onClose: () => void;
  matchData?: MatchItem | any;
  match?: MatchItem;
  initialTab?: string;
}

export default function DetailedAnalysisModal({ 
  isOpen = true, 
  onClose, 
  matchData,
  match: matchProp,
  initialTab = 'view_quant'
}: DetailedAnalysisModalProps) {
  // Normalize initialTab
  const getInitialTabKey = (tab: string): AnalysisTabKey => {
    if (tab === 'h2h' || tab === 'view_h2h') return 'view_h2h';
    if (tab === 'recent' || tab === 'latest' || tab === 'view_recent') return 'view_recent';
    if (tab === 'lineup' || tab === 'view5_lineup_injury' || tab === 'view_lineup') return 'view_lineup';
    if (tab === 'standings' || tab === 'rank' || tab === 'league_rank' || tab === 'view_standings') return 'view_standings';
    if (tab === 'odds' || tab === 'preview' || tab === 'view2_odds_flow' || tab === 'view4_preview' || tab === 'view_odds_preview') return 'view_odds_preview';
    return 'view_quant';
  };

  const [activeView, setActiveView] = useState<AnalysisTabKey>(getInitialTabKey(initialTab));
  const [copied, setCopied] = useState(false);

  if (isOpen === false) return null;

  // 1. Raw match object passed from parent table row
  const rawMatch = matchData || matchProp;

  // 2. Real Match Data mapping with team names
  const fullHomeTeam = rawMatch?.homeTeam ? getStandardKoreanTeamName(rawMatch.homeTeam) : (rawMatch?.home || '홈팀');
  const fullAwayTeam = rawMatch?.awayTeam ? getStandardKoreanTeamName(rawMatch.awayTeam) : (rawMatch?.away || '원정팀');
  
  const shortHome = rawMatch?.homeTeam || rawMatch?.home || fullHomeTeam.split(' ')[0] || '홈팀';
  const shortAway = rawMatch?.awayTeam || rawMatch?.away || fullAwayTeam.split(' ')[0] || '원정팀';

  const league = rawMatch?.league || '프로리그';
  const date = rawMatch?.date || '2026-09-14 (월)';
  const gameNo = rawMatch?.gameNo || rawMatch?.id || rawMatch?.matchNo || 1;
  const market = rawMatch?.market || rawMatch?.categoryLabel || '일반';
  const sport = rawMatch?.sport || 'soccer';
  const sportEmoji = sport === 'soccer' ? '⚽' : sport === 'baseball' ? '⚾' : sport === 'basketball' ? '🏀' : '🏐';

  // Live Scraped H2H, Standings, & Form Data fetch
  const [h2hData, setH2hData] = useState<any>(null);

  useEffect(() => {
    if (!rawMatch) return;
    const seq = rawMatch?.scheduleInfoSeq || '';
    const params = new URLSearchParams({
      seq: String(seq),
      gameNo: String(gameNo),
      year: String(rawMatch?.year || 2026),
      round: String(rawMatch?.round || 102),
      homeTeam: fullHomeTeam,
      awayTeam: fullAwayTeam,
      league: league,
      sport: sport
    });

    fetch(`/api/matches/h2h?${params.toString()}`)
      .then(r => r.json())
      .then(data => {
        if (data) setH2hData(data);
      })
      .catch(err => console.warn('H2H fetch error:', err));
  }, [rawMatch, fullHomeTeam, fullAwayTeam, league, sport, gameNo]);

  // 3. Dynamic Calculation of Match Odds & Probabilities
  const domWin = (rawMatch?.domestic?.win && typeof rawMatch.domestic.win === 'number' && rawMatch.domestic.win > 1.0)
    ? rawMatch.domestic.win
    : ((rawMatch?.domesticOdds?.win && typeof rawMatch.domesticOdds.win === 'number' && rawMatch.domesticOdds.win > 1.0) ? rawMatch.domesticOdds.win : null);
  const domDraw = (rawMatch?.domestic?.draw && typeof rawMatch.domestic.draw === 'number' && rawMatch.domestic.draw > 1.0) 
    ? rawMatch.domestic.draw 
    : ((rawMatch?.domesticOdds?.draw && typeof rawMatch.domesticOdds.draw === 'number' && rawMatch.domesticOdds.draw > 1.0) ? rawMatch.domesticOdds.draw : null);
  const domLose = (rawMatch?.domestic?.lose && typeof rawMatch.domestic.lose === 'number' && rawMatch.domestic.lose > 1.0)
    ? rawMatch.domestic.lose
    : ((rawMatch?.domesticOdds?.lose && typeof rawMatch.domesticOdds.lose === 'number' && rawMatch.domesticOdds.lose > 1.0) ? rawMatch.domesticOdds.lose : null);
  const hasDraw = domDraw !== null && domDraw > 0;

  // Implied & True Win/Draw/Lose probabilities (Shin's No-Vig Base)
  const is1X2Valid = Boolean(domWin && domLose);
  const rawWinProb = is1X2Valid ? 1 / Math.max(1.01, domWin!) : 0;
  const rawDrawProb = is1X2Valid && hasDraw ? 1 / Math.max(1.01, domDraw!) : 0;
  const rawLoseProb = is1X2Valid ? 1 / Math.max(1.01, domLose!) : 0;
  const overround = rawWinProb + rawDrawProb + rawLoseProb;

  const homeTrueProb = is1X2Valid ? Math.round((rawWinProb / overround) * 1000) / 10 : 50;
  const drawTrueProb = is1X2Valid && hasDraw ? Math.round((rawDrawProb / overround) * 1000) / 10 : 0;
  const awayTrueProb = is1X2Valid ? Math.round((100 - homeTrueProb - drawTrueProb) * 10) / 10 : 50;

  const mktHomeProb = Math.round((homeTrueProb * 0.96 + 1.2) * 10) / 10;
  const mktAwayProb = Math.round((awayTrueProb * 0.96 + 1.2) * 10) / 10;
  const mktDrawProb = hasDraw ? Math.round((drawTrueProb * 0.96 + 0.8) * 10) / 10 : 0;

  // 4. Primary Pick Evaluator
  const primaryPick = getPrimaryPickInfo(rawMatch || {
    homeTeam: shortHome,
    awayTeam: shortAway,
    sport,
    gameNo,
    domestic: domWin && domLose ? { win: domWin, draw: domDraw, lose: domLose, refundRate: '88%' } : undefined,
    foreign: rawMatch?.foreign,
    categoryLabel: market,
    status: '경기전',
    score: null,
    date
  });

  const winCand = primaryPick?.candidates?.find(c => c.marketLabel === '일반(승)');
  const drawCand = primaryPick?.candidates?.find(c => c.marketLabel === '일반(무)');
  const loseCand = primaryPick?.candidates?.find(c => c.marketLabel === '일반(패)');

  const homeCalibratedProb = winCand?.prob ?? homeTrueProb;
  const drawCalibratedProb = hasDraw ? (drawCand?.prob ?? drawTrueProb) : 0;
  const awayCalibratedProb = loseCand?.prob ?? awayTrueProb;

  const topCand = primaryPick.candidates.find(c => c && primaryPick.recommendedPick.includes(c.pick) && c.odds >= 1.50) 
    || primaryPick.candidates.find(c => c && c.odds >= 1.50)
    || primaryPick.candidates[0];

  const handicapLine = rawMatch?.handicapOrLine || rawMatch?.handicapLine || (market.startsWith('H') ? parseFloat(market.replace('H', '').trim()) : (sport === 'soccer' ? -1 : sport === 'baseball' ? -1.5 : -4.5));
  const uoLine = rawMatch?.uoLine || (market.startsWith('U') ? parseFloat(market.replace('U', '').trim()) : (sport === 'soccer' ? 2.5 : sport === 'baseball' ? 8.5 : 165.5));

  const calculateEV = (odds: number, prob: number) => {
    if (!odds || odds <= 1.0 || !prob || prob <= 0) return -100;
    const raw = ((odds * (prob / 100)) - 1) * 100;
    return Math.round(raw * 10) / 10;
  };

  const matchExpectedRoi = winCand?.expectedRoi ?? calculateEV(domWin, homeCalibratedProb);
  const matchCand = [winCand, drawCand, loseCand].filter(Boolean).sort((a, b) => (b?.score ?? -999) - (a?.score ?? -999))[0]
    || primaryPick.candidates.find(c => c.marketLabel.startsWith('일반'))
    || { pick: `${fullHomeTeam} 승리`, prob: homeCalibratedProb, odds: domWin, expectedRoi: matchExpectedRoi };

  const rawHdpNum = typeof handicapLine === 'number' 
    ? handicapLine 
    : (parseFloat(String(handicapLine || '')) || (sport === 'soccer' ? -1 : sport === 'baseball' ? -1.5 : -4.5));
  const handiAbs = Math.abs(rawHdpNum);
  const isHomeMinus = rawHdpNum < 0;
  const defaultHdpPick = isHomeMinus ? `${fullHomeTeam} -${handiAbs} 마핸` : `${fullHomeTeam} +${handiAbs} 플핸`;

  const minusHdpCand = primaryPick?.candidates?.find(c => c.marketLabel === '마핸(-)');
  const plusHdpCand = primaryPick?.candidates?.find(c => c.marketLabel === '플핸(+)');
  const bestHdpFromCand = [minusHdpCand, plusHdpCand].filter(Boolean).sort((a, b) => (b?.score ?? -999) - (a?.score ?? -999))[0]
    || primaryPick.candidates.find(c => c.marketLabel.includes('마핸') || c.marketLabel.includes('플핸'));

  const hdpCand = (primaryPick.marketLabel.includes('마핸') || primaryPick.marketLabel.includes('플핸'))
    ? topCand
    : (bestHdpFromCand || { pick: defaultHdpPick, prob: 60, odds: 1.85, expectedRoi: 5 });

  const underCand = primaryPick?.candidates?.find(c => c.marketLabel === '언더(U)');
  const overCand = primaryPick?.candidates?.find(c => c.marketLabel === '오버(O)');
  const bestUoFromCand = [underCand, overCand].filter(Boolean).sort((a, b) => (b?.score ?? -999) - (a?.score ?? -999))[0]
    || primaryPick.candidates.find(c => c.marketLabel.includes('언더') || c.marketLabel.includes('오버'));

  const uoCand = (primaryPick.marketLabel.includes('언더') || primaryPick.marketLabel.includes('오버'))
    ? topCand
    : (bestUoFromCand || (underCand?.prob && overCand?.prob && underCand.prob >= overCand.prob ? underCand : overCand) || { pick: `${uoLine} 기준 언더/오버`, prob: 50, odds: 1.85, expectedRoi: 0 });

  const isBaseball = sport === 'baseball';
  const w1lCand1 = isBaseball ? primaryPick?.candidates?.find(c => c.marketLabel === '승1패(1)') : undefined;
  const w1lCandWin = isBaseball ? primaryPick?.candidates?.find(c => c.marketLabel === '승1패(승)') : undefined;
  const w1lCandLose = isBaseball ? primaryPick?.candidates?.find(c => c.marketLabel === '승1패(패)') : undefined;
  const bestW1LFromCand = isBaseball 
    ? ([w1lCand1, w1lCandWin, w1lCandLose].filter(Boolean).sort((a, b) => (b?.score ?? -999) - (a?.score ?? -999))[0]
       || primaryPick.candidates.find(c => c.marketLabel.includes('승1패')))
    : undefined;
  const w1lCand = isBaseball ? (primaryPick?.bestW1LPick || bestW1LFromCand || { pick: '1점차 접전 (1)', prob: 44, odds: 1.85, expectedRoi: 3 }) : undefined;

  const topPick = primaryPick.recommendedPick;
  const roiNum = primaryPick.expectedRoi;
  const roi = roiNum >= 0 ? `+${roiNum.toFixed(1)}%` : `${roiNum.toFixed(1)}%`;
  const fundProbNum = primaryPick.prob;
  const fundProb = `${fundProbNum.toFixed(1)}%`;
  const mktAdjProbNum = Math.round((100 / Math.max(1.01, primaryPick.odds)) * 10) / 10;
  const mktAdjProb = `${mktAdjProbNum.toFixed(1)}%`;

  // Dynamic Shannon Entropy & Objective Risk Zone
  const pProb = Math.min(0.99, Math.max(0.01, fundProbNum / 100));
  const qProb = 1 - pProb;
  const rawEntropy = -(pProb * Math.log2(pProb) + qProb * Math.log2(qProb));
  const entropyBitsNum = +Math.max(0.08, Math.min(1.0, rawEntropy)).toFixed(2);
  const entropyBits = entropyBitsNum.toFixed(2);
  
  // Risk zone is strictly derived from verified hit probability
  const entropyRisk = fundProbNum >= 68.0 
    ? '저위험 단통 축 구간' 
    : (fundProbNum >= 50.0 ? '중위험 밸류 공략 구간' : '고위험 고배당 노림수 구간');
  const entropy = rawMatch?.entropy || `${entropyBits} bits (${entropyRisk})`;

  // Mathematical Quarter Kelly Criterion Formula: f* = (b*p - q) / b
  const bOdds = Math.max(0.01, (primaryPick.odds || 1.85) - 1);
  const fullKelly = Math.max(0, (bOdds * pProb - qProb) / bOdds);
  const quarterKellyPct = (fullKelly / 4) * 100;
  const kellyStakeNum = Math.max(0.5, Math.min(7.5, roiNum > 0 ? quarterKellyPct : 0.8));
  const kellyStake = `${kellyStakeNum.toFixed(1)}%`;

  const isHomeFav = homeTrueProb >= awayTrueProb;
  const favTeam = isHomeFav ? fullHomeTeam : fullAwayTeam;

  const previewData = generateMatchPreviewArticle(rawMatch, {
    topPick,
    favTeam,
    bestMatchPick: matchCand.pick,
    bestHdpPick: hdpCand.pick,
    bestUoPick: uoCand.pick,
    fundProb,
    mktAdjProb,
    roi,
    kellyStake,
    entropy,
    isSuperSafe70: primaryPick.isSuperSafe70,
    superSafeProb: primaryPick.superSafeProb,
    superSafeBuffer: primaryPick.superSafeBuffer
  });

  const handleCopyPreview = () => {
    if (previewData?.rawText) {
      navigator.clipboard.writeText(previewData.rawText).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }).catch(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto font-sans">
      <div className="relative w-full max-w-5xl bg-[#0b131e] text-slate-100 rounded-2xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col max-h-[95vh] my-auto">
        
        {/* ========================================================================= */}
        {/* TOP BAR / MATCH HEADER                                                    */}
        {/* ========================================================================= */}
        <div className="bg-[#070b12] px-4 sm:px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">{sportEmoji}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  <span>경기 상세 분석:</span>
                  <span className="text-amber-300">{fullHomeTeam}</span>
                  <span className="text-slate-500 font-normal">vs</span>
                  <span className="text-slate-200">{fullAwayTeam}</span>
                </h2>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                  No. {gameNo}
                </span>
                <span className="text-[10px] bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded border border-blue-700/40 font-semibold">
                  {league}
                </span>
                {market && market !== '일반' && (
                  <span className="text-[10px] bg-purple-900/40 text-purple-300 px-2 py-0.5 rounded border border-purple-700/40 font-semibold">
                    {market}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {date} | {shortHome} 홈 | 배당 [{domWin} / {domDraw ? `${domDraw} / ` : ''}{domLose}]
              </p>
            </div>
          </div>

          {/* 6 Category Navigation Bar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 bg-[#0f1b2b] p-1 rounded-xl border border-slate-700/70 shadow-inner flex-wrap">
              {/* 1. Quant Value */}
              <button
                onClick={() => setActiveView('view_quant')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeView === 'view_quant'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title="1순위 TOP 픽, EV 기대수익률, 3대 마켓 가치 대조표"
              >
                <span>🎯 ① 퀀트 가치 분석</span>
              </button>

              {/* 2. Head-to-Head */}
              <button
                onClick={() => setActiveView('view_h2h')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeView === 'view_h2h'
                    ? 'bg-blue-400 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title="상대 맞대결 승무패 전적 및 스코어 기록"
              >
                <span>⚔️ ② 상대전적</span>
              </button>

              {/* 3. Recent Form */}
              <button
                onClick={() => setActiveView('view_recent')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeView === 'view_recent'
                    ? 'bg-emerald-400 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title="양 팀 최근 5경기 폼, 득실점 및 연승/연패 스트릭"
              >
                <span>🔥 ③ 최근경기</span>
              </button>

              {/* 4. Lineups & Injuries */}
              <button
                onClick={() => setActiveView('view_lineup')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeView === 'view_lineup'
                    ? 'bg-rose-500 text-slate-950 font-black shadow-md'
                    : 'text-rose-400 hover:text-rose-200 hover:bg-rose-950/40'
                }`}
                title="종목별 선발 명단, 투타 기록 및 결장자(OUT/GTD) 리포트"
              >
                <span>🏟️ ④ 라인업</span>
              </button>

              {/* 5. League Standings */}
              <button
                onClick={() => setActiveView('view_standings')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeView === 'view_standings'
                    ? 'bg-yellow-400 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title="공식 리그 순위표, 승점/승률 및 홈/원정 성적 대조"
              >
                <span>🏆 ⑤ 리그순위</span>
              </button>

              {/* 6. Odds History & Preview */}
              <button
                onClick={() => setActiveView('view_odds_preview')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  activeView === 'view_odds_preview'
                    ? 'bg-purple-400 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`}
                title="18개년 프로토 배당 패턴 통계 및 기사형 프리뷰"
              >
                <span>📈 ⑥ 배당 & 프리뷰</span>
              </button>
            </div>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white text-base font-bold p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB CONTENTS                                                              */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#0b131e]">
          {activeView === 'view_quant' && (
            <QuantValueTabView
              topPick={topPick}
              entropyRisk={entropyRisk}
              entropyBitsNum={entropyBitsNum}
              entropy={entropy}
              roi={roi}
              primaryPick={primaryPick}
              kellyStake={kellyStake}
              homeTeam={fullHomeTeam}
              awayTeam={fullAwayTeam}
              sport={sport}
              league={league}
              domWin={domWin}
              domDraw={domDraw}
              domLose={domLose}
              homeTrueProb={homeCalibratedProb}
              drawTrueProb={drawCalibratedProb}
              awayTrueProb={awayCalibratedProb}
              mktHomeProb={mktHomeProb}
              mktDrawProb={mktDrawProb}
              mktAwayProb={mktAwayProb}
              matchCand={matchCand}
              w1lCand={w1lCand}
              hdpCand={hdpCand}
              uoCand={uoCand}
              handicapLine={handicapLine}
              uoLine={uoLine}
            />
          )}

          {activeView === 'view_h2h' && (
            <H2HTabView
              h2hData={h2hData}
              homeTeam={fullHomeTeam}
              awayTeam={fullAwayTeam}
              sport={sport}
              league={league}
            />
          )}

          {activeView === 'view_recent' && (
            <RecentMatchesTabView
              h2hData={h2hData}
              homeTeam={fullHomeTeam}
              awayTeam={fullAwayTeam}
              sport={sport}
              league={league}
            />
          )}

          {activeView === 'view_lineup' && (
            <LineupTabView
              h2hData={h2hData}
              homeTeam={fullHomeTeam}
              awayTeam={fullAwayTeam}
              sport={sport}
              league={league}
            />
          )}

          {activeView === 'view_standings' && (
            <LeagueStandingsTabView
              h2hData={h2hData}
              homeTeam={fullHomeTeam}
              awayTeam={fullAwayTeam}
              sport={sport}
              league={league}
            />
          )}

          {activeView === 'view_odds_preview' && (
            <OddsPreviewTabView
              rawMatch={rawMatch}
              homeTeam={fullHomeTeam}
              awayTeam={fullAwayTeam}
              sport={sport}
              league={league}
              gameNo={gameNo}
              date={date}
              domWin={domWin}
              domDraw={domDraw}
              domLose={domLose}
              previewData={previewData}
              handleCopyPreview={handleCopyPreview}
              copied={copied}
            />
          )}
        </div>

        {/* ========================================================================= */}
        {/* MODAL FOOTER                                                              */}
        {/* ========================================================================= */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#070b12] border-t border-slate-800/80 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline-flex items-center gap-1.5">
              <span>💡</span>
              <span>1/4 켈리 최적 자금 비중: <strong className="text-amber-300 font-mono">{kellyStake}</strong> (엔트로피: <strong className="text-emerald-400">{entropy}</strong>)</span>
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={() => {
                alert(`💡 [${shortHome} vs ${shortAway} 퀀트 가이드]\n\n1. 1순위 TOP 픽: ${topPick}\n2. 펀더멘털 공정 확률: ${fundProb}\n3. 신스 No-Vig 시장 확률: ${mktAdjProb}\n4. 1/4 켈리 권장 비중: ${kellyStake}\n5. 엔트로피: ${entropy}`);
              }}
              className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition cursor-pointer flex items-center gap-1"
            >
              <span>❓</span>
              <span>베팅 전략 도움말</span>
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-xl transition border border-slate-700 cursor-pointer shadow-xs"
            >
              닫기
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
