import React, { useState } from 'react';
import { MatchItem, QuantAnalysisResult, PredictionResult, BacktestSummary, SharpNoVigBenchmark } from '../types';
import { getStandardKoreanTeamName } from '../utils/teamNameMatcher';
import { getPrimaryPickInfo } from '../utils/quantPickEvaluator';

interface QuantIntegratedModalLayoutProps {
  match: MatchItem;
  quantData: QuantAnalysisResult | null;
  predictionData: PredictionResult | null;
  sharpBenchmark: SharpNoVigBenchmark | null;
  backtestSummary: BacktestSummary | null;
  parsedUo: number;
  parsedHandi: number;
  onNavigateTab?: (tab: string) => void;
}

export function QuantIntegratedModalLayout({
  match,
  quantData,
  predictionData,
  sharpBenchmark,
  backtestSummary,
  parsedUo,
  parsedHandi
}: QuantIntegratedModalLayoutProps) {
  // 3 Layout Views matching the 3 Screenshots
  const [activeView, setActiveView] = useState<'view1_grid' | 'view2_gauges' | 'view3_tactical'>('view1_grid');
  const [summarySubTab, setSummarySubTab] = useState<'top_pick' | 'all_summary'>('top_pick');
  const [openAccordions, setOpenAccordions] = useState<{ [key: string]: boolean }>({
    fundamental: true,
    steam: true,
    news: false
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const stdHome = getStandardKoreanTeamName(match.homeTeam);
  const stdAway = getStandardKoreanTeamName(match.awayTeam);

  // Dynamic Probabilities & Evaluations via Master Evaluator
  const primary = getPrimaryPickInfo(match);
  const topPickTitle = primary.recommendedPick;
  const roi = primary.expectedRoi >= 0 ? `+${primary.expectedRoi}%` : `${primary.expectedRoi}%`;

  const pWin = primary.prob;
  const pLose = Math.max(10, Math.round((100 - pWin) * 10) / 10);
  const pDraw = match.sport === 'soccer' ? 18.0 : 0;

  // Entropy
  const probW = Math.max(0.01, pWin / 100);
  const probD = Math.max(0.01, pDraw / 100);
  const probL = Math.max(0.01, pLose / 100);
  const entropy = Number((-(probW * Math.log2(probW)) - (probD * Math.log2(probD)) - (probL * Math.log2(probL))).toFixed(2)) || 0.65;

  return (
    <div className="bg-[#0b131e] text-slate-100 rounded-2xl border border-[#1b2a3a] shadow-2xl overflow-hidden font-sans">
      
      {/* Top Main Mode Switcher for the 3 Screenshots */}
      <div className="bg-[#0f1b2b] px-4 py-2.5 border-b border-[#1f3347] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-amber-400 flex items-center gap-1.5">
            <span>🎯</span>
            <span>실전 베팅 최종 결론</span>
          </span>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
            | {match.league} {match.categoryLabel}
          </span>
        </div>

        {/* 3 View Tabs corresponding directly to User's 3 Screenshots */}
        <div className="flex items-center gap-1.5 bg-[#080d14] p-1 rounded-xl border border-[#1b2a3a]">
          <button
            onClick={() => setActiveView('view1_grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'view1_grid'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#162536]'
            }`}
          >
            <span>📋</span>
            <span>통합 앙상블 & 가치 그리드</span>
          </button>
          <button
            onClick={() => setActiveView('view2_gauges')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'view2_gauges'
                ? 'bg-teal-400 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#162536]'
            }`}
          >
            <span>⏱️</span>
            <span>3패널 퀀트 게이지 & ROI</span>
          </button>
          <button
            onClick={() => setActiveView('view3_tactical')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'view3_tactical'
                ? 'bg-blue-500 text-white font-black shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-[#162536]'
            }`}
          >
            <span>⚽</span>
            <span>4분할 전술/xG/시장효율</span>
          </button>
        </div>

        {/* Entropy Tag on Right */}
        <div className="flex items-center gap-2">
          <span className="bg-[#112a20] border border-[#22573f] text-[#4ade80] text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
            <span>저위험 단통 축</span>
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SCREENSHOT 1: 통합 앙상블 & 마켓별 퀀트 가치 평가 그리드                      */}
      {/* ========================================================================= */}
      {activeView === 'view1_grid' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Hero Banner with Bell Curve & Edge Highlight */}
          <div className="bg-[#0d1c2b] border border-[#1b344d] rounded-xl p-4 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-1.5">
                  <span>🏆 1순위 TOP 픽:</span>
                  <span className="text-white underline decoration-amber-400/40 underline-offset-4">{topPickTitle}</span>
                </span>
              </div>
              <div className="flex items-start gap-2 text-xs sm:text-[13px] text-slate-300 font-medium">
                <span className="text-emerald-400 font-bold">✅</span>
                <span>
                  <strong className="text-emerald-400">핵심 근거:</strong> 통합 앙상블 모델이 시장 배당 거품을 제거하고 <strong className="text-amber-300">9.2%의 진성 엣지(+EV)</strong>를 포착. (엔트로피: {entropy} bits - 매우 안정적)
                </span>
              </div>
            </div>

            {/* Bell Curve Graph / Edge Visualization */}
            <div className="bg-[#09131f] border border-[#1a2d40] rounded-xl p-2.5 flex items-center gap-3 shrink-0">
              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-300 flex items-center gap-1 justify-end">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>통합 앙상블 엣지 시각화 📈</span>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 font-black mt-0.5">Edge(+9.2%)</div>
              </div>
              <div className="w-28 h-12 flex items-end justify-center">
                <svg viewBox="0 0 120 50" className="w-full h-full overflow-visible">
                  <path
                    d="M 5,45 Q 40,44 55,30 Q 70,8 80,12 Q 90,20 115,45"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="2.5"
                  />
                  <path
                    d="M 5,45 Q 40,44 55,30 Q 70,8 80,12 Q 90,20 115,45 L 115,48 L 5,48 Z"
                    fill="rgba(234, 179, 8, 0.15)"
                  />
                  {/* Peak Marker */}
                  <circle cx="75" cy="10" r="3.5" fill="#4ade80" />
                  <line x1="75" y1="10" x2="75" y2="45" stroke="#4ade80" strokeDasharray="2,2" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Sub Navigation Bar & Top Pick Summary Bar */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSummarySubTab('top_pick')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  summarySubTab === 'top_pick'
                    ? 'bg-[#182a3d] text-amber-300 border border-[#2b4461]'
                    : 'text-slate-400 hover:text-white bg-[#0b1420]'
                }`}
              >
                <span>🏆 1순위 TOP 픽 상세 요약</span>
              </button>
              <button
                onClick={() => setSummarySubTab('all_summary')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  summarySubTab === 'all_summary'
                    ? 'bg-[#182a3d] text-amber-300 border border-[#2b4461]'
                    : 'text-slate-400 hover:text-white bg-[#0b1420]'
                }`}
              >
                <span>전체 요약</span>
              </button>
            </div>

            {/* Top Pick Stats Box */}
            <div className="bg-[#0e1927] border border-[#1b3149] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-amber-300">🏆 1순위 TOP 픽:</span>
                  <span className="text-sm font-black text-white">{topPickTitle}</span>
                  <span className="text-[11px] font-black text-[#4ade80] bg-[#102e21] px-2 py-0.5 rounded-md border border-[#1e583d]">
                    추천 (ROI +9.2%)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="font-bold text-slate-300">시장 정보</span>
                  <span className="font-mono bg-[#142233] px-2 py-0.5 rounded text-slate-300">Handicap ({parsedHandi})</span>
                  <span className="font-mono bg-[#142233] px-2 py-0.5 rounded text-slate-300">O/U ({parsedUo})</span>
                  <span className="font-mono bg-[#142233] px-2 py-0.5 rounded text-slate-300">Moneyline</span>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="text-center font-mono">
                  <div className="text-[10px] text-slate-400 font-sans">판더멘털 공정 확률 (P_fund)</div>
                  <div className="text-sm font-black text-blue-400 mt-0.5">72.4%</div>
                </div>

                <div className="w-12 h-12 relative flex items-center justify-center">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#16293d" strokeWidth="4" />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="4"
                      strokeDasharray="80 100"
                      strokeDashoffset="0"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="4"
                      strokeDasharray="20 100"
                      strokeDashoffset="-80"
                    />
                  </svg>
                  <div className="absolute text-[8px] font-black text-emerald-300 font-mono">72%</div>
                </div>

                <div className="text-center font-mono">
                  <div className="text-[10px] text-slate-400 font-sans">신스 No-Vig 시장 확률 (P_mkt_adj)</div>
                  <div className="text-sm font-black text-amber-400 mt-0.5">65.2%</div>
                </div>

                <div className="border-l border-[#1f3752] pl-4 space-y-1 font-mono text-[11px]">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[10px]">시장 확률</span>
                    <span className="text-slate-200">76.1%</span>
                    <span className="text-slate-200">45.3%</span>
                    <span className="text-slate-200">67.4%</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-[10px]">엣지</span>
                    <span className="text-emerald-400 font-black">+8.7%</span>
                    <span className="text-red-400 font-black">-5.8%</span>
                    <span className="text-emerald-400 font-black">+8.9%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Screenshot 1 Table: 마켓별 퀀트 가치 평가 그리드 */}
          <div className="bg-[#0e1927] border border-[#1b3149] rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#122133] border-b border-[#1f3752] flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <span>📊</span>
                <span>마켓별 퀀트 가치 평가 그리드</span>
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#09121d] text-slate-400 border-b border-[#1b3149]">
                    <th className="py-2.5 px-3 font-bold">마켓</th>
                    <th className="py-2.5 px-3 font-bold">픽</th>
                    <th className="py-2.5 px-3 font-bold text-center font-mono">모델 확률</th>
                    <th className="py-2.5 px-3 font-bold text-center font-mono">시장 배당</th>
                    <th className="py-2.5 px-3 font-bold text-center">추천/상태</th>
                    <th className="py-2.5 px-3 font-bold text-center font-mono">가치 점수</th>
                    <th className="py-2.5 px-3 font-bold">비고</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#172738]">
                  {primary.candidates.map((cand, idx) => {
                    const isTop = cand.pick === primary.recommendedPick;
                    return (
                      <tr 
                        key={idx}
                        className={isTop ? "bg-[#152a40]/70 hover:bg-[#152a40] transition-colors border-l-4 border-amber-400 font-black" : "hover:bg-[#122336] transition-colors"}
                      >
                        <td className={`py-3 px-3 flex items-center gap-1.5 ${isTop ? 'font-black text-amber-300' : 'font-bold text-slate-200'}`}>
                          <span>{cand.marketLabel === '일반' ? '⚽' : cand.marketLabel === '핸디캡' ? '🦾' : '⚖️'}</span>
                          <span>{cand.marketLabel}</span>
                        </td>
                        <td className={`py-3 px-3 ${isTop ? 'font-black text-white' : 'font-bold text-white'}`}>
                          {cand.pick}
                        </td>
                        <td className={`py-3 px-3 text-center font-mono ${isTop ? 'font-black text-emerald-400' : 'font-bold text-blue-400'}`}>
                          {cand.prob}%
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-amber-300">
                          {cand.odds && typeof cand.odds === 'number' ? cand.odds.toFixed(2) : '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {isTop ? (
                            <span className="bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full font-black text-[11px] shadow-xs inline-flex items-center gap-1">
                              <span>🏆</span>
                              <span>1순위 TOP 픽</span>
                            </span>
                          ) : (
                            <span className={cand.expectedRoi >= 0 ? "text-[#4ade80] font-black" : "text-slate-400 font-bold"}>
                              {cand.expectedRoi >= 0 ? `추천 (ROI +${cand.expectedRoi}%)` : '관망/패스'}
                            </span>
                          )}
                        </td>
                        <td className={`py-3 px-3 text-center font-mono ${isTop ? 'font-black text-amber-300' : 'font-bold text-slate-300'}`}>
                          {isTop ? '10/10' : (cand.expectedRoi >= 0 ? '8/10' : '5/10')}
                        </td>
                        <td className={`py-3 px-3 ${isTop ? 'text-amber-300 font-black' : 'text-slate-400 font-medium'}`}>
                          {cand.badge ? cand.badge : (isTop ? '황금 배당 최적 기회' : (cand.expectedRoi >= 0 ? '가치 구간' : '변동성 주의'))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Screenshot 1 Section: 통합 모델 심층 분석 근거 */}
          <div className="bg-[#0e1927] border border-[#1b3149] rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-[#122133] border-b border-[#1f3752] flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                <span>🧠</span>
                <span>통합 모델 심층 분석 근거</span>
              </h4>
            </div>

            <div className="divide-y divide-[#172738] text-xs">
              {/* Row 1: 펀더멘털 모델 */}
              <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                <div className="md:col-span-4 font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  <span>펀더멘털 모델 (음이항 xG + 칼만 결장자)</span>
                </div>
                <div className="md:col-span-5 text-slate-300">
                  <strong className="text-slate-100">모델 세부:</strong> 최근 10경기 xG 기반, 주전 GK 및 수비수 결장 반영 <span className="text-blue-400 font-mono font-bold">(P_fund 72.4%)</span>
                </div>
                <div className="md:col-span-3 text-right text-slate-400 font-mono">
                  <span className="text-slate-300 font-sans">최근 성적:</span> 홈: 4승 1무 0패, 원정: 2승 2무 1패
                </div>
              </div>

              {/* Row 2: 샤프 마켓 비교 */}
              <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                <div className="md:col-span-4 font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                  <span>샤프 마켓 비교 (신스 롱샷 바이어스 보정)</span>
                </div>
                <div className="md:col-span-5 text-slate-300">
                  <strong className="text-slate-100">마켓 영향:</strong> Shin's model 기준 No-Vig 확률 65.2%, Steam Move 지속적 하락
                </div>
                <div className="md:col-span-3 text-right text-emerald-400 font-mono font-bold">
                  <span className="text-slate-300 font-sans">주요 이득:</span> -1.6% (P_mkt_adj 65.2%)
                </div>
              </div>

              {/* Row 3: 18년 백테스트 및 심판 성향 */}
              <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                <div className="md:col-span-4 font-bold text-slate-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  <span>18년 백테스트 및 심판 성향</span>
                </div>
                <div className="md:col-span-5 text-slate-300">
                  <strong className="text-slate-100">역사적 성과:</strong> 핸디캡({parsedHandi}) 시장 ROI <span className="text-purple-300 font-mono font-bold">+14.3%</span> (184경기 표본)
                </div>
                <div className="md:col-span-3 text-right text-slate-300">
                  <span className="text-slate-400">심판 성향:</span> 주심 A (평균 옐로카드 3.8, 홈팀 페널티킥 자주 부여)
                </div>
              </div>

              {/* Row 4: 시장 배당 흐름 분석 */}
              <div className="p-3.5 grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center bg-[#0a1420]/80">
                <div className="md:col-span-4 font-bold text-slate-200 flex items-center gap-1.5">
                  <span>📉</span>
                  <span>시장 배당 흐름 분석 배당 추이</span>
                </div>
                <div className="md:col-span-4 text-slate-300 flex items-center gap-3 font-mono">
                  <div>
                    <span className="text-slate-400 text-[10px] block">개장 배당</span>
                    <span className="font-bold text-slate-200">2.15</span>
                  </div>
                  <span className="text-slate-500">→</span>
                  <div>
                    <span className="text-slate-400 text-[10px] block">현재 배당</span>
                    <span className="font-bold text-amber-400">1.90</span>
                  </div>
                  <span className="text-slate-500">→</span>
                  <div>
                    <span className="text-slate-400 text-[10px] block">이동 폭</span>
                    <span className="font-bold text-emerald-400">-11.6%</span>
                  </div>
                </div>
                <div className="md:col-span-4 text-right text-xs text-amber-300 font-bold flex items-center justify-end gap-1.5">
                  <span>지속적 하락세 (가파름)</span>
                  <span className="text-slate-400 font-mono text-[10px]">Steam Move Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREENSHOT 2: 3패널 퀀트 게이지 & ROI 곡선                                 */}
      {/* ========================================================================= */}
      {activeView === 'view2_gauges' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Subheader & Kelly Formula Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d1c2b] p-3.5 rounded-xl border border-[#1b344d]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-black text-amber-300 flex items-center gap-1.5">
                <span>🎯 상세분석:</span>
                <span className="text-white">{topPickTitle}</span>
              </span>
              <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[11px] font-bold px-2 py-0.5 rounded">
                {match.league} 널널
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="bg-[#122e23] border border-[#22573f] text-[#4ade80] text-xs font-mono font-bold px-3 py-1 rounded-lg">
                1/4 켈리 공식 권장 비중: 2.3%
              </span>
            </div>
          </div>

          {/* Key Judgment Point Banner */}
          <div className="bg-[#121c2a] border-l-4 border-amber-400 p-3 rounded-r-xl text-xs text-slate-300">
            <strong className="text-amber-300">💡 핵심 판정 포인트:</strong> 엔트로피 {entropy} bits (초고위험 혼전·이변 구간 (불확실성: 97.2%)) | 2개 마켓 유효
          </div>

          {/* 3 Panels Layout (종합 퀀트 요약 | 마켓별 심층 가치 | 베팅 근거 데이터) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Panel 1: [종합 퀀트 요약] (lg:col-span-4) */}
            <div className="lg:col-span-4 bg-[#0e1927] border border-[#1b3149] rounded-xl p-4 space-y-4">
              <div className="text-xs font-black text-slate-300 border-b border-[#1b3149] pb-2">
                [종합 퀀트 요약]
              </div>

              <div className="space-y-1">
                <div className="text-xs font-black text-amber-300 flex items-center gap-1">
                  <span>🔥 1순위 TOP 픽 상세 요약</span>
                </div>
                <div className="text-sm font-black text-white">{topPickTitle}</div>
                <div className="text-xs text-emerald-400 font-bold mt-1">~ 추천 (ROI -4.9%)</div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 pt-2">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-300">
                    <span>펀더멘털 공정 확률 (P_fund)</span>
                    <span className="font-mono text-blue-400">68.5%</span>
                  </div>
                  <div className="w-full bg-[#16273b] h-2 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full rounded-full" style={{ width: '68.5%' }}></div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-300">
                    <span>신스 No-Vig 시장 확률 (P_mkt_adj)</span>
                    <span className="font-mono text-amber-400">62.1%</span>
                  </div>
                  <div className="w-full bg-[#16273b] h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full" style={{ width: '62.1%' }}></div>
                  </div>
                </div>
              </div>

              {/* Profit / ROI Curve Sparkline */}
              <div className="pt-3 border-t border-[#182a3d]">
                <div className="h-20 w-full">
                  <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible">
                    <path
                      d="M 5,50 L 30,48 L 55,42 L 70,45 L 90,38 L 110,40 L 130,28 L 150,22 L 170,25 L 195,12"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="2"
                    />
                    <circle cx="195" cy="12" r="3" fill="#eab308" />
                  </svg>
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
                  <span>2022</span>
                  <span>10:28</span>
                  <span>2020</span>
                  <span>2021</span>
                </div>
              </div>
            </div>

            {/* Panel 2: [마켓별 심층 가치] (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-[#0e1927] border border-[#1b3149] rounded-xl p-4 space-y-4">
              <div className="text-xs font-black text-slate-300 border-b border-[#1b3149] pb-2">
                [마켓별 심층 가치]
              </div>

              {/* 3 Micro-Gauges Columns */}
              <div className="grid grid-cols-3 gap-2">
                {/* Micro Col 1: 일반 승무패 */}
                <div className="bg-[#0a121c] p-2.5 rounded-lg border border-[#17283c] flex flex-col justify-between items-center text-center space-y-2">
                  <div className="text-[10px] font-bold text-slate-300">
                    <div>⚽ 일반 승무패</div>
                    <div className="text-slate-100 font-black mt-0.5">{match.awayTeam} 승</div>
                  </div>

                  {/* Half Gauge Red */}
                  <div className="w-16 h-10 relative flex items-end justify-center">
                    <svg viewBox="0 0 100 55" className="w-full h-full">
                      <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke="#22354a" strokeWidth="10" strokeLinecap="round" />
                      <path d="M 10,50 A 40,40 0 0,1 40,16" fill="none" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-red-400">ROI -11.2%</div>

                  <div className="w-full text-[9px] text-slate-400 border-t border-[#17283c] pt-1">
                    <div className="flex justify-between">
                      <span>P_fund</span>
                      <span className="font-mono text-slate-200">68.5%</span>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span>P_mkt_adj</span>
                      <span className="font-mono text-slate-200">62.1%</span>
                    </div>
                  </div>
                </div>

                {/* Micro Col 2: 언더오버 */}
                <div className="bg-[#0a121c] p-2.5 rounded-lg border border-[#17283c] flex flex-col justify-between items-center text-center space-y-2">
                  <div className="text-[10px] font-bold text-slate-300">
                    <div>⚖️ 언더오버 ({parsedUo})</div>
                    <div className="text-slate-100 font-black mt-0.5">{parsedUo} 기준 오버</div>
                    <span className="text-[8px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded mt-0.5 inline-block">관망/패스</span>
                  </div>

                  {/* Half Gauge Gray */}
                  <div className="w-16 h-10 relative flex items-end justify-center">
                    <svg viewBox="0 0 100 55" className="w-full h-full">
                      <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke="#22354a" strokeWidth="10" strokeLinecap="round" />
                      <path d="M 10,50 A 40,40 0 0,1 55,10" fill="none" stroke="#94a3b8" strokeWidth="10" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="text-[11px] font-mono font-bold text-slate-400">신스 No-Vig</div>

                  <div className="w-full text-[9px] text-slate-400 border-t border-[#17283c] pt-1">
                    <div className="flex justify-between">
                      <span>P_fund</span>
                      <span className="font-mono text-slate-200">68.5%</span>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span>P_mkt_adj</span>
                      <span className="font-mono text-slate-200">62.1%</span>
                    </div>
                  </div>
                </div>

                {/* Micro Col 3: 핸디캡 */}
                <div className="bg-[#112338] p-2.5 rounded-lg border-2 border-emerald-500/60 flex flex-col justify-between items-center text-center space-y-2">
                  <div className="text-[10px] font-bold text-slate-300">
                    <div>🦾 핸디캡 ({parsedHandi})</div>
                    <div className="text-amber-300 font-black mt-0.5">{match.homeTeam} {parsedHandi > 0 ? `+${parsedHandi}` : parsedHandi}</div>
                    <span className="text-[8px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.2 rounded mt-0.5 inline-block">🏆 1순위 TOP 픽</span>
                  </div>

                  {/* Half Gauge Green */}
                  <div className="w-16 h-10 relative flex items-end justify-center">
                    <svg viewBox="0 0 100 55" className="w-full h-full">
                      <path d="M 10,50 A 40,40 0 0,1 90,50" fill="none" stroke="#22354a" strokeWidth="10" strokeLinecap="round" />
                      <path d="M 10,50 A 40,40 0 0,1 80,24" fill="none" stroke="#4ade80" strokeWidth="10" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div className="text-[11px] font-mono font-black text-emerald-400">ROI -4.9%</div>

                  <div className="w-full text-[9px] text-slate-400 border-t border-[#17283c] pt-1">
                    <div className="flex justify-between">
                      <span>P_fund</span>
                      <span className="font-mono text-emerald-300 font-bold">68.5%</span>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span>P_mkt_adj</span>
                      <span className="font-mono text-slate-200 font-bold">62.1%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel 3: [베팅 근거 데이터] (lg:col-span-3) */}
            <div className="lg:col-span-3 bg-[#0e1927] border border-[#1b3149] rounded-xl p-4 space-y-3">
              <div className="text-xs font-black text-slate-300 border-b border-[#1b3149] pb-2">
                [베팅 근거 데이터]
              </div>

              {/* Accordion 1: 펀더멘털 모델 */}
              <div className="bg-[#09121d] rounded-lg border border-[#17283c] overflow-hidden text-xs">
                <button
                  onClick={() => toggleAccordion('fundamental')}
                  className="w-full p-2.5 text-left font-bold text-slate-200 flex items-center justify-between hover:bg-[#122234] transition-colors cursor-pointer"
                >
                  <span>{openAccordions.fundamental ? '∨' : '›'} 펀더멘털 모델 (xG, Elo 등)</span>
                </button>
                {openAccordions.fundamental && (
                  <div className="p-2.5 bg-[#0e1b29] border-t border-[#17283c] text-[11px] text-slate-400 font-mono space-y-1">
                    <div>xG, db -3.36 - 6.4%</div>
                    <div>딕 6.1% - 6.14 - 8.7%</div>
                    <div>메루 테일 1% - 2.3%</div>
                  </div>
                )}
              </div>

              {/* Accordion 2: 시장 및 배당 흐름 */}
              <div className="bg-[#09121d] rounded-lg border border-[#17283c] overflow-hidden text-xs">
                <button
                  onClick={() => toggleAccordion('steam')}
                  className="w-full p-2.5 text-left font-bold text-slate-200 flex items-center justify-between hover:bg-[#122234] transition-colors cursor-pointer"
                >
                  <span>{openAccordions.steam ? '∨' : '›'} 시장 및 배당 흐름 분석 (Steam Moves)</span>
                </button>
                {openAccordions.steam && (
                  <div className="p-2.5 bg-[#0e1b29] border-t border-[#17283c] text-[11px] text-slate-400 font-mono space-y-1">
                    <div>6.60% - 3.31 - 6.2%</div>
                    <div>압구 입맛토 24% - -3.3%</div>
                  </div>
                )}
              </div>

              {/* Accordion 3: 팀 뉴스, 결장자, 심판 성향 */}
              <div className="bg-[#09121d] rounded-lg border border-[#17283c] overflow-hidden text-xs">
                <button
                  onClick={() => toggleAccordion('news')}
                  className="w-full p-2.5 text-left font-bold text-slate-200 flex items-center justify-between hover:bg-[#122234] transition-colors cursor-pointer"
                >
                  <span>{openAccordions.news ? '∨' : '›'} 📰 팀 뉴스, 결장자, 심판 성향</span>
                </button>
                {openAccordions.news && (
                  <div className="p-2.5 bg-[#0e1b29] border-t border-[#17283c] text-[11px] text-slate-400 font-mono space-y-1">
                    <div>5.67% - 4.10 - 3.7%</div>
                    <div>(::5 KP - 3.4P --7.7%</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREENSHOT 3: 4분할 전술/xG/시장효율 매트릭스                                */}
      {/* ========================================================================= */}
      {activeView === 'view3_tactical' && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Subheader Matching Screenshot 3 */}
          <div className="bg-[#0d1c2b] p-3.5 rounded-xl border border-[#1b344d] flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-black text-white flex items-center gap-2">
                <span>📊</span>
                <span>경기 상세 분석: {stdHome} vs {stdAway}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>📅 {match.date || '2024-07-26'}</span>
                <span>•</span>
                <span>🏆 {match.league}</span>
                <span>•</span>
                <span>🏟️ {stdHome} 홈</span>
              </div>
            </div>
          </div>

          {/* 4-Quadrant Matrix Layout (2x2 Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quadrant 1: 📈 핵심 퀀트 지표 */}
            <div className="bg-[#0e1927] border border-[#1b3149] rounded-xl p-4 space-y-3.5">
              <div className="text-xs font-black text-slate-200 flex items-center gap-1.5 border-b border-[#1b3149] pb-2">
                <span>📈</span>
                <span>핵심 퀀트 지표</span>
              </div>

              {/* Metric 1: xG (예상 득점) */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>xG (예상 득점)</span>
                  <div className="flex gap-4 font-mono text-[11px]">
                    <span className="text-emerald-400">{stdHome} 1.9</span>
                    <span className="text-red-400">{stdAway} 1.4</span>
                  </div>
                </div>
                <div className="w-full bg-[#16273b] h-3 rounded-md overflow-hidden flex">
                  <div className="bg-[#4ade80] h-full" style={{ width: '58%' }}></div>
                  <div className="bg-[#ef4444] h-full" style={{ width: '42%' }}></div>
                </div>
              </div>

              {/* Metric 2: 공격 가중치 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>공격 가중치</span>
                  <div className="flex gap-4 font-mono text-[11px]">
                    <span className="text-emerald-400">65%</span>
                    <span className="text-red-400">62%</span>
                  </div>
                </div>
                <div className="w-full bg-[#16273b] h-3 rounded-md overflow-hidden flex">
                  <div className="bg-[#4ade80] h-full" style={{ width: '51%' }}></div>
                  <div className="bg-[#ef4444] h-full" style={{ width: '49%' }}></div>
                </div>
              </div>

              {/* Metric 3: 경기 템포 */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>경기 템포</span>
                  <div className="flex gap-4 text-[11px] font-bold">
                    <span className="text-amber-400">Medium</span>
                    <span className="text-emerald-400">High</span>
                  </div>
                </div>
                <div className="w-full bg-[#16273b] h-3 rounded-md overflow-hidden flex">
                  <div className="bg-[#f59e0b] h-full" style={{ width: '45%' }}></div>
                  <div className="bg-[#10b981] h-full" style={{ width: '55%' }}></div>
                </div>
              </div>
            </div>

            {/* Quadrant 2: ⚖️ 시장 배당 효율성 (Donut Inefficiencies) */}
            <div className="bg-[#0e1927] border border-[#1b3149] rounded-xl p-4 space-y-3.5">
              <div className="text-xs font-black text-slate-200 flex items-center gap-1.5 border-b border-[#1b3149] pb-2">
                <span>⚖️</span>
                <span>시장 배당 효율성</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Circle 1: Home Market Efficiency */}
                <div className="flex flex-col items-center text-center space-y-1.5">
                  <div className="text-xs font-bold text-slate-300">{stdHome} 승 시장 효율</div>
                  <div className="w-20 h-20 relative flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#16293d" strokeWidth="3.5" />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="3.5"
                        strokeDasharray="89 100"
                        strokeDashoffset="0"
                      />
                    </svg>
                    <div className="absolute text-center leading-tight">
                      <div className="text-xs font-black text-emerald-400 font-mono">89%</div>
                      <div className="text-[7px] text-slate-400 uppercase font-bold">Fair</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Inefficiency</div>
                </div>

                {/* Circle 2: Away Market Efficiency */}
                <div className="flex flex-col items-center text-center space-y-1.5">
                  <div className="text-xs font-bold text-slate-300">{stdAway} 승 시장 효율</div>
                  <div className="w-20 h-20 relative flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#16293d" strokeWidth="3.5" />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3.5"
                        strokeDasharray="92 100"
                        strokeDashoffset="0"
                      />
                    </svg>
                    <div className="absolute text-center leading-tight">
                      <div className="text-xs font-black text-sky-400 font-mono">92%</div>
                      <div className="text-[7px] text-slate-400 uppercase font-bold">Fair</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Inefficiency</div>
                </div>
              </div>

              <div className="text-center text-[10px] text-slate-500">예상 승률 괴리율</div>
            </div>

            {/* Quadrant 3: 🔄 팀별 전술 상성 매트릭스 */}
            <div className="bg-[#0e1927] border border-[#1b3149] rounded-xl p-4 space-y-3.5">
              <div className="text-xs font-black text-slate-200 flex items-center gap-1.5 border-b border-[#1b3149] pb-2">
                <span>🔄</span>
                <span>팀별 전술 상성</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-center border-collapse text-xs">
                  <thead>
                    <tr className="text-slate-400 text-[11px]">
                      <th className="pb-2 text-left font-normal"></th>
                      <th className="pb-2 font-bold">공격 전환 속도</th>
                      <th className="pb-2 font-bold text-emerald-400">수비 안정성 (Good)</th>
                      <th className="pb-2 font-bold">세트피스 위협</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#17283c]">
                    {/* Home Row (All Green) */}
                    <tr>
                      <td className="py-2.5 text-left font-bold text-slate-200">{stdHome} (SD)</td>
                      <td className="py-2.5 bg-[#12281e] text-emerald-400 font-black">✔</td>
                      <td className="py-2.5 bg-[#12281e] text-emerald-400 font-black">✔</td>
                      <td className="py-2.5 bg-[#12281e] text-emerald-400 font-black">✔</td>
                    </tr>
                    {/* Away Row (Green + Yellow Warning) */}
                    <tr>
                      <td className="py-2.5 text-left font-bold text-slate-200">{stdAway} (PHL)</td>
                      <td className="py-2.5 bg-[#12281e] text-emerald-400 font-black">✔</td>
                      <td className="py-2.5 bg-[#262413] text-amber-400 font-black">⚠️</td>
                      <td className="py-2.5 bg-[#262413] text-amber-400 font-black">⚠️</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quadrant 4: 🧠 AI 최종 결론 및 베팅 제안 */}
            <div className="bg-[#0e1927] border border-[#1b3149] rounded-xl p-4 space-y-3">
              <div className="text-xs font-black text-slate-200 flex items-center gap-1.5 border-b border-[#1b3149] pb-2">
                <span>🧠</span>
                <span>AI 최종 결론 및 베팅 제안</span>
              </div>

              <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                <div>
                  <strong className="text-slate-100 flex items-center gap-1">
                    <span>🔍 AI 분석 요약:</span>
                  </strong>
                  <p className="mt-1 text-[11px] text-slate-300">
                    통합 앙상블 모델은 홈팀의 전술적 우위와 시장 배당의 비효율성을 포착, {stdHome}의 승리 확률을 54%로 산출, 시장 대비 <strong className="text-emerald-400">3%의 진성 엣지(+EV)</strong> 존재.
                  </p>
                </div>

                <div className="pt-2 border-t border-[#18293d]">
                  <strong className="text-amber-300 flex items-center gap-1">
                    <span>🏆 추천 베팅:</span>
                  </strong>
                  <p className="mt-1 text-xs font-bold text-white">
                    {stdHome} 승 (단통 축) | <span className="text-emerald-400 font-mono">ROI: +3.0%</span> <span className="text-slate-400 text-[11px] font-mono">(적정 배당 1.85, 시장 배당 1.90)</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
