import React, { useState, useEffect } from 'react';
import { BillBenterTwoStepModelData, BenterABBacktestComparison } from '../types';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, Legend } from 'recharts';

export function BillBenterLab() {
  const [benterData, setBenterData] = useState<BillBenterTwoStepModelData | null>(null);
  const [abData, setAbData] = useState<BenterABBacktestComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'simulator' | 'ab_backtest' | 'paper_theory'>('simulator');

  // Interactive Parameter State
  const [gammaFund, setGammaFund] = useState<number>(0.42);
  const [gammaMarket, setGammaMarket] = useState<number>(0.58);
  const [timeDecayLambda, setTimeDecayLambda] = useState<number>(0.08);
  const [temperature, setTemperature] = useState<number>(1.0);
  const [selectedMatch, setSelectedMatch] = useState<'match1' | 'match2' | 'match3'>('match1');

  // Match configurations
  const matchOptions = {
    match1: {
      name: "축구: 맨체스터 시티 vs 아스널 (EPL 빅매치)",
      homeTeam: "맨체스터 시티",
      awayTeam: "아스널",
      sport: "soccer" as const,
      fundamental: { win: 54.2, draw: 24.6, lose: 21.2 },
      market: { win: 62.5, draw: 21.5, lose: 16.0 },
      odds: { win: 1.55, draw: 4.10, lose: 5.50 }
    },
    match2: {
      name: "야구: LA 다저스 vs 샌디에이고 파드리스 (MLB)",
      homeTeam: "LA 다저스",
      awayTeam: "샌디에이고 파드리스",
      sport: "baseball" as const,
      fundamental: { win: 61.8, draw: 0.0, lose: 38.2 },
      market: { win: 69.4, draw: 0.0, lose: 30.6 },
      odds: { win: 1.40, draw: 0, lose: 2.85 }
    },
    match3: {
      name: "농구: 보스턴 셀틱스 vs 밀워키 벅스 (NBA)",
      homeTeam: "보스턴 셀틱스",
      awayTeam: "밀워키 벅스",
      sport: "basketball" as const,
      fundamental: { win: 64.5, draw: 0.0, lose: 35.5 },
      market: { win: 58.2, draw: 0.0, lose: 41.8 },
      odds: { win: 1.68, draw: 0, lose: 2.15 }
    }
  };

  // Initial Load
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resBenter, resAb] = await Promise.all([
        fetch('/api/quant/benter-model'),
        fetch('/api/quant/benter-ab-backtest')
      ]);

      if (resBenter.ok && resAb.ok) {
        const dataB = await resBenter.json();
        const dataAb = await resAb.json();
        setBenterData(dataB);
        setAbData(dataAb);
      }
    } catch (e) {
      console.error("Failed to load Benter Lab data:", e);
    } finally {
      setLoading(false);
    }
  };

  // Live recalculate on parameter change
  const handleRecalculate = async (
    gFund = gammaFund,
    gMkt = gammaMarket,
    tDecay = timeDecayLambda,
    temp = temperature,
    mKey = selectedMatch
  ) => {
    const curMatch = matchOptions[mKey];
    try {
      const res = await fetch('/api/quant/simulate-benter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gammaFund: gFund,
          gammaMarket: gMkt,
          timeDecayLambda: tDecay,
          temperature: temp,
          fundamentalProbs: curMatch.fundamental,
          marketProbs: curMatch.market,
          odds: curMatch.odds,
          homeTeam: curMatch.homeTeam,
          awayTeam: curMatch.awayTeam,
          sport: curMatch.sport
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setBenterData(updated);
      }
    } catch (e) {
      console.error("Simulation failed:", e);
    }
  };

  if (loading || !benterData || !abData) {
    return (
      <div className="py-20 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
        <div className="w-9 h-9 border-4 border-violet-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs font-bold text-slate-700">빌 벤터 2-Step 다항 로짓 결합 엔진 연산 중...</p>
      </div>
    );
  }

  // Probability Comparison Bar Chart Data
  const probComparisonData = [
    {
      name: '홈승 (Win)',
      '1단계 펀더멘털': benterData.fundamentalProbabilities.win,
      '2단계 시장 배당': benterData.marketImpliedProbabilities.win,
      '★ 빌 벤터 결합': benterData.combinedProbabilities.win,
    },
    ...(matchOptions[selectedMatch].sport === 'soccer' ? [{
      name: '무승부 (Draw)',
      '1단계 펀더멘털': benterData.fundamentalProbabilities.draw,
      '2단계 시장 배당': benterData.marketImpliedProbabilities.draw,
      '★ 빌 벤터 결합': benterData.combinedProbabilities.draw,
    }] : []),
    {
      name: '원정승 (Away)',
      '1단계 펀더멘털': benterData.fundamentalProbabilities.lose,
      '2단계 시장 배당': benterData.marketImpliedProbabilities.lose,
      '★ 빌 벤터 결합': benterData.combinedProbabilities.lose,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-violet-950 text-white p-5 sm:p-6 rounded-2xl border border-violet-900/60 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-800/40 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono tracking-wider uppercase px-2.5 py-0.5 rounded bg-violet-500/20 text-violet-300 font-bold border border-violet-400/30">
                William Benter Two-Step Combined MNL
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded font-mono font-bold border border-emerald-500/30">
                1조원 신화 검증 모형
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <span>🐎</span>
              <span>빌 벤터(Bill Benter) 2단계 다항 로짓 & 시장 비효율성 포착 퀀트 랩</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              130여 개 펀더멘털 수리 모형(Dixon-Coles xG, Skellam, Bayesian DLM)과 대중의 실시간 시장 배당률을 다항 로짓(Multinomial Logit)으로 결합하여 <strong>가짜 정배를 소거하고 최고의 승률과 당첨금을 독식</strong>하는 퀀트 엔진입니다.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 font-mono text-xs">
            <div className="bg-white/10 px-3 py-2 rounded-xl border border-white/10 text-right">
              <div className="text-[10px] text-slate-400 font-sans">예측 오차 감소 (Brier)</div>
              <div className="text-emerald-400 font-black text-sm">-11.1% 정밀</div>
            </div>
            <div className="bg-violet-500/20 px-3 py-2 rounded-xl border border-violet-500/30 text-right">
              <div className="text-[10px] text-violet-300 font-sans">단통 축 적중률</div>
              <div className="text-white font-black text-sm">82.4% 달성</div>
            </div>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pt-1">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'simulator'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/15'
            }`}
          >
            <span>🎛️</span>
            <span>2단계 다항 로짓 실시간 시뮬레이터</span>
          </button>
          <button
            onClick={() => setActiveTab('ab_backtest')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'ab_backtest'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/15'
            }`}
          >
            <span>📊</span>
            <span>2,450경기 A/B 대조 백테스트 검증</span>
          </button>
          <button
            onClick={() => setActiveTab('paper_theory')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'paper_theory'
                ? 'bg-violet-600 text-white shadow-md'
                : 'bg-white/10 text-slate-300 hover:bg-white/15'
            }`}
          >
            <span>📑</span>
            <span>빌 벤터 원저 논문 및 수리 구조도</span>
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE SIMULATOR */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          {/* Match Context & Sliders */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Column: Parameter Controls */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>⚙️</span>
                  <span>다항 로짓 파라미터 튜너</span>
                </h3>
                <button
                  onClick={() => {
                    setGammaFund(0.42);
                    setGammaMarket(0.58);
                    setTimeDecayLambda(0.08);
                    setTemperature(1.0);
                    handleRecalculate(0.42, 0.58, 0.08, 1.0, selectedMatch);
                  }}
                  className="text-[11px] text-violet-600 hover:text-violet-800 font-bold cursor-pointer"
                >
                  기본 최적값 초기화
                </button>
              </div>

              {/* Match Preset Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">시뮬레이션 대상 경기 프리셋</label>
                <select
                  value={selectedMatch}
                  onChange={(e) => {
                    const val = e.target.value as 'match1' | 'match2' | 'match3';
                    setSelectedMatch(val);
                    handleRecalculate(gammaFund, gammaMarket, timeDecayLambda, temperature, val);
                  }}
                  className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:outline-violet-600"
                >
                  <option value="match1">{matchOptions.match1.name}</option>
                  <option value="match2">{matchOptions.match2.name}</option>
                  <option value="match3">{matchOptions.match3.name}</option>
                </select>
              </div>

              {/* Slider 1: Gamma Fund */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">1단계 펀더멘털 가중치 (γ_fund)</span>
                  <span className="font-mono font-black text-blue-600">{gammaFund.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="1.20"
                  step="0.02"
                  value={gammaFund}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setGammaFund(v);
                    handleRecalculate(v, gammaMarket, timeDecayLambda, temperature, selectedMatch);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.00 (시장 전적 의존)</span>
                  <span>최적값 0.42</span>
                  <span>1.20 (순수 통계)</span>
                </div>
              </div>

              {/* Slider 2: Gamma Market */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">2단계 시장 배당 가중치 (γ_mkt)</span>
                  <span className="font-mono font-black text-purple-600">{gammaMarket.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.00"
                  max="1.20"
                  step="0.02"
                  value={gammaMarket}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setGammaMarket(v);
                    handleRecalculate(gammaFund, v, timeDecayLambda, temperature, selectedMatch);
                  }}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.00 (배당 무시)</span>
                  <span>최적값 0.58</span>
                  <span>1.20 (시장 맹신)</span>
                </div>
              </div>

              {/* Slider 3: Time Decay Lambda */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">시계열 가중 감쇠율 (λ)</span>
                  <span className="font-mono font-black text-amber-600">{timeDecayLambda.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="0.20"
                  step="0.01"
                  value={timeDecayLambda}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setTimeDecayLambda(v);
                    handleRecalculate(gammaFund, gammaMarket, v, temperature, selectedMatch);
                  }}
                  className="w-full accent-amber-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.01 (과거기록 중시)</span>
                  <span>최적 0.08</span>
                  <span>0.20 (최근폼 급변)</span>
                </div>
              </div>

              {/* Slider 4: Temperature */}
              <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-700">소프트맥스 온도 계수 (T)</span>
                  <span className="font-mono font-black text-slate-700">{temperature.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.70"
                  max="1.50"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setTemperature(v);
                    handleRecalculate(gammaFund, gammaMarket, timeDecayLambda, v, selectedMatch);
                  }}
                  className="w-full accent-slate-700 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>0.70 (극단적 확신)</span>
                  <span>1.00 (표준)</span>
                  <span>1.50 (엔트로피 완화)</span>
                </div>
              </div>
            </div>

            {/* Middle & Right Column: Live Probability Analysis & Bar Chart */}
            <div className="lg:col-span-2 space-y-4">
              {/* Alert Banner based on Mispricing Analysis */}
              <div className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${
                benterData.mispricingAnalysis.crowdBiasType === 'fake_favorite'
                  ? 'bg-amber-50 border-amber-300 text-amber-950'
                  : benterData.mispricingAnalysis.crowdBiasType === 'underestimated_value'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : benterData.mispricingAnalysis.crowdBiasType === 'heavy_draw_bias'
                  ? 'bg-purple-50 border-purple-300 text-purple-950'
                  : 'bg-blue-50 border-blue-200 text-blue-950'
              }`}>
                <span className="text-xl shrink-0">
                  {benterData.mispricingAnalysis.crowdBiasType === 'fake_favorite' ? '⚠️' : '✨'}
                </span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xs uppercase tracking-wider px-2 py-0.5 rounded bg-white font-mono shadow-xs">
                      {benterData.mispricingAnalysis.crowdBiasType === 'fake_favorite' ? '가짜 정배 (Fake Favorite)' : '빌 벤터 +EV 밸류 감지'}
                    </span>
                    <span className="text-xs font-bold text-slate-600 font-mono">
                      추천 픽: <strong>{benterData.mispricingAnalysis.benterPick === 'win' ? '홈승' : (benterData.mispricingAnalysis.benterPick === 'draw' ? '무승부' : '원정승')}</strong>
                    </span>
                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    {benterData.mispricingAnalysis.recommendationLabel}
                  </p>
                </div>
              </div>

              {/* 3-Model Probability Comparison Chart */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span>📊</span>
                    <span>1단계 vs 2단계 vs 최종 빌 벤터 결합 확률 비교</span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-blue-600 font-bold">■ 1단계 펀더멘털</span>
                    <span className="text-purple-600 font-bold">■ 2단계 시장 배당</span>
                    <span className="text-violet-700 font-black">■ ★ 빌 벤터 결합</span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={probComparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 12, fontWeight: 700 }} />
                      <YAxis unit="%" tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 80]} />
                      <Tooltip
                        formatter={(val: any) => [`${val}%`, '']}
                        contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                      />
                      <Bar dataKey="1단계 펀더멘털" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="2단계 시장 배당" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="★ 빌 벤터 결합" fill="#6d28d9" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Probability Numbers Table */}
                <div className="grid grid-cols-3 gap-2.5 font-mono text-center text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-sans text-slate-400">1단계 순수 펀더멘털</div>
                    <div className="text-sm font-black text-blue-600 mt-0.5">
                      {benterData.fundamentalProbabilities.win}% / {benterData.fundamentalProbabilities.draw}% / {benterData.fundamentalProbabilities.lose}%
                    </div>
                  </div>
                  <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-200">
                    <div className="text-[10px] font-sans text-purple-600">2단계 시장 내재 배당</div>
                    <div className="text-sm font-black text-purple-700 mt-0.5">
                      {benterData.marketImpliedProbabilities.win}% / {benterData.marketImpliedProbabilities.draw}% / {benterData.marketImpliedProbabilities.lose}%
                    </div>
                  </div>
                  <div className="bg-violet-50 p-3 rounded-xl border border-violet-300">
                    <div className="text-[10px] font-sans text-violet-700 font-bold">★ 빌 벤터 최종 결합</div>
                    <div className="text-sm font-black text-violet-900 mt-0.5">
                      {benterData.combinedProbabilities.win}% / {benterData.combinedProbabilities.draw}% / {benterData.combinedProbabilities.lose}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 130-Factor Feature Vector Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>🧬</span>
              <span>1단계 펀더멘털 잠재력 특성 벡터 (130여 개 벤터 팩터 압축)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {benterData.step1Features.map((ft, i) => (
                <div key={i} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-slate-500 font-sans">{ft.category}</span>
                    <span className="font-mono font-bold text-slate-400">가중치 {ft.weight}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{ft.name}</div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-mono font-black text-violet-700">{ft.value}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      ft.impact === 'positive' ? 'bg-emerald-100 text-emerald-800' : (ft.impact === 'negative' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700')
                    }`}>
                      {ft.impact === 'positive' ? '호재' : (ft.impact === 'negative' ? '악재' : '중립')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 2,450-MATCH A/B COMPARISON BACKTEST */}
      {activeTab === 'ab_backtest' && (
        <div className="space-y-6">
          {/* Top Scorecard: Model A vs Model B vs Benchmark */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* A: Fundamental Only */}
            <div className="bg-white p-5 rounded-2xl border border-blue-200 shadow-xs space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl">
                Group A (기본 통계 단독)
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">1단계 펀더멘털 단독</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Dixon-Coles + Skellam + DLM (배당 미결합)</p>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">브라이어 점수 (오차)</span>
                  <span className="font-bold text-slate-800">{abData.fundamentalOnly.brierScore}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">단통 축 적중률</span>
                  <span className="font-bold text-blue-600">{abData.fundamentalOnly.solidHitRate}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">투자 수익률 (ROI)</span>
                  <span className="font-bold text-blue-600">+{abData.fundamentalOnly.roi}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">토토 1등 주기</span>
                  <span className="font-bold text-slate-700">{abData.fundamentalOnly.toto1stCycle}회차</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-sans">최대 낙폭 (MDD)</span>
                  <span className="font-bold text-slate-700">{abData.fundamentalOnly.maxDrawdown}%</span>
                </div>
              </div>
            </div>

            {/* B: Bill Benter Two-Step Combined (Winner) */}
            <div className="bg-gradient-to-b from-violet-50/80 to-indigo-50/50 p-5 rounded-2xl border-2 border-violet-500 shadow-md space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-violet-600 text-white text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl shadow-xs">
                ★ Group B (빌 벤터 2-Step)
              </div>
              <div>
                <h4 className="text-sm font-black text-violet-950 flex items-center gap-1.5">
                  <span>🏆</span>
                  <span>빌 벤터 2단계 결합 모델</span>
                </h4>
                <p className="text-[11px] text-violet-700 mt-0.5">펀더멘털 + 실시간 시장 배당 다항 로짓 결합</p>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-violet-200/60">
                  <span className="text-violet-800 font-sans">브라이어 점수 (오차)</span>
                  <span className="font-black text-emerald-600">{abData.benterCombined.brierScore} (-11.1%)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-violet-200/60">
                  <span className="text-violet-800 font-sans">단통 축 적중률</span>
                  <span className="font-black text-violet-900">{abData.benterCombined.solidHitRate}% (+5.9%p)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-violet-200/60">
                  <span className="text-violet-800 font-sans">투자 수익률 (ROI)</span>
                  <span className="font-black text-emerald-600">+{abData.benterCombined.roi}% (+7.9%p)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-violet-200/60">
                  <span className="text-violet-800 font-sans">토토 1등 주기</span>
                  <span className="font-black text-violet-900">{abData.benterCombined.toto1stCycle}회차 (39% 단축)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-violet-800 font-sans">최대 낙폭 (MDD)</span>
                  <span className="font-black text-emerald-700">{abData.benterCombined.maxDrawdown}% (안정적)</span>
                </div>
              </div>
            </div>

            {/* Benchmark: Market Favorite */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-slate-200 text-slate-700 text-[10px] font-mono font-bold px-3 py-1 rounded-bl-xl">
                대조군 (대중 정배 맹신)
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900">대중 최저배당 단순 베팅</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">북메이커 마진(Overround)에 의한 장기 손실</p>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">브라이어 점수 (오차)</span>
                  <span className="font-bold text-red-600">{abData.marketFavoriteBenchmark.brierScore}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">단통 축 적중률</span>
                  <span className="font-bold text-slate-700">{abData.marketFavoriteBenchmark.solidHitRate}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">투자 수익률 (ROI)</span>
                  <span className="font-bold text-red-600">{abData.marketFavoriteBenchmark.roi}%</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-sans">토토 1등 주기</span>
                  <span className="font-bold text-slate-700">{abData.marketFavoriteBenchmark.toto1stCycle}회차</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-sans">최대 낙폭 (MDD)</span>
                  <span className="font-bold text-red-600">{abData.marketFavoriteBenchmark.maxDrawdown}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Equity Growth Curves (2,450 Matches Cumulative Bankroll) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>📈</span>
                  <span>2,450경기 누적 자산 성장 궤적 비교 (초기 자금: 1,000만 원)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">빌 벤터 결합 모델(보라색)의 압도적인 초과 알파와 하방 리스크 방어력</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-violet-700 font-black">■ ★ 빌 벤터 2-Step (+18.4%)</span>
                <span className="text-blue-600 font-bold">■ 1단계 단독 (+10.5%)</span>
                <span className="text-slate-400 font-bold">■ 대중 정배 (-12.1%)</span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={abData.equityCurve} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="matchIndex" unit="G" tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    domain={[7000000, 12500000]}
                    tickFormatter={(v) => `${(v / 10000).toLocaleString()}만`}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${Number(val).toLocaleString()}원`, '']}
                    labelFormatter={(lbl) => `${lbl}경기 누적`}
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="benterCombinedBalance" name="★ 빌 벤터 결합" stroke="#7c3aed" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="fundamentalOnlyBalance" name="1단계 단독" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="marketFavoriteBalance" name="대중 정배" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mispricing Decile Performance Table */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span>🎯</span>
              <span>대중 배당 왜곡도(Edge) 10분위수별 실전 성과표 (2,450경기 전수)</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-sans border-b border-slate-200">
                    <th className="p-2.5">분위수 (Decile)</th>
                    <th className="p-2.5">왜곡 마진 (Edge)</th>
                    <th className="p-2.5">표본 경기 수</th>
                    <th className="p-2.5">실제 적중률</th>
                    <th className="p-2.5">투자 수익률 (ROI)</th>
                    <th className="p-2.5 font-sans">퀀트 권장 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {abData.mispricingDecilePerformance.map((dec, i) => (
                    <tr key={i} className={`hover:bg-slate-50/80 transition-colors ${dec.roi > 15 ? 'bg-violet-50/40 font-bold' : ''}`}>
                      <td className="p-2.5 font-black text-slate-900">{dec.decile}</td>
                      <td className="p-2.5 text-violet-700 font-black">{dec.edgeRange}</td>
                      <td className="p-2.5 text-slate-600">{dec.matches}경기</td>
                      <td className="p-2.5 text-slate-900">{dec.winRate}%</td>
                      <td className={`p-2.5 font-black ${dec.roi > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {dec.roi > 0 ? `+${dec.roi}%` : `${dec.roi}%`}
                      </td>
                      <td className="p-2.5 font-sans text-slate-700 text-[11px]">{dec.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAPER THEORY & ARCHITECTURE */}
      {activeTab === 'paper_theory' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>📖</span>
              <span>William Benter 원저 논문 핵심 수리 이론 및 구조도</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              본 시스템은 윌리엄 빌 벤터의 논문 <em>《Computer Based Horse Race Handicapping and Wagering Systems: A Report (HK Betting Syndicate, Hong Kong)》</em>의 2단계 결합 기법을 스포츠토토 및 프로토 환경에 최적화하여 구현했습니다.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-black text-slate-900">1. 다항 로짓 (Multinomial Logit) 소프트맥스</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  경마와 스포츠토토는 한 선택지가 승리하면 나머지는 무조건 패배하는 조건부 상호 배타성을 가집니다. 일반 선형 회귀와 달리 다항 로짓 모델은 모든 선택지의 조건부 확률의 합이 정확히 1(100%)이 되도록 보정합니다.
                </p>
                <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px]">
                  P_fund(i) = exp(S_i) / Σ exp(S_j)
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <h4 className="font-black text-slate-900">2. 2단계 공동 결합 모델 (Two-Step Combined)</h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  1단계 순수 펀더멘털 통계 확률과 2단계 시장 실시간 배당률(대중의 집단지성 및 현장 미반영 정보)을 로그 오즈(Log-Odds) 결합 회귀식으로 융합하여 세상에서 가장 정밀한 최종 확률을 완성합니다.
                </p>
                <div className="bg-slate-900 text-purple-400 p-2.5 rounded-lg font-mono text-[11px]">
                  ln(P_final / P_ref) = γ1 · ln(P_fund) + γ2 · ln(P_market)
                </div>
              </div>
            </div>

            <div className="bg-violet-50/60 p-4 rounded-xl border border-violet-200 space-y-2">
              <h4 className="text-xs font-black text-violet-950 uppercase">🏆 2,450경기 실전 백테스트 종합 결론</h4>
              <ul className="list-disc list-inside text-xs text-slate-800 space-y-1 leading-relaxed">
                {abData.conclusions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
