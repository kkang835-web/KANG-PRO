import React, { useState, useEffect } from 'react';
import { TotoType, TotoPortfolioResult } from '../types';
import { Calculator, Trophy, Sparkles, CheckCircle2 } from 'lucide-react';

interface PortfolioOptimizerProps {
  selectedTotoType?: TotoType;
}

export function PortfolioOptimizer({ selectedTotoType = 'sc' }: PortfolioOptimizerProps) {
  const [totoType, setTotoType] = useState<TotoType>(selectedTotoType);
  const [year, setYear] = useState<number>(2026);
  const [round, setRound] = useState<number>(1);
  const [budget, setBudget] = useState<number>(64000); // Default 64,000 KRW
  const [loading, setLoading] = useState<boolean>(false);
  const [portfolioData, setPortfolioData] = useState<TotoPortfolioResult | null>(null);

  useEffect(() => {
    generatePortfolio(totoType, year, round, budget);
  }, [totoType, year, round, budget]);

  const generatePortfolio = async (
    type: TotoType,
    y: number,
    r: number,
    b: number
  ) => {
    try {
      setLoading(true);
      const res = await fetch('/api/toto/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totoType: type, year: y, round: r, budget: b })
      });
      if (res.ok) {
        const data: TotoPortfolioResult = await res.json();
        setPortfolioData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const budgetOptions = [
    { label: '1,000원', value: 1000, isGolden: false },
    { label: '2,000원', value: 2000, isGolden: false },
    { label: '4,000원', value: 4000, isGolden: false },
    { label: '8,000원', value: 8000, isGolden: false },
    { label: '⭐ 10,000원 골든', value: 10000, isGolden: true },
    { label: '16,000원', value: 16000, isGolden: false },
    { label: '👑 20,000원 골든', value: 20000, isGolden: true },
    { label: '30,000원', value: 30000, isGolden: false },
    { label: '32,000원', value: 32000, isGolden: false },
    { label: '40,000원', value: 40000, isGolden: false },
    { label: '50,000원', value: 50000, isGolden: false },
    { label: '64,000원', value: 64000, isGolden: false },
    { label: '96,000원', value: 96000, isGolden: false }
  ];

  return (
    <div id="portfolio-optimizer-container" className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-6">
      {/* Header & Category Selection */}
      <div id="portfolio-header" className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-black text-slate-900">
              14경기 포트폴리오 조합기 및 다변량 공간 최적화
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            $3^{"{14}"} = 4,782,969$개 조합 공간에서 5장의 직교 조합 티켓이 1등~4등 당첨 범위를 상호 포위하도록 설계합니다. (비대칭 해밍 거리 $d_H \ge 6$ 분산 & 안티클로닝)
          </p>
        </div>

        {/* Toto Category Selector */}
        <div id="toto-category-selector" className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-gray-200">
          {(['sc', 'bs', 'bk'] as TotoType[]).map((t) => (
            <button
              id={`selector-btn-${t}`}
              key={t}
              onClick={() => setTotoType(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                totoType === t
                  ? 'bg-slate-900 text-amber-400 shadow-xs font-black'
                  : 'text-gray-600 hover:text-slate-900'
              }`}
            >
              {t === 'sc' ? '⚽ 축구승무패' : t === 'bs' ? '⚾ 야구승1패' : '🏀 농구승5패'}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Budget Filter Bar */}
      <div id="budget-filter-bar" className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-indigo-600" />
            <span>조합 옵션 필터 (1,000원 ~ 96,000원)</span>
          </span>
          <span className="text-xs font-mono font-bold bg-indigo-600 text-white px-2.5 py-0.5 rounded-md">
            {budget.toLocaleString()}원 구매 조합
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-13 gap-2">
          {budgetOptions.map((preset) => (
            <button
              id={`preset-btn-${preset.value}`}
              key={preset.value}
              onClick={() => setBudget(preset.value)}
              className={`px-1 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer border text-center ${
                budget === preset.value
                  ? preset.isGolden
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black ring-2 ring-amber-300'
                    : 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : preset.isGolden
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 font-extrabold'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expected Winners & Jackpot Dashboard */}
      {portfolioData && (
        <div id="jackpot-dashboard" className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">1등 예상 당첨자 수</div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              {portfolioData.expectedWinners.rank1}명
            </div>
            <div className="text-[10px] text-emerald-300">
              1인당 예상: {(portfolioData.payoutPerWinner.rank1 / 100000000).toFixed(2)}억원
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">2등 예상 당첨자 수</div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {portfolioData.expectedWinners.rank2}명
            </div>
            <div className="text-[10px] text-amber-300">
              1인당 예상: {(portfolioData.payoutPerWinner.rank2 / 10000).toLocaleString()}만원
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">3등 / 4등 예상 당첨자 수</div>
            <div className="text-xl font-black text-cyan-400 font-mono">
              {portfolioData.expectedWinners.rank3}명 / {portfolioData.expectedWinners.rank4}명
            </div>
            <div className="text-[10px] text-cyan-300">
              3등: {(portfolioData.payoutPerWinner.rank3 / 10000).toLocaleString()}만원
            </div>
          </div>

          <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">안티클로닝 독점 점수</div>
            <div className="text-xl font-black text-indigo-300 font-mono">
              {portfolioData.antiCloningScore}%
            </div>
            <div className="text-[10px] text-indigo-200">
              대중 적중 비대칭 분산 적용
            </div>
          </div>
        </div>
      )}

      {/* 5 Orthogonal Tickets Section */}
      {portfolioData && (
        <div id="tickets-section" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>5장의 분산 추천 조합 티켓 (세로형 복식마킹 슬립 디자인)</span>
            </h3>

            {/* Reset, Auto, and Semi-Auto Action Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => {
                  setBudget(64000);
                  generatePortfolio(totoType, year, round, 64000);
                }}
                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold border border-gray-300 transition-colors cursor-pointer flex items-center gap-1"
                title="초기값으로 리셋"
              >
                <span>🔄 초기화</span>
              </button>
              <button
                onClick={() => generatePortfolio(totoType, year, round, budget)}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                title="AI 자동 조합 생성"
              >
                <span>⚡ 자동 조합</span>
              </button>
              <button
                onClick={() => {
                  const randomSeedBudget = budget + Math.floor(Math.random() * 5) * 1000;
                  generatePortfolio(totoType, year, round, randomSeedBudget);
                }}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                title="반자동 변형 조합 생성"
              >
                <span>🎲 반자동 조합</span>
              </button>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md border border-emerald-300">
                ✓ {portfolioData.guaranteedCoverageRange}
              </span>
            </div>
          </div>

          {/* Vertical TOTO Slip Layout: Side-by-Side on wide screens */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {portfolioData.orthogonalTickets.map((ticket) => {
              const getMarkLabel = (sel: 'win' | 'draw' | 'lose') => {
                if (sel === 'win') return '승';
                if (sel === 'lose') return '패';
                if (totoType === 'sc') return '무';
                if (totoType === 'bs') return '1';
                return '5';
              };

              const isSelected = (idx: number, selType: 'win' | 'draw' | 'lose') => {
                return ticket.selections[idx]?.includes(selType);
              };

              return (
                <div 
                  id={`ticket-card-${ticket.ticketId}`}
                  key={ticket.ticketId} 
                  className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition-all hover:border-indigo-400 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]"
                >
                  {/* Slip Header */}
                  <div className="border-b-2 border-dashed border-slate-300 pb-3 mb-3 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-amber-400 text-xs font-black">
                        {ticket.ticketId}
                      </span>
                      <h4 className="text-xs font-black text-slate-900 tracking-tight">
                        {ticket.ticketName}
                      </h4>
                    </div>
                    <div className="text-[10px] text-amber-600 font-bold">
                      {ticket.rating}
                    </div>
                    <div className="text-[9px] text-slate-500 bg-white border border-slate-200 rounded px-1.5 py-0.5 inline-block font-mono">
                      EV {ticket.expectedEv} | 커버 {ticket.coverageScore}
                    </div>
                  </div>

                  {/* 14 Matches - Vertical Marker Slip */}
                  <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs flex-1">
                    <div className="grid grid-cols-12 gap-1 text-[10px] font-black text-slate-400 border-b border-slate-100 pb-1 mb-1.5 text-center">
                      <span className="col-span-5 text-left pl-1">경기 정보</span>
                      <span className="col-span-7 grid grid-cols-3 gap-0.5">
                        <span>승</span>
                        <span>{totoType === 'sc' ? '무' : (totoType === 'bs' ? '1' : '5')}</span>
                        <span>패</span>
                      </span>
                    </div>

                    {Array.from({ length: 14 }).map((_, idx) => {
                      const match = portfolioData.matches && portfolioData.matches[idx];
                      const homeText = match ? match.homeTeam : `홈팀 ${idx + 1}`;
                      const awayText = match ? match.awayTeam : `원정팀 ${idx + 1}`;

                      return (
                        <div key={idx} className="grid grid-cols-12 gap-1 items-center border-b border-slate-50 py-1 last:border-b-0">
                          {/* Match Index and Label */}
                          <div className="col-span-5 flex flex-col text-left pl-1">
                            <span className="text-[10px] font-mono font-black text-indigo-600">
                              {(idx + 1).toString().padStart(2, '0')}
                            </span>
                            <span className="text-[9px] text-slate-700 font-bold truncate max-w-[80px]" title={`${homeText} vs ${awayText}`}>
                              {homeText} vs {awayText}
                            </span>
                          </div>

                          {/* 3 Marking Option Boxes (승 / 무/1/5 / 패) */}
                          <div className="col-span-7 grid grid-cols-3 gap-1">
                            {(['win', 'draw', 'lose'] as const).map((opt) => {
                              const checked = isSelected(idx, opt);
                              return (
                                <div 
                                  key={opt}
                                  className={`h-7 rounded-md border flex items-center justify-center text-[10px] font-black tracking-tight transition-all ${
                                    checked 
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-extrabold relative overflow-hidden before:content-[""] before:absolute before:top-0 before:left-0 before:w-full before:h-full before:bg-[linear-gradient(45deg,transparent_45%,#fff_45%,#fff_55%,transparent_55%)]' 
                                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                  }`}
                                >
                                  {getMarkLabel(opt)}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Slip Footer with Price & Payoffs */}
                  <div className="border-t-2 border-dashed border-slate-300 pt-3 mt-3 space-y-2">
                    <div className="bg-white p-2 rounded-lg border border-slate-200 text-center space-y-0.5 shadow-3xs">
                      <div className="text-[8px] text-slate-400 font-bold uppercase">조합 가치 & 예측 수치</div>
                      <div className="flex justify-between text-[9px] text-slate-600 px-1">
                        <span>예상 적중금</span>
                        <span className="font-bold text-emerald-600">{ticket.expectedPayout}</span>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-600 px-1 border-t border-slate-50 pt-0.5">
                        <span>예상 승수</span>
                        <span className="font-mono text-slate-800 font-semibold">{ticket.expectedWinners}</span>
                      </div>
                    </div>
                    <div className="text-[8px] text-slate-400 font-medium text-center">
                      타 4장 해밍거리: <span className="font-mono font-bold text-indigo-600">[{ticket.hammingDistanceToOthers?.join(', ')}]</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
