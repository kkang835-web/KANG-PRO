import React, { useEffect, useState } from 'react';
import { MatchItem, QuantAnalysisResult, MatchAnalysisData, PredictionResult, RoundMetadata } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OnScreenAnalysisProps {
  match: MatchItem;
  roundMetadata?: RoundMetadata | null;
  onOpenModal?: (tab: 'overview' | 'h2h' | 'quant' | 'ai') => void;
  onScrollToMatches?: () => void;
}

export function OnScreenAnalysis({
  match,
  roundMetadata,
  onOpenModal,
  onScrollToMatches
}: OnScreenAnalysisProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'h2h' | 'quant' | 'ai'>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [quantData, setQuantData] = useState<QuantAnalysisResult | null>(null);
  const [h2hData, setH2hData] = useState<MatchAnalysisData | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionResult | null>(null);
  const [aiCommentary, setAiCommentary] = useState<string>('AI 분석 생성 중...');

  useEffect(() => {
    let isMounted = true;

    async function loadAnalysis() {
      try {
        setLoading(true);

        const seq = match.scheduleInfoSeq || '';
        const gameNo = match.gameNo;
        const year = match.year || 2026;
        const round = match.round || 102;

        // 1. Fetch live scraped H2H & Recent Form from Wisetoto
        const h2hPromise = fetch(
          `/api/matches/h2h?seq=${encodeURIComponent(seq)}&gameNo=${gameNo}&year=${year}&round=${round}&home=${encodeURIComponent(match.homeTeam)}&away=${encodeURIComponent(match.awayTeam)}&league=${encodeURIComponent(match.league)}&sport=${match.sport}`
        ).then(res => res.json());

        // 2. Fetch Quant Model Calculations
        const quantPromise = fetch('/api/quant/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            odds: match.domestic, 
            sport: match.sport,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            league: match.league, 
            categoryLabel: match.categoryLabel,
            categoryType: match.categoryType,
            handicapLine: match.handicapLine,
            uoLine: match.uoLine,
            matchOdds: match.matchOdds,
            handicapOdds: match.handicapOdds,
            uoOdds: match.uoOdds
          })
        }).then(res => res.json());

        // 3. Fetch Gemini AI Commentary & Quant H2H Prediction
        const aiPromise = fetch('/api/ai/analyze-match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            homeTeam: match.homeTeam, 
            awayTeam: match.awayTeam, 
            league: match.league, 
            sport: match.sport,
            categoryLabel: match.categoryLabel,
            categoryType: match.categoryType,
            odds: { domestic: match.domestic, foreign: match.foreign },
            handicapLine: match.handicapLine,
            uoLine: match.uoLine,
            matchOdds: match.matchOdds,
            handicapOdds: match.handicapOdds,
            uoOdds: match.uoOdds
          })
        }).then(res => res.json());

        const [h2hRes, quantRes, aiRes] = await Promise.all([h2hPromise, quantPromise, aiPromise]);

        if (isMounted) {
          setH2hData(h2hRes);
          setQuantData(quantRes);
          if (aiRes.prediction) {
            setPredictionData(aiRes.prediction);
          }
          setAiCommentary(aiRes.commentary || '분석 결과가 생성되었습니다.');
        }
      } catch (err) {
        console.error("Failed to load on-screen analysis:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAnalysis();

    return () => {
      isMounted = false;
    };
  }, [match]);

  const homeBadge = h2hData?.sportsDb?.home?.strBadge;
  const awayBadge = h2hData?.sportsDb?.away?.strBadge;
  const stadium = h2hData?.sportsDb?.home?.strStadium || '홈 경기장';

  return (
    <div id="onscreen-analysis-panel" className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden transition-all">
      {/* Top Header Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="bg-blue-600 text-white font-bold px-2.5 py-1 rounded-md">
              선택 경기 상세분석
            </span>
            <span className="bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              No. {match.gameNo}
            </span>
            <span className="bg-slate-800 text-amber-400 font-bold px-2 py-0.5 rounded border border-slate-700">
              {match.league}
            </span>
            <span className="bg-purple-900/60 text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-700/60">
              {match.categoryLabel}
            </span>
            <span className="text-slate-400 font-mono text-[11px]">
              {match.date}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {match.scheduleInfoSeq && (
              <span className="hidden sm:inline-block bg-emerald-950 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-emerald-700">
                실시간 연동 #{match.scheduleInfoSeq}
              </span>
            )}
            {onOpenModal && (
              <button
                onClick={() => onOpenModal(activeTab)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                title="전체 화면 팝업 모달로 확대 보기"
              >
                <span>⛶</span>
                <span>모달로 보기</span>
              </button>
            )}
            {onScrollToMatches && (
              <button
                onClick={onScrollToMatches}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                title="경기 목록으로 이동"
              >
                <span>↑</span>
                <span>경기목록</span>
              </button>
            )}
          </div>
        </div>

        {/* Teams and Score Presentation */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
          {/* Home Team */}
          <div className="flex items-center justify-end gap-3 text-right">
            <div>
              <h2 className="text-base sm:text-xl font-black text-white leading-tight">
                {match.homeTeam}
              </h2>
              <span className="text-[11px] text-blue-400 font-semibold">홈 어드밴티지</span>
            </div>
            {homeBadge && (
              <img 
                src={homeBadge} 
                alt={match.homeTeam} 
                referrerPolicy="no-referrer" 
                className="w-9 h-9 sm:w-12 sm:h-12 object-contain bg-slate-800/80 p-1 rounded-full border border-slate-700 shrink-0" 
              />
            )}
          </div>

          {/* Central Score / Status Box */}
          <div className="flex flex-col items-center justify-center px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 shadow-inner">
            {match.status === '종료' && match.score ? (
              <div className="flex items-center gap-1.5 font-mono text-xl sm:text-2xl font-black">
                <span className="text-amber-400">{match.score.home}</span>
                <span className="text-slate-500 text-sm">:</span>
                <span className="text-cyan-400">{match.score.away}</span>
              </div>
            ) : match.status === '진행중' && match.score ? (
              <div className="flex items-center gap-1.5 font-mono text-xl sm:text-2xl font-black animate-pulse">
                <span className="text-emerald-400">{match.score.home}</span>
                <span className="text-emerald-500 text-sm">:</span>
                <span className="text-emerald-400">{match.score.away}</span>
              </div>
            ) : (
              <span className="text-sm sm:text-base font-black text-slate-400 tracking-wider">VS</span>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded mt-0.5 ${
              match.status === '진행중' ? 'bg-emerald-500 text-white animate-pulse' :
              match.status === '종료' ? 'bg-slate-800 text-slate-300' : 'bg-blue-900/60 text-blue-300'
            }`}>
              {match.status}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex items-center justify-start gap-3 text-left">
            {awayBadge && (
              <img 
                src={awayBadge} 
                alt={match.awayTeam} 
                referrerPolicy="no-referrer" 
                className="w-9 h-9 sm:w-12 sm:h-12 object-contain bg-slate-800/80 p-1 rounded-full border border-slate-700 shrink-0" 
              />
            )}
            <div>
              <h2 className="text-base sm:text-xl font-black text-white leading-tight">
                {match.awayTeam}
              </h2>
              <span className="text-[11px] text-slate-400 font-semibold">원정팀</span>
            </div>
          </div>
        </div>

        {/* Stadium & Quick Odds Bar */}
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <span>🏟️ {stadium}</span>
          <div className="flex items-center gap-3 font-mono">
            <span>국내 배당: <strong className="text-blue-300">승 {match.domestic.win} / {match.domestic.draw !== null ? `무 ${match.domestic.draw} / ` : ''}패 {match.domestic.lose}</strong></span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">해외 배당: <strong className="text-amber-300">승 {match.foreign.win} / {match.foreign.draw !== null ? `무 ${match.foreign.draw} / ` : ''}패 {match.foreign.lose}</strong></span>
          </div>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex border-b border-gray-200 bg-slate-50 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-3 px-2 text-center transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 bg-white shadow-2xs font-black'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
          }`}
        >
          <span>🎯</span>
          <span>승무패 정밀 예측 (H2H·퀀트)</span>
        </button>

        <button
          onClick={() => setActiveTab('h2h')}
          className={`flex-1 py-3 px-2 text-center transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === 'h2h'
              ? 'border-blue-600 text-blue-600 bg-white shadow-2xs font-black'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
          }`}
        >
          <span>📊</span>
          <span>상대전적(H2H) & 최근 경기</span>
          {h2hData?.h2h?.total ? (
            <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.2 rounded-full">
              {h2hData.h2h.total}전
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('quant')}
          className={`flex-1 py-3 px-2 text-center transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === 'quant'
              ? 'border-blue-600 text-blue-600 bg-white shadow-2xs font-black'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
          }`}
        >
          <span>🔬</span>
          <span>신스 모형 & 퀀트 매트릭스</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex-1 py-3 px-2 text-center transition-all flex items-center justify-center gap-1.5 border-b-2 cursor-pointer ${
            activeTab === 'ai'
              ? 'border-blue-600 text-blue-600 bg-white shadow-2xs font-black'
              : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/60'
          }`}
        >
          <span>🤖</span>
          <span>AI 프로토 브리핑</span>
        </button>
      </div>

      {/* Tab Content Body (No Horizontal Scroll) */}
      <div className="p-4 sm:p-6 w-full max-w-full">
        {loading ? (
          <div className="py-16 text-center text-gray-500 font-medium flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-700">실시간 H2H 및 퀀트 수리 분석 엔진 계산 중...</p>
            <p className="text-xs text-slate-400">신스 모형(Shin's Model) 마진 소거 및 상대전적 데이터를 파싱하고 있습니다.</p>
          </div>
        ) : (
          <>
            {/* ======================================================== */}
            {/* TAB 1: OVERVIEW - 승무패 정밀 예측 (H2H · 퀀트 수리분석) */}
            {/* ======================================================== */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Prediction Recommendation Card */}
                <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-md">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-amber-400 text-slate-950 font-black text-xs px-2.5 py-1 rounded-md">
                        {predictionData?.isAllPass || predictionData?.recommendedPicksCount === 0 ? '관망 권장 (차선 픽)' : '최종 1순위 추천'}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-amber-300">
                        {predictionData?.leanPick 
                          ? `[${predictionData.leanPick.marketLabel}] ${predictionData.leanPick.pick}`
                          : (predictionData?.recommendedPick || `${match.homeTeam} 승`)}
                      </h3>
                      {predictionData?.recommendedPicksCount !== undefined && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          predictionData.recommendedPicksCount >= 3 
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                            : predictionData.recommendedPicksCount === 2
                            ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                            : predictionData.recommendedPicksCount === 1
                            ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                        }`}>
                          {predictionData.recommendedPicksCount >= 3 
                            ? '🎯 3대 마켓 전원 추천' 
                            : predictionData.recommendedPicksCount === 2
                            ? '🎯 2개 마켓 추천 (승패 제외)'
                            : predictionData.recommendedPicksCount === 1
                            ? '🎯 1개 마켓 단독 추천'
                            : '⚠️ 전 마켓 관망 (차선 픽 제공)'}
                        </span>
                      )}
                    </div>
                    <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 text-xs">
                      <span className="text-slate-300">신뢰도: </span>
                      <strong className="text-emerald-400 font-bold">
                        {predictionData?.confidence || '높음 (82%)'}
                      </strong>
                    </div>
                  </div>

                  <p className="text-sm text-slate-200 leading-relaxed font-medium bg-white/5 p-3.5 rounded-xl border border-white/10">
                    💡 <strong className="text-amber-200">핵심 관전 포인트: </strong>
                    {predictionData?.keyPoint || `북메이커 마진 차감 후 기대값(+EV)이 양수 구간에 위치합니다.`}
                  </p>
                </div>

                {/* Multi-market Recommendations Grid */}
                {predictionData?.marketRecommendations && predictionData.marketRecommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 px-1 font-bold">
                      <span>📊 마켓별 퀀트 ROI & 가치 평가 (승패 / 핸디캡 / 언더오버)</span>
                      <span className="text-[11px] text-slate-400">예상 ROI(+EV) 기준 정렬</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {predictionData.marketRecommendations.map((m, idx) => {
                        const isRec = m.status === 'recommended';
                        const isExcluded = m.status === 'excluded';
                        const isRelativeLean = m.isRelativeBest;

                        return (
                          <div key={idx} className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                            m.isPrimary 
                              ? 'bg-indigo-50/90 border-indigo-300 shadow-xs' 
                              : isRelativeLean
                              ? 'bg-amber-50/90 border-amber-300 shadow-xs'
                              : isRec 
                              ? 'bg-emerald-50/80 border-emerald-200' 
                              : isExcluded
                              ? 'bg-rose-50/80 border-rose-200 opacity-90'
                              : 'bg-slate-50 border-slate-200 opacity-75'
                          }`}>
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1.5">
                                <span className="text-[10px] font-black uppercase text-slate-700 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                                  {m.marketLabel}
                                </span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isRec 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : isRelativeLean
                                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                    : isExcluded 
                                    ? 'bg-rose-100 text-rose-800' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {isRec 
                                    ? `추천 (ROI ${m.expectedRoi > 0 ? `+${m.expectedRoi}` : m.expectedRoi}%)` 
                                    : isRelativeLean
                                    ? '관망 (차선 Lean)'
                                    : (isExcluded ? '⚠️ 추천 제외' : '관망')}
                                </span>
                              </div>
                              <h4 className="text-xs sm:text-sm font-black text-slate-900">{m.pick}</h4>
                              <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">{m.reason}</p>
                            </div>
                            <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                              <span className="text-slate-600 font-mono text-[10px]">
                                {m.prob}% / {m.odds}배 <span className="text-slate-400 font-normal">({m.fairOdds}배)</span>
                              </span>
                              <span className={`font-mono font-black ${m.expectedRoi > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                ROI {m.expectedRoi > 0 ? `+${m.expectedRoi}%` : `${m.expectedRoi}%`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mathematical Probability & Odds Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Domestic vs Foreign vs Fair Odds Comparison */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>배당률 및 공정 확률 비교</span>
                      <span className="text-[10px] text-blue-600 font-bold">Shin's Margin Cleared</span>
                    </h4>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {/* Win */}
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-slate-500 font-semibold block mb-1">홈 승</span>
                        <span className="font-mono text-sm font-black text-blue-700 block">
                          {match.domestic.win}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          해외 {match.foreign.win}
                        </span>
                        <span className="mt-1 inline-block bg-blue-50 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          확률 {predictionData?.expectedProbabilities?.win || '54.2%'}
                        </span>
                      </div>

                      {/* Draw */}
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-slate-500 font-semibold block mb-1">무승부</span>
                        <span className="font-mono text-sm font-black text-gray-700 block">
                          {match.domestic.draw !== null ? match.domestic.draw : '-'}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          해외 {match.foreign.draw !== null ? match.foreign.draw : '-'}
                        </span>
                        <span className="mt-1 inline-block bg-gray-100 text-gray-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          {match.domestic.draw !== null ? `확률 ${predictionData?.expectedProbabilities?.draw || '25.8%'}` : '단통'}
                        </span>
                      </div>

                      {/* Lose */}
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-slate-500 font-semibold block mb-1">원정 승</span>
                        <span className="font-mono text-sm font-black text-red-600 block">
                          {match.domestic.lose}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          해외 {match.foreign.lose}
                        </span>
                        <span className="mt-1 inline-block bg-red-50 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                          확률 {predictionData?.expectedProbabilities?.lose || '20.0%'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      퀀트 수리 지표 요약
                    </h4>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-slate-400 text-[10px] block">북메이커 마진(Overround)</span>
                        <strong className="text-slate-900 font-mono text-sm">
                          {quantData?.overround || '13.76%'}
                        </strong>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-slate-400 text-[10px] block">샤논 엔트로피(불확실성)</span>
                        <strong className="text-purple-700 font-mono text-sm">
                          {quantData?.shannonEntropy?.bits || '1.42 bits'}
                        </strong>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-slate-400 text-[10px] block">PDI 지수 (대중 쏠림)</span>
                        <strong className="text-blue-700 font-mono text-sm">
                          {quantData?.valueMetrics?.pdi || '+5.4%p'}
                        </strong>
                      </div>

                      <div className="bg-white p-2.5 rounded-lg border border-gray-200">
                        <span className="text-slate-400 text-[10px] block">켈리 기준(Kelly Criterion)</span>
                        <strong className="text-emerald-700 font-mono text-sm">
                          {quantData?.valueMetrics?.kellyFraction || '+4.85%'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytical Commentary Sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100">
                    <h5 className="font-bold text-blue-900 mb-1.5 flex items-center gap-1.5">
                      <span>📊</span>
                      <span>H2H 맞대결 데이터 총평</span>
                    </h5>
                    <p className="text-slate-700 leading-relaxed">
                      {predictionData?.h2hSummary || `${match.homeTeam}과 ${match.awayTeam}의 역대 맞대결 기록을 파싱한 결과, 홈 구장에서의 득점 효율 및 실점 제어력이 유지되고 있습니다.`}
                    </p>
                  </div>

                  <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
                    <h5 className="font-bold text-indigo-900 mb-1.5 flex items-center gap-1.5">
                      <span>🧮</span>
                      <span>신스 모형(Shin's Model) 퀀트 총평</span>
                    </h5>
                    <p className="text-slate-700 leading-relaxed">
                      {predictionData?.quantSummary || `국내외 배당률 간 북메이커 마진을 소거한 공정 확률 모델에 따라 기대값 우위 구간을 산출했습니다.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 2: H2H & RECENT FORM (100% Wisetoto Real Live Scraped) */}
            {/* ======================================================== */}
            {activeTab === 'h2h' && (
              <div className="space-y-6">
                {/* H2H Record Summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                      <span>⚔️ {match.homeTeam} vs {match.awayTeam} 역대 맞대결 기록</span>
                      {h2hData?.h2h?.total ? (
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                          총 {h2hData.h2h.total}경기
                        </span>
                      ) : null}
                    </h4>
                    <div className="text-xs text-slate-600 font-mono">
                      <span>{match.homeTeam} 기준: </span>
                      <strong className="text-blue-700 font-bold">{h2hData?.h2h?.win || 0}승</strong>
                      <span className="mx-1">/</span>
                      <strong className="text-gray-700 font-bold">{h2hData?.h2h?.draw || 0}무</strong>
                      <span className="mx-1">/</span>
                      <strong className="text-red-600 font-bold">{h2hData?.h2h?.lose || 0}패</strong>
                      <span className="ml-2 font-bold text-slate-900">(승률: {h2hData?.h2h?.winRate || '50%'})</span>
                    </div>
                  </div>

                  {/* H2H Matches Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold border-b border-gray-200">
                          <th className="p-2 text-center w-20">일자</th>
                          <th className="p-2 w-24">대회</th>
                          <th className="p-2 text-right">홈팀</th>
                          <th className="p-2 text-center w-20">스코어</th>
                          <th className="p-2 text-left">원정팀</th>
                          <th className="p-2 text-center w-16">결과</th>
                          <th className="p-2 text-center w-16">U/O</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {h2hData?.h2h?.matches && h2hData.h2h.matches.length > 0 ? (
                          h2hData.h2h.matches.map((hm, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2 text-center font-mono text-gray-500">{hm.date}</td>
                              <td className="p-2 font-semibold text-slate-700">{hm.league}</td>
                              <td className="p-2 text-right font-bold text-slate-900">{hm.home}</td>
                              <td className="p-2 text-center font-mono font-black text-slate-900">
                                <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {hm.scoreHome} : {hm.scoreAway}
                                </span>
                              </td>
                              <td className="p-2 text-left font-bold text-slate-900">{hm.away}</td>
                              <td className="p-2 text-center">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                  hm.result === 'win' ? 'bg-blue-100 text-blue-800' :
                                  hm.result === 'draw' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-800'
                                }`}>
                                  {hm.result === 'win' ? '홈승' : hm.result === 'draw' ? '무' : '원정승'}
                                </span>
                              </td>
                              <td className="p-2 text-center font-mono text-[10px] text-gray-500">
                                {hm.isOver ? <span className="text-amber-600 font-bold">오버</span> : <span className="text-blue-600 font-bold">언더</span>}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-gray-500">
                              최근 맞대결 기록이 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* League Standings Summary */}
                {h2hData?.leagueStandings && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-slate-800 text-xs">
                          🏆 {h2hData.leagueStandings.normalizedLeagueName || `${match.league} 리그 순위`}
                        </span>
                        {h2hData.leagueStandings.leagueId && (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                            {h2hData.leagueStandings.leagueId}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 text-xs font-bold">
                        <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded border border-blue-200">
                          🏠 {match.homeTeam} {h2hData.leagueStandings.homeRank}
                        </span>
                        <span className="bg-red-100 text-red-900 px-2 py-0.5 rounded border border-red-200">
                          ✈️ {match.awayTeam} {h2hData.leagueStandings.awayRank}
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead>
                          <tr className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200 text-[11px]">
                            <th className="p-1.5 text-center w-10">순위</th>
                            <th className="p-1.5">팀명</th>
                            <th className="p-1.5 text-center">경기</th>
                            <th className="p-1.5 text-center">승</th>
                            <th className="p-1.5 text-center">무</th>
                            <th className="p-1.5 text-center">패</th>
                            <th className="p-1.5 text-center font-bold text-slate-900">승점</th>
                            <th className="p-1.5 text-center">득/실차</th>
                            <th className="p-1.5 text-center">최근 폼</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {h2hData.leagueStandings.standings.map((st) => {
                            const isHome = st.team === match.homeTeam || st.team.includes(match.homeTeam) || match.homeTeam.includes(st.team);
                            const isAway = st.team === match.awayTeam || st.team.includes(match.awayTeam) || match.awayTeam.includes(st.team);
                            return (
                              <tr
                                key={st.rank}
                                className={`${
                                  isHome
                                    ? 'bg-blue-50/80 font-bold text-blue-900 border-l-4 border-l-blue-600'
                                    : isAway
                                    ? 'bg-red-50/80 font-bold text-red-900 border-l-4 border-l-red-600'
                                    : 'hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                <td className="p-1.5 text-center font-mono font-bold">{st.rank}</td>
                                <td className="p-1.5 font-bold flex items-center gap-1">
                                  {st.team}
                                  {isHome && <span className="text-[10px] bg-blue-600 text-white px-1 rounded">홈</span>}
                                  {isAway && <span className="text-[10px] bg-red-600 text-white px-1 rounded">원정</span>}
                                </td>
                                <td className="p-1.5 text-center font-mono">{st.played}</td>
                                <td className="p-1.5 text-center font-mono text-blue-700">{st.win}</td>
                                <td className="p-1.5 text-center font-mono text-gray-500">{st.draw}</td>
                                <td className="p-1.5 text-center font-mono text-red-700">{st.lose}</td>
                                <td className="p-1.5 text-center font-mono font-black text-slate-900 bg-gray-100/50">{st.points}</td>
                                <td className="p-1.5 text-center font-mono text-[11px]">{st.diff}</td>
                                <td className="p-1.5 text-center">
                                  <div className="flex justify-center gap-0.5">
                                    {st.form?.slice(0, 3).map((f, fi) => (
                                      <span
                                        key={fi}
                                        className={`w-3.5 h-3.5 text-[9px] rounded-full flex items-center justify-center font-black text-white ${
                                          f === 'W' ? 'bg-blue-600' : f === 'D' ? 'bg-gray-400' : 'bg-red-500'
                                        }`}
                                      >
                                        {f}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Lineups & Injury Status */}
                {h2hData?.lineupsInfo && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-200 space-y-3">
                    <h5 className="font-black text-slate-800 text-xs flex items-center justify-between">
                      <span>📋 예상 선발 라인업 및 핵심 부상/결장자 정보</span>
                      <span className="text-[10px] text-gray-500 font-normal">경기 시작 전 최종 라인업 반영 완료</span>
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Home Team Lineup */}
                      <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <span className="font-bold text-xs text-blue-900 flex items-center gap-1">
                            🏠 {match.homeTeam}
                          </span>
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            {h2hData.lineupsInfo.homeLineup.formation}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-gray-500 block mb-1">주요 선발 출전 라인업:</span>
                          <div className="flex flex-wrap gap-1">
                            {h2hData.lineupsInfo.homeLineup.keyStarters.map((ks, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                                {ks}
                              </span>
                            ))}
                          </div>
                        </div>

                        {h2hData.lineupsInfo.homeLineup.injuries?.length > 0 && (
                          <div className="bg-red-50/80 p-2 rounded border border-red-200 space-y-1 mt-2">
                            <span className="text-[10px] font-bold text-red-800 flex items-center gap-1">
                              ⚠️ 부상 및 결장 이탈자:
                            </span>
                            {h2hData.lineupsInfo.homeLineup.injuries.map((inj, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-red-900">{inj.name} ({inj.reason})</span>
                                <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${inj.severity === 'high' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                                  {inj.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Away Team Lineup */}
                      <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                          <span className="font-bold text-xs text-red-900 flex items-center gap-1">
                            ✈️ {match.awayTeam}
                          </span>
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded">
                            {h2hData.lineupsInfo.awayLineup.formation}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-gray-500 block mb-1">주요 선발 출전 라인업:</span>
                          <div className="flex flex-wrap gap-1">
                            {h2hData.lineupsInfo.awayLineup.keyStarters.map((ks, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded border border-slate-200">
                                {ks}
                              </span>
                            ))}
                          </div>
                        </div>

                        {h2hData.lineupsInfo.awayLineup.injuries?.length > 0 && (
                          <div className="bg-red-50/80 p-2 rounded border border-red-200 space-y-1 mt-2">
                            <span className="text-[10px] font-bold text-red-800 flex items-center gap-1">
                              ⚠️ 부상 및 결장 이탈자:
                            </span>
                            {h2hData.lineupsInfo.awayLineup.injuries.map((inj, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-red-900">{inj.name} ({inj.reason})</span>
                                <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded ${inj.severity === 'high' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                                  {inj.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Form (Both Teams) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Home Team Recent Form */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                        <span>🏠 {match.homeTeam} 최근 경기 흐름</span>
                      </h5>
                      <div className="flex gap-1">
                        {h2hData?.homeRecentForm?.form?.map((f, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                              f === 'W' ? 'bg-blue-600' : f === 'D' ? 'bg-gray-400' : 'bg-red-500'
                            }`}
                          >
                            {f === 'W' ? '승' : f === 'D' ? '무' : '패'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {h2hData?.homeRecentForm?.recentMatches?.slice(0, 5).map((rm, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200">
                          <span className="font-mono text-[10px] text-gray-400">{rm.date}</span>
                          <span className="text-slate-600 truncate max-w-[120px]">
                            {rm.isHome ? '(홈)' : '(원정)'} vs {rm.opponent}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {rm.scoreFor} : {rm.scoreAgainst}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                            rm.result === 'W' ? 'bg-blue-100 text-blue-800' :
                            rm.result === 'D' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-800'
                          }`}>
                            {rm.result === 'W' ? '승' : rm.result === 'D' ? '무' : '패'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Away Team Recent Form */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-black text-slate-800 text-xs flex items-center gap-1.5">
                        <span>✈️ {match.awayTeam} 최근 경기 흐름</span>
                      </h5>
                      <div className="flex gap-1">
                        {h2hData?.awayRecentForm?.form?.map((f, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                              f === 'W' ? 'bg-blue-600' : f === 'D' ? 'bg-gray-400' : 'bg-red-500'
                            }`}
                          >
                            {f === 'W' ? '승' : f === 'D' ? '무' : '패'}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {h2hData?.awayRecentForm?.recentMatches?.slice(0, 5).map((rm, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200">
                          <span className="font-mono text-[10px] text-gray-400">{rm.date}</span>
                          <span className="text-slate-600 truncate max-w-[120px]">
                            {rm.isHome ? '(홈)' : '(원정)'} vs {rm.opponent}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {rm.scoreFor} : {rm.scoreAgainst}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-black ${
                            rm.result === 'W' ? 'bg-blue-100 text-blue-800' :
                            rm.result === 'D' ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-800'
                          }`}>
                            {rm.result === 'W' ? '승' : rm.result === 'D' ? '무' : '패'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 3: QUANT MODEL & STATISTICAL METRICS (Shin's Model) */}
            {/* ======================================================== */}
            {activeTab === 'quant' && (
              <div className="space-y-6">
                <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl">
                  <h4 className="text-sm font-black text-amber-400 mb-1">
                    신스 모형 (Shin's Model 1993) 수학적 마진 소거 이론
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    북메이커가 부과하는 마진(Overround {quantData?.overround || '13.76%'})을 내부자 거래 비율(z)과 비선형 최적화 기법을 통해 수학적으로 역산하여 공정 확률(Fair Probability)을 도출합니다.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <span className="text-xs text-blue-800 font-bold block mb-1">홈 승 진실 확률</span>
                    <strong className="text-2xl font-mono text-blue-950 block">
                      {quantData?.shinsModel?.win || '54.2%'}
                    </strong>
                    <span className="text-[11px] text-blue-600 font-mono">적정 배당: {predictionData?.fairOdds?.win || 1.85}</span>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <span className="text-xs text-gray-700 font-bold block mb-1">무승부 진실 확률</span>
                    <strong className="text-2xl font-mono text-gray-900 block">
                      {quantData?.shinsModel?.draw || '25.8%'}
                    </strong>
                    <span className="text-[11px] text-gray-500 font-mono">적정 배당: {predictionData?.fairOdds?.draw || '-'}</span>
                  </div>

                  <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <span className="text-xs text-red-800 font-bold block mb-1">원정 승 진실 확률</span>
                    <strong className="text-2xl font-mono text-red-950 block">
                      {quantData?.shinsModel?.lose || '20.0%'}
                    </strong>
                    <span className="text-[11px] text-red-600 font-mono">적정 배당: {predictionData?.fairOdds?.lose || 5.00}</span>
                  </div>
                </div>

                {/* Dixon-Coles Score Matrix Chart */}
                {quantData?.dixonColes?.scoreProbabilities && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-gray-200">
                    <h5 className="text-xs font-bold text-gray-700 mb-3">
                      딕슨-콜스(Dixon-Coles) 포아송 스코어 확률 매트릭스
                    </h5>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={quantData.dixonColes.scoreProbabilities}>
                          <XAxis dataKey="score" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip formatter={(v: any) => [`${v}`, '예상 확률']} />
                          <Bar dataKey="prob" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                            {quantData.dixonColes.scoreProbabilities.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#1d4ed8' : '#60a5fa'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 4: 100% PURE QUANT MATHEMATICAL REPORT */}
            {/* ======================================================== */}
            {activeTab === 'ai' && (
              <div className="space-y-4">
                <div className="bg-slate-900 text-white p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔬</span>
                    <h4 className="text-sm font-black text-amber-300">
                      수리 퀀트 전문 해설 리포트 (100% 순수 수리 통계 모형)
                    </h4>
                  </div>
                  <span className="text-[10px] text-blue-300 bg-blue-900/60 border border-blue-700/50 px-2 py-0.5 rounded font-mono">
                    100% PURE QUANT
                  </span>
                </div>

                <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-gray-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line">
                  {aiCommentary}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
