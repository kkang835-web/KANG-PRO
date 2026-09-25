import React, { useState } from 'react';

interface CalculatorsModalProps {
  calcType: string;
  onClose: () => void;
}

export function CalculatorsModal({ calcType, onClose }: CalculatorsModalProps) {
  // Tab within modal if needed
  const [activeTab, setActiveTab] = useState<string>(
    calcType === 'baseball_skellam' ? 'baseball' :
    calcType === 'basketball_gaussian' ? 'basketball' :
    calcType === 'overseas_odds' ? 'overseas' :
    calcType === 'toto_sc' || calcType === 'portfolio' ? 'portfolio' : 'shin'
  );

  // 1. Shin's Model State
  const [oddsInput, setOddsInput] = useState<string>("1.82, 3.40, 3.85");
  const [shinResult, setShinResult] = useState<any>(null);

  // 2. Soccer Toto Portfolio State
  const [singlePicks, setSinglePicks] = useState<number>(10);
  const [doublePicks, setDoublePicks] = useState<number>(4);
  const [triplePicks, setTriplePicks] = useState<number>(0);
  const [targetPrizeFund, setTargetPrizeFund] = useState<number>(1500000000); // 15억

  // 3. Baseball Skellam State
  const [homeRunsExpected, setHomeRunsExpected] = useState<number>(4.8);
  const [awayRunsExpected, setAwayRunsExpected] = useState<number>(4.1);

  // 4. Basketball Gaussian State
  const [homePointsExpected, setHomePointsExpected] = useState<number>(84.5);
  const [awayPointsExpected, setAwayPointsExpected] = useState<number>(80.2);
  const [pointsStdDev, setPointsStdDev] = useState<number>(11.5);

  // 5. Overseas Odds State (RapidAPI)
  const [overseasData, setOverseasData] = useState<any>(null);
  const [isLoadingOverseas, setIsLoadingOverseas] = useState<boolean>(false);
  const [overseasSport, setOverseasSport] = useState<string>("soccer");

  const fetchOverseasOdds = async () => {
    setIsLoadingOverseas(true);
    try {
      const res = await fetch(`/api/odds/overseas?sport=${overseasSport}&bookmakers=pinnacle,stake,draftkings`);
      const data = await res.json();
      setOverseasData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingOverseas(false);
    }
  };

  // --- Calculations ---
  const calculateShin = () => {
    const oddsArr = oddsInput.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0);
    if (oddsArr.length < 2) {
      alert("올바른 배당률을 콤마로 구분하여 2개 이상 입력하세요 (예: 1.82, 3.40, 3.85)");
      return;
    }

    const n = oddsArr.length;
    const invArr = oddsArr.map(o => 1 / o);
    const beta = invArr.reduce((acc, v) => acc + v, 0);
    const overround = ((beta - 1) * 100).toFixed(2);

    const normPi = invArr.map(p => p / beta);
    const variances = normPi.map(p => p * (1 - p));
    const avgVariance = variances.reduce((a, b) => a + b, 0) / n;
    const overroundNum = Math.max(0, beta - 1);
    const damp = 0.5 * (overroundNum / (1 + overroundNum));
    const heteroskedasticWeights = normPi.map((p, i) => {
      const varDiff = variances[i] - avgVariance;
      return Math.max(0.65, Math.min(1.35, 1 - damp * (varDiff / (avgVariance || 1))));
    });

    function computeShinProbs(zVal: number): number[] {
      if (zVal < 1e-6) return normPi;
      const denom = 2 * (1 - zVal);
      return invArr.map((p, i) => {
        const term = (p * p) / beta * heteroskedasticWeights[i];
        const disc = Math.max(1e-8, zVal * zVal + 4 * (1 - zVal) * term);
        return (Math.sqrt(disc) - zVal) / denom;
      });
    }

    let low = 0.0;
    let high = 0.45;
    let z = 0.02;
    for (let iter = 0; iter < 40; iter++) {
      const mid = (low + high) / 2;
      const probs = computeShinProbs(mid);
      const sum = probs.reduce((a, b) => a + b, 0);
      if (Math.abs(sum - 1.0) < 1e-7) {
        z = mid;
        break;
      }
      if (sum > 1.0) low = mid;
      else high = mid;
      z = mid;
    }

    const rawProbs = computeShinProbs(z);
    const totalShin = rawProbs.reduce((acc, p) => acc + p, 0);
    const normalizedProbs = rawProbs.map(p => ((p / totalShin) * 100).toFixed(2) + '%');
    const fairOdds = rawProbs.map(p => (totalShin / (p || 0.001)).toFixed(2));

    setShinResult({
      overround: `${overround}%`,
      zValue: z.toFixed(4),
      fairProbs: normalizedProbs,
      fairOdds
    });
  };

  // Helper: Poisson PMF
  const poissonPmf = (k: number, lambda: number): number => {
    if (k < 0 || lambda <= 0) return 0;
    let p = Math.exp(-lambda);
    for (let i = 1; i <= k; i++) {
      p = (p * lambda) / i;
    }
    return p;
  };

  // Baseball Skellam Calculation
  const calculateBaseballSkellam = () => {
    let pHomeWinBy2Plus = 0;
    let pDiff1 = 0;
    let pAwayWinBy2Plus = 0;

    for (let h = 0; h <= 20; h++) {
      for (let a = 0; a <= 20; a++) {
        const p = poissonPmf(h, homeRunsExpected) * poissonPmf(a, awayRunsExpected);
        const diff = h - a;
        if (diff >= 2) {
          pHomeWinBy2Plus += p;
        } else if (diff === 1 || diff === -1 || diff === 0) {
          pDiff1 += p; // 승1패에서 '1'은 1점차 승부(동점 포함)
        } else if (diff <= -2) {
          pAwayWinBy2Plus += p;
        }
      }
    }
    const sum = pHomeWinBy2Plus + pDiff1 + pAwayWinBy2Plus || 1;
    return {
      homeWin: ((pHomeWinBy2Plus / sum) * 100).toFixed(1),
      diff1: ((pDiff1 / sum) * 100).toFixed(1),
      awayWin: ((pAwayWinBy2Plus / sum) * 100).toFixed(1)
    };
  };

  // Basketball Gaussian Calculation
  const calculateBasketballGaussian = () => {
    const meanDiff = homePointsExpected - awayPointsExpected;
    const std = pointsStdDev || 11.5;

    // Standard Normal CDF approximation
    const cdf = (x: number): number => {
      const t = 1 / (1 + 0.2316419 * Math.abs(x));
      const d = 0.3989423 * Math.exp(-x * x / 2);
      let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
      if (x > 0) prob = 1 - prob;
      return prob;
    };

    // 승5패 기준: 홈 6점차 이상 승(승), 5점차 이내(5), 원정 6점차 이상 승(패)
    const zHome6 = (5.5 - meanDiff) / std; // diff >= 6
    const zAway6 = (-5.5 - meanDiff) / std; // diff <= -6

    const pHomeWin6Plus = 1 - cdf(zHome6);
    const pAwayWin6Plus = cdf(zAway6);
    const pDiff5 = Math.max(0, 1 - (pHomeWin6Plus + pAwayWin6Plus));

    return {
      homeWin6: (pHomeWin6Plus * 100).toFixed(1),
      diff5: (pDiff5 * 100).toFixed(1),
      awayWin6: (pAwayWin6Plus * 100).toFixed(1),
      meanDiff: meanDiff.toFixed(1)
    };
  };

  // Toto Portfolio calculation
  const totalCombinations = Math.pow(1, singlePicks) * Math.pow(2, doublePicks) * Math.pow(3, triplePicks);
  const costWon = totalCombinations * 1000;
  const bbResult = calculateBaseballSkellam();
  const bkResult = calculateBasketballGaussian();

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧮</span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">수리 퀀트 & 배당률 계산기</h3>
              <p className="text-xs text-slate-400">신스 No-Vig 모형, 승무패 포트폴리오, 스켈람, 가우시안 수리엔진</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-gray-200 bg-slate-50 px-3 pt-2 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('shin')}
            className={`px-3 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shin' ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🧮 신스(Shin's) 배당률
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`px-3 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'portfolio' ? 'bg-white text-blue-600 border-t-2 border-t-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚽ 축구 승무패 포트폴리오
          </button>
          <button
            onClick={() => setActiveTab('baseball')}
            className={`px-3 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'baseball' ? 'bg-white text-emerald-600 border-t-2 border-t-emerald-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚾ 야구 승1패 스켈람
          </button>
          <button
            onClick={() => setActiveTab('basketball')}
            className={`px-3 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'basketball' ? 'bg-white text-amber-600 border-t-2 border-t-amber-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏀 농구 승5패 가우시안
          </button>
          <button
            onClick={() => {
              setActiveTab('overseas');
              if (!overseasData) fetchOverseasOdds();
            }}
            className={`px-3 py-2 text-xs font-black rounded-t-xl transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'overseas' ? 'bg-white text-indigo-600 border-t-2 border-t-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌍 해외배당 연동 (RapidAPI)
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 grow">
          {/* TAB 1: Shin's Model */}
          {activeTab === 'shin' && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 text-xs text-blue-950 space-y-1">
                <span className="font-bold block text-blue-900">📌 신스(Shin's 1993) No-Vig 모델이란?</span>
                <p className="leading-relaxed text-blue-800">
                  북메이커의 마진(Overround)과 내부자 거래 비율(z)을 역산하여 시장 왜곡이 완전히 제거된 <strong>순수 공정 확률(True Probabilities)</strong>과 <strong>공정 배당(Fair Odds)</strong>을 계산합니다.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">
                  실제 시장 배당률 입력 (승, 무, 패 또는 홈/원정 배당 콤마 구분)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={oddsInput}
                    onChange={e => setOddsInput(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    placeholder="1.82, 3.40, 3.85"
                  />
                  <button
                    onClick={calculateShin}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    공정확률 계산
                  </button>
                </div>
              </div>

              {shinResult && (
                <div className="bg-slate-950 text-white p-4 rounded-xl border border-slate-800 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">북메이커 마진(Overround)</span>
                    <strong className="text-rose-400 font-mono text-sm">{shinResult.overround}</strong>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs text-slate-400">추정 내부자 거래 파라미터 (z)</span>
                    <strong className="text-amber-400 font-mono text-sm">{shinResult.zValue}</strong>
                  </div>
                  <div className="space-y-1.5 pt-1">
                    <span className="text-xs text-slate-300 font-bold block">신스 모형 산출 공정 승률 & 공정 배당:</span>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                      {shinResult.fairProbs.map((prob: string, idx: number) => (
                        <div key={idx} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                          <span className="text-[10px] text-slate-400 block">선택지 #{idx + 1}</span>
                          <strong className="text-emerald-400 text-sm block">{prob}</strong>
                          <span className="text-[10px] text-slate-400 mt-0.5 block">공정 {shinResult.fairOdds[idx]}배</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Toto Portfolio */}
          {activeTab === 'portfolio' && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 text-xs text-blue-950 space-y-1">
                <span className="font-bold block text-blue-900">⚽ 축구 승무패 14경기 포트폴리오 조합 계산기</span>
                <p className="leading-relaxed text-blue-800">
                  단통(1픽), 복식(2픽), 삼식(3픽)의 경기 수 조합을 입력하여 총 투입 조합수 및 베팅 금액을 계산합니다.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">단식 경기수 (1픽)</label>
                  <input
                    type="number"
                    min={0}
                    max={14}
                    value={singlePicks}
                    onChange={e => setSinglePicks(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-bold text-center"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">복식 경기수 (2픽)</label>
                  <input
                    type="number"
                    min={0}
                    max={14}
                    value={doublePicks}
                    onChange={e => setDoublePicks(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-bold text-center"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">삼식 경기수 (3픽)</label>
                  <input
                    type="number"
                    min={0}
                    max={14}
                    value={triplePicks}
                    onChange={e => setTriplePicks(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-bold text-center"
                  />
                </div>
              </div>

              <div className="bg-slate-950 text-white p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">총 14경기 구성 확인</span>
                  <span className={`font-bold ${singlePicks + doublePicks + triplePicks === 14 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {singlePicks + doublePicks + triplePicks} / 14경기 {singlePicks + doublePicks + triplePicks === 14 ? '(적합)' : '(14경기로 맞춰주세요)'}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">총 조합 수 (Combinations)</span>
                  <strong className="text-amber-400 font-mono text-sm">{totalCombinations.toLocaleString()} 조합</strong>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-800 pt-2">
                  <span className="text-slate-400">총 구매 금액 (1천원 기준)</span>
                  <strong className="text-emerald-400 font-mono text-base">{costWon.toLocaleString()} 원</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Baseball Skellam */}
          {activeTab === 'baseball' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/60 p-4 rounded-xl border border-emerald-100 text-xs text-emerald-950 space-y-1">
                <span className="font-bold block text-emerald-900">⚾ 야구 승1패 스켈람(Skellam) 분포 분석기</span>
                <p className="leading-relaxed text-emerald-800">
                  홈/원정 예상 득점(xR)을 푸아송-스켈람 득점차 분포로 모델링하여 <strong>2점차 이상 승(승/패)</strong>과 <strong>1점차 이내 접전(1)</strong>의 발생 확률을 계산합니다.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">홈팀 예상 득점 (λH)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={homeRunsExpected}
                    onChange={e => setHomeRunsExpected(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-bold text-center"
                  />
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">원정팀 예상 득점 (μA)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={awayRunsExpected}
                    onChange={e => setAwayRunsExpected(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                  <span className="text-[10px] text-indigo-700 font-bold block">[승] 홈 2점차+ 승</span>
                  <strong className="text-indigo-950 text-base font-black font-mono">{bbResult.homeWin}%</strong>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-700 font-bold block">[1] 1점차 접전/무</span>
                  <strong className="text-amber-950 text-base font-black font-mono">{bbResult.diff1}%</strong>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-700 font-bold block">[패] 원정 2점차+ 승</span>
                  <strong className="text-rose-950 text-base font-black font-mono">{bbResult.awayWin}%</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Basketball Gaussian */}
          {activeTab === 'basketball' && (
            <div className="space-y-4">
              <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-100 text-xs text-amber-950 space-y-1">
                <span className="font-bold block text-amber-900">🏀 농구 승5패 가우시안(정규분포) 점수차 분석기</span>
                <p className="leading-relaxed text-amber-800">
                  농구 경기 점수차는 정규분포(Gaussian)를 따르며, <strong>홈 6점차+ 승(승)</strong>, <strong>5점차 이내 접전(5)</strong>, <strong>원정 6점차+ 승(패)</strong> 확률을 산출합니다.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">홈 예상 득점</label>
                  <input
                    type="number"
                    step="0.5"
                    value={homePointsExpected}
                    onChange={e => setHomePointsExpected(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-bold text-center"
                  />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">원정 예상 득점</label>
                  <input
                    type="number"
                    step="0.5"
                    value={awayPointsExpected}
                    onChange={e => setAwayPointsExpected(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-bold text-center"
                  />
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">점수차 표준편차(σ)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={pointsStdDev}
                    onChange={e => setPointsStdDev(Number(e.target.value))}
                    className="w-full bg-white border border-gray-300 rounded-lg p-2 text-sm font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-200">
                  <span className="text-[10px] text-indigo-700 font-bold block">[승] 홈 6점차+ 승</span>
                  <strong className="text-indigo-950 text-base font-black font-mono">{bkResult.homeWin6}%</strong>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-700 font-bold block">[5] 5점차 이내 접전</span>
                  <strong className="text-amber-950 text-base font-black font-mono">{bkResult.diff5}%</strong>
                </div>
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200">
                  <span className="text-[10px] text-rose-700 font-bold block">[패] 원정 6점차+ 승</span>
                  <strong className="text-rose-950 text-base font-black font-mono">{bkResult.awayWin6}%</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Overseas Odds (RapidAPI) */}
          {activeTab === 'overseas' && (
            <div className="space-y-4">
              <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
                <span className="font-bold block text-indigo-900">🌍 해외배당 실시간 API 연동 (RapidAPI Odds API)</span>
                <p className="leading-relaxed text-indigo-800">
                  Pinnacle, Stake, DraftKings 등 글로벌 북메이커의 실시간 해외 배당률과 마진(Overround)을 RapidAPI 엔드포인트로 호출하여 비교 분석합니다.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">종목 선택:</span>
                  <select
                    value={overseasSport}
                    onChange={e => setOverseasSport(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                  >
                    <option value="soccer">축구 (Soccer)</option>
                    <option value="basketball">농구 (Basketball)</option>
                    <option value="americanfootball">미국 미식축구</option>
                  </select>
                </div>
                <button
                  onClick={fetchOverseasOdds}
                  disabled={isLoadingOverseas}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoadingOverseas ? '호출 중...' : '🌍 해외배당 불러오기'}
                </button>
              </div>

              {isLoadingOverseas && (
                <div className="text-center py-8 text-xs text-slate-500 font-medium">
                  RapidAPI 서버에서 해외 배당률 데이터를 호출하고 있습니다...
                </div>
              )}

              {overseasData && !isLoadingOverseas && (
                <div className="space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>데이터 소스: <strong className="text-indigo-600">{overseasData.source || 'API 연동'}</strong></span>
                    <span>북메이커: Pinnacle, Stake, DraftKings</span>
                  </div>

                  <div className="space-y-2.5">
                    {(overseasData.odds || []).map((item: any, idx: number) => (
                      <div key={idx} className="bg-slate-950 text-white p-4 rounded-xl border border-slate-800 space-y-2.5">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-slate-300">
                            {item.homeTeam} vs {item.awayTeam}
                          </span>
                          <span className="text-[10px] bg-indigo-900/80 text-indigo-300 px-2 py-0.5 rounded font-mono">
                            Fixture #{item.fixtureId}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          {/* Pinnacle */}
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                            <span className="text-[10px] text-amber-400 font-bold block">Pinnacle (마진 {item.pinnacle?.margin})</span>
                            <div className="grid grid-cols-3 gap-1 font-mono text-[11px]">
                              <div><span className="text-[9px] text-slate-400 block">승</span>{item.pinnacle?.home}</div>
                              <div><span className="text-[9px] text-slate-400 block">무</span>{item.pinnacle?.draw}</div>
                              <div><span className="text-[9px] text-slate-400 block">패</span>{item.pinnacle?.away}</div>
                            </div>
                          </div>

                          {/* Stake */}
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                            <span className="text-[10px] text-emerald-400 font-bold block">Stake (마진 {item.stake?.margin})</span>
                            <div className="grid grid-cols-3 gap-1 font-mono text-[11px]">
                              <div><span className="text-[9px] text-slate-400 block">승</span>{item.stake?.home}</div>
                              <div><span className="text-[9px] text-slate-400 block">무</span>{item.stake?.draw}</div>
                              <div><span className="text-[9px] text-slate-400 block">패</span>{item.stake?.away}</div>
                            </div>
                          </div>

                          {/* DraftKings */}
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                            <span className="text-[10px] text-blue-400 font-bold block">DraftKings (마진 {item.draftkings?.margin})</span>
                            <div className="grid grid-cols-3 gap-1 font-mono text-[11px]">
                              <div><span className="text-[9px] text-slate-400 block">승</span>{item.draftkings?.home}</div>
                              <div><span className="text-[9px] text-slate-400 block">무</span>{item.draftkings?.draw}</div>
                              <div><span className="text-[9px] text-slate-400 block">패</span>{item.draftkings?.away}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">SportsQuant Mathematical Core Engine</span>
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
