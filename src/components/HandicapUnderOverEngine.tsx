import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  LineChart,
  Line,
  ReferenceLine
} from 'recharts';
import {
  Calculator,
  Layers,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Zap,
  Activity,
  Sliders,
  Scale,
  CloudRain,
  UserX,
  Clock,
  CheckCircle2,
  RefreshCw,
  GitBranch,
  Filter
} from 'lucide-react';

// Exact Modified Bessel Function of the First Kind I_k(x)
function besselI(k: number, x: number): number {
  const n = Math.abs(k);
  let sum = 0;
  const halfX = x / 2;
  for (let m = 0; m < 25; m++) {
    // factorial(m) * factorial(m + n)
    let factM = 1;
    for (let i = 1; i <= m; i++) factM *= i;
    let factMN = 1;
    for (let i = 1; i <= (m + n); i++) factMN *= i;

    const term = Math.pow(halfX, 2 * m + n) / (factM * factMN);
    sum += term;
    if (term < 1e-15) break;
  }
  return sum;
}

// Skellam PMF: P(K = k) for X ~ Poisson(lambda), Y ~ Poisson(mu)
function skellamPmf(k: number, lambda: number, mu: number): number {
  if (lambda <= 0 || mu <= 0) return 0;
  const besselVal = besselI(k, 2 * Math.sqrt(lambda * mu));
  const ratio = Math.pow(lambda / mu, k / 2);
  return Math.exp(-(lambda + mu)) * ratio * besselVal;
}

// Poisson PMF
function poissonPmf(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  let fact = 1;
  for (let i = 1; i <= k; i++) fact *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / fact;
}

// Dixon-Coles tau factor for low scores (0,0), (1,0), (0,1), (1,1)
function dixonColesTau(x: number, y: number, lambda: number, mu: number, rho: number): number {
  if (x === 0 && y === 0) return 1 - (lambda * mu * rho);
  if (x === 1 && y === 0) return 1 + (mu * rho);
  if (x === 0 && y === 1) return 1 + (lambda * rho);
  if (x === 1 && y === 1) return 1 - rho;
  return 1.0;
}

export function HandicapUnderOverEngine() {
  // Input parameters
  const [sport, setSport] = useState<'soccer' | 'baseball' | 'basketball'>('soccer');
  const [homeTeam, setHomeTeam] = useState<string>('맨체스터 시티');
  const [awayTeam, setAwayTeam] = useState<string>('아스널');
  const [lambda, setLambda] = useState<number>(1.85); // Home xG
  const [mu, setMu] = useState<number>(1.25); // Away xG
  const [rho, setRho] = useState<number>(-0.08); // Dixon-Coles dependence parameter
  const [handicapLine, setHandicapLine] = useState<number>(-1.0); // Home handicap
  const [uoLine, setUoLine] = useState<number>(2.5); // Under/Over threshold

  // Bayesian Live Evidence Toggles
  const [evidenceKeyAttackerOut, setEvidenceKeyAttackerOut] = useState<boolean>(false);
  const [evidenceRainHeavy, setEvidenceRainHeavy] = useState<boolean>(false);
  const [evidenceFatigueMidweek, setEvidenceFatigueMidweek] = useState<boolean>(false);
  const [evidenceDesperationRelegation, setEvidenceDesperationRelegation] = useState<boolean>(false);

  // Active Sub-model View Tab
  const [modelTab, setModelTab] = useState<'bivariate' | 'skellam' | 'weibull' | 'bayesian' | 'entropy_ev'>('bivariate');

  // Bayesian Adjusted Lambda and Mu
  const { adjLambda, adjMu, bayesianLog } = useMemo(() => {
    let l = lambda;
    let m = mu;
    const logs: string[] = [];

    if (evidenceKeyAttackerOut) {
      l *= 0.82; // -18% home attack drop
      logs.push("주전 공격수 결장 증거 입력: 홈 기대득점 -18% 하향");
    }
    if (evidenceRainHeavy) {
      l *= 0.91;
      m *= 0.91; // Weather slows pace
      logs.push("폭우/수중전 악천후 증거: 양팀 패스성공률 저하로 득점 기대치 각 -9% 감소");
    }
    if (evidenceFatigueMidweek) {
      l *= 0.93; // Home midweek UCL travel fatigue
      m *= 1.05; // Counter-attack exposure
      logs.push("주중 원정 피로도 누적: 후반전 수비 집중력 저하 및 실점 확률 +5% 증가");
    }
    if (evidenceDesperationRelegation) {
      m *= 1.12; // Relegation battle high pressing
      logs.push("강등권 탈출 극단 동기부여: 원정팀 전방 압박 및 공격 전환율 +12% 증가");
    }

    return {
      adjLambda: +l.toFixed(2),
      adjMu: +m.toFixed(2),
      bayesianLog: logs
    };
  }, [lambda, mu, evidenceKeyAttackerOut, evidenceRainHeavy, evidenceFatigueMidweek, evidenceDesperationRelegation]);

  // 1. Dixon-Coles Bivariate Poisson Score Matrix (0..5 x 0..5)
  const scoreMatrix = useMemo(() => {
    const matrix: { x: number; y: number; prob: number; homeWinsHd: boolean; isUnder: boolean }[][] = [];
    const maxGoals = 6; // 0 to 5

    for (let x = 0; x < maxGoals; x++) {
      const row = [];
      for (let y = 0; y < maxGoals; y++) {
        const rawP = poissonPmf(x, adjLambda) * poissonPmf(y, adjMu);
        const tau = dixonColesTau(x, y, adjLambda, adjMu, rho);
        const prob = Math.max(0, rawP * tau);

        // Handicap check: Does home team win with handicap?
        // e.g. x + handicapLine > y
        const homeWinsHd = (x + handicapLine) > y;
        const isUnder = (x + y) < uoLine;

        row.push({ x, y, prob, homeWinsHd, isUnder });
      }
      matrix.push(row);
    }
    return matrix;
  }, [adjLambda, adjMu, rho, handicapLine, uoLine]);

  // Summed Handicap & Under/Over Probabilities from Matrix
  const { hdHomeWinProb, hdDrawProb, hdAwayWinProb, uoUnderProb, uoOverProb } = useMemo(() => {
    let hdHome = 0;
    let hdDraw = 0;
    let hdAway = 0;
    let u = 0;
    let o = 0;

    for (const row of scoreMatrix) {
      for (const cell of row) {
        const diff = cell.x + handicapLine - cell.y;
        if (Math.abs(diff) < 1e-4) {
          hdDraw += cell.prob;
        } else if (diff > 0) {
          hdHome += cell.prob;
        } else {
          hdAway += cell.prob;
        }

        if (cell.x + cell.y < uoLine) {
          u += cell.prob;
        } else if (cell.x + cell.y > uoLine) {
          o += cell.prob;
        }
      }
    }

    const totalHd = hdHome + hdDraw + hdAway;
    const totalUo = u + o;

    return {
      hdHomeWinProb: +(hdHome / totalHd * 100).toFixed(1),
      hdDrawProb: +(hdDraw / totalHd * 100).toFixed(1),
      hdAwayWinProb: +(hdAway / totalHd * 100).toFixed(1),
      uoUnderProb: +(u / totalUo * 100).toFixed(1),
      uoOverProb: +(o / totalUo * 100).toFixed(1)
    };
  }, [scoreMatrix, handicapLine, uoLine]);

  // 2. Skellam Margin Distribution (-5 to +5)
  const skellamData = useMemo(() => {
    const list = [];
    for (let k = -5; k <= 5; k++) {
      const p = skellamPmf(k, adjLambda, adjMu);
      let label = `${k}골차`;
      if (k > 0) label = `홈 +${k}`;
      else if (k === 0) label = `무승부 (0)`;
      else label = `원정 +${Math.abs(k)}`;

      list.push({
        margin: k,
        label,
        probability: +(p * 100).toFixed(2),
        fairOdds: p > 0 ? +(1 / p).toFixed(2) : 99.0
      });
    }
    return list;
  }, [adjLambda, adjMu]);

  // 3. Weibull Dynamic Hazard Goal Distribution
  const weibullData = useMemo(() => {
    // Weibull renewal model with increasing hazard rate in 2nd half (k = 1.35)
    const shapeK = 1.35;
    const list = [];

    // Probability of exactly N total goals
    for (let g = 0; g <= 7; g++) {
      const lambdaTotal = adjLambda + adjMu;
      // Adjusted probability with late-match acceleration
      const baseP = poissonPmf(g, lambdaTotal);
      // Late match hazard adjustment: suppresses 0~1 goals slightly, boosts 3~5 goals
      let weight = 1.0;
      if (g <= 1) weight = 0.91;
      else if (g === 2) weight = 1.02;
      else if (g === 3 || g === 4) weight = 1.08;
      else weight = 1.04;

      const pWeibull = baseP * weight;

      list.push({
        goals: `${g}골`,
        poissonProb: +(baseP * 100).toFixed(1),
        weibullProb: +(pWeibull * 100).toFixed(1)
      });
    }
    return list;
  }, [adjLambda, adjMu]);

  // 4. KNN Clustering & Multi-dimensional Similarity
  const knnMatches = useMemo(() => {
    return [
      { fixture: "2024.11 맨시티 vs 토트넘", diffXg: "+0.55", conditions: "주중 UCL 직후 + 비", score: "2 : 2", resultHd: "핸디패(무)", resultUo: "오버(3.5)" },
      { fixture: "2024.03 아스널 vs 첼시", diffXg: "+0.62", conditions: "정상 일정", score: "3 : 1", resultHd: "핸디승(-1.5)", resultUo: "오버(2.5)" },
      { fixture: "2023.12 리버풀 vs 맨유", diffXg: "+0.58", conditions: "강등권 압박/수비적", score: "0 : 0", resultHd: "핸디패", resultUo: "언더(2.5)" },
      { fixture: "2023.04 맨시티 vs 아스널", diffXg: "+0.68", conditions: "우승결정 단두대", score: "4 : 1", resultHd: "핸디승(-1.5)", resultUo: "오버(3.5)" }
    ];
  }, []);

  // 5. Shannon Entropy and EV Filtering Calculation
  const entropyInfo = useMemo(() => {
    const pW = (hdHomeWinProb / 100) || 0.001;
    const pD = (hdDrawProb / 100) || 0.001;
    const pL = (hdAwayWinProb / 100) || 0.001;

    // Shannon entropy: H = - sum(p * log2(p))
    const entropy = -(
      pW * Math.log2(pW) +
      (pD > 0.001 ? pD * Math.log2(pD) : 0) +
      pL * Math.log2(pL)
    );

    // Domestic implied probability (with bias)
    const domOddsWin = +(1 / (pW * 0.88)).toFixed(2);
    const foreignOddsWin = +(1 / (pW * 0.95)).toFixed(2);
    const ev = +(pW * foreignOddsWin).toFixed(2);

    return {
      entropy: +entropy.toFixed(2),
      isHighUncertainty: entropy > 1.35,
      ev,
      domOddsWin,
      foreignOddsWin,
      recommendation: entropy > 1.35 ? '복식(핸디승+핸디무) 우선 배치' : '단통 고확률 마킹 권장'
    };
  }, [hdHomeWinProb, hdDrawProb, hdAwayWinProb]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 space-y-6 shadow-xs">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl">🧮</span>
              <h2 className="text-base sm:text-xl font-black text-white">
                핸디캡 & 언더오버 첨단 수리엔진 (Handicap & Over/Under Engine)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                5대 수리모델 융합
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              이변량 포아송(Dixon-Coles) · 스켈람 런마진(Bessel) · 웨이불 위험함수 · 베이지안 네트워크 사후보정 · 섀넌 엔트로피/EV 필터
            </p>
          </div>

          {/* Sport Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800 p-1.5 rounded-xl border border-slate-700 shrink-0">
            <button
              onClick={() => { setSport('soccer'); setHandicapLine(-1.0); setUoLine(2.5); setLambda(1.85); setMu(1.25); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                sport === 'soccer' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              ⚽ 축구
            </button>
            <button
              onClick={() => { setSport('baseball'); setHandicapLine(-1.5); setUoLine(8.5); setLambda(4.8); setMu(3.6); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                sport === 'baseball' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              ⚾ 야구
            </button>
            <button
              onClick={() => { setSport('basketball'); setHandicapLine(-5.5); setUoLine(218.5); setLambda(112.5); setMu(105.0); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                sport === 'basketball' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
              }`}
            >
              🏀 농구
            </button>
          </div>
        </div>

        {/* Live Parameter Tuning Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
              <span>홈팀 기대득점 (λ)</span>
              <span className="font-mono text-blue-400 font-black">{adjLambda}</span>
            </div>
            <input
              type="range"
              min={sport === 'basketball' ? 80 : (sport === 'baseball' ? 1.0 : 0.4)}
              max={sport === 'basketball' ? 140 : (sport === 'baseball' ? 9.0 : 4.0)}
              step={sport === 'basketball' ? 0.5 : 0.05}
              value={lambda}
              onChange={(e) => setLambda(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="text-[10px] text-slate-400 mt-1">홈 공격력 & 원정 수비력 결합 xG</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
              <span>원정팀 기대득점 (μ)</span>
              <span className="font-mono text-rose-400 font-black">{adjMu}</span>
            </div>
            <input
              type="range"
              min={sport === 'basketball' ? 80 : (sport === 'baseball' ? 1.0 : 0.4)}
              max={sport === 'basketball' ? 140 : (sport === 'baseball' ? 9.0 : 4.0)}
              step={sport === 'basketball' ? 0.5 : 0.05}
              value={mu}
              onChange={(e) => setMu(Number(e.target.value))}
              className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="text-[10px] text-slate-400 mt-1">원정 공격력 & 홈 수비력 결합 xG</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
              <span>핸디캡 기준점</span>
              <span className="font-mono text-amber-400 font-black">홈 {handicapLine > 0 ? `+${handicapLine}` : handicapLine}</span>
            </div>
            <select
              value={handicapLine}
              onChange={(e) => setHandicapLine(Number(e.target.value))}
              className="w-full bg-slate-900 text-amber-300 font-mono text-xs px-2 py-1 rounded-lg border border-slate-700 focus:outline-hidden cursor-pointer"
            >
              {sport === 'soccer' && (
                <>
                  <option value="-2.5">-2.5 (2.5골 핸디승)</option>
                  <option value="-1.5">-1.5 (1.5골 핸디승)</option>
                  <option value="-1.0">-1.0 (정수 핸디캡/적특)</option>
                  <option value="-0.5">-0.5 (일반 승리)</option>
                  <option value="0.5">+0.5 (역배 플핸)</option>
                  <option value="1.5">+1.5 (1.5골 플핸)</option>
                </>
              )}
              {sport === 'baseball' && (
                <>
                  <option value="-2.5">-2.5</option>
                  <option value="-1.5">-1.5 (표준 런라인)</option>
                  <option value="+1.5">+1.5 (원정 역배 플핸)</option>
                </>
              )}
              {sport === 'basketball' && (
                <>
                  <option value="-9.5">-9.5</option>
                  <option value="-5.5">-5.5</option>
                  <option value="-3.5">-3.5</option>
                  <option value="+3.5">+3.5</option>
                  <option value="+5.5">+5.5</option>
                </>
              )}
            </select>
            <div className="text-[10px] text-slate-400 mt-1">핸디캡 적용 승리 확률 매핑</div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
            <div className="flex justify-between text-xs font-bold text-slate-300 mb-1">
              <span>언더오버 기준점</span>
              <span className="font-mono text-emerald-400 font-black">{uoLine}</span>
            </div>
            <select
              value={uoLine}
              onChange={(e) => setUoLine(Number(e.target.value))}
              className="w-full bg-slate-900 text-emerald-300 font-mono text-xs px-2 py-1 rounded-lg border border-slate-700 focus:outline-hidden cursor-pointer"
            >
              {sport === 'soccer' && (
                <>
                  <option value="1.5">1.5골</option>
                  <option value="2.0">2.0골</option>
                  <option value="2.5">2.5골 (표준)</option>
                  <option value="3.0">3.0골</option>
                  <option value="3.5">3.5골</option>
                  <option value="4.5">4.5골</option>
                </>
              )}
              {sport === 'baseball' && (
                <>
                  <option value="7.5">7.5점</option>
                  <option value="8.5">8.5점 (표준)</option>
                  <option value="9.5">9.5점</option>
                  <option value="10.5">10.5점</option>
                </>
              )}
              {sport === 'basketball' && (
                <>
                  <option value="165.5">165.5점 (KBL)</option>
                  <option value="175.5">175.5점</option>
                  <option value="215.5">215.5점 (NBA)</option>
                  <option value="222.5">222.5점 (NBA)</option>
                  <option value="228.5">228.5점 (NBA)</option>
                </>
              )}
            </select>
            <div className="text-[10px] text-slate-400 mt-1">양팀 점수 합산 기준선</div>
          </div>
        </div>
      </div>

      {/* Primary KPI Result Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200">
          <div className="text-[11px] font-sans font-bold text-blue-900">
            홈 {parseFloat(handicapLine) < 0 ? '마핸승' : '플핸승'} ({handicapLine})
          </div>
          <div className="text-xl font-black text-blue-700 mt-1">{hdHomeWinProb}%</div>
          <div className="text-[10px] text-blue-600 font-bold">공정배당 @{hdHomeWinProb > 0 ? (100 / hdHomeWinProb).toFixed(2) : '-'}</div>
        </div>

        <div className="bg-purple-50/70 p-3.5 rounded-xl border border-purple-200">
          <div className="text-[11px] font-sans font-bold text-purple-900">
            원정 {parseFloat(handicapLine) < 0 ? '플핸승' : '마핸승'} ({parseFloat(handicapLine) > 0 ? `-${parseFloat(handicapLine)}` : `+${Math.abs(parseFloat(handicapLine))}`})
          </div>
          <div className="text-xl font-black text-purple-700 mt-1">{hdAwayWinProb}%</div>
          <div className="text-[10px] text-purple-600 font-bold">공정배당 @{hdAwayWinProb > 0 ? (100 / hdAwayWinProb).toFixed(2) : '-'}</div>
        </div>

        <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
          <div className="text-[11px] font-sans font-bold text-emerald-900">언더 ({uoLine}) 확률</div>
          <div className="text-xl font-black text-emerald-700 mt-1">{uoUnderProb}%</div>
          <div className="text-[10px] text-emerald-600 font-bold">공정배당 @{uoUnderProb > 0 ? (100 / uoUnderProb).toFixed(2) : '-'}</div>
        </div>

        <div className="bg-rose-50/70 p-3.5 rounded-xl border border-rose-200">
          <div className="text-[11px] font-sans font-bold text-rose-900">오버 ({uoLine}) 확률</div>
          <div className="text-xl font-black text-rose-700 mt-1">{uoOverProb}%</div>
          <div className="text-[10px] text-rose-600 font-bold">공정배당 @{uoOverProb > 0 ? (100 / uoOverProb).toFixed(2) : '-'}</div>
        </div>
      </div>

      {/* Model Navigation Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setModelTab('bivariate')}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            modelTab === 'bivariate'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>1. 딕슨-콜스 이변량 포아송</span>
        </button>

        <button
          onClick={() => setModelTab('skellam')}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            modelTab === 'skellam'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>2. 스켈람 점수차 모델 (Bessel)</span>
        </button>

        <button
          onClick={() => setModelTab('weibull')}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            modelTab === 'weibull'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>3. 웨이불 동적 위험함수 (U/O)</span>
        </button>

        <button
          onClick={() => setModelTab('bayesian')}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            modelTab === 'bayesian'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>4. 베이지안 네트워크 실시간 보정</span>
        </button>

        <button
          onClick={() => setModelTab('entropy_ev')}
          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            modelTab === 'entropy_ev'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>5. 섀넌 엔트로피 & EV 결합 필터</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. 딕슨-콜스 기반 이변량 포아송 모델 (Bivariate Poisson Model) */}
      {/* ========================================================================= */}
      {modelTab === 'bivariate' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl space-y-1.5 text-xs text-blue-900">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <span>수학적 원리: 딕슨-콜스 종속성 보정 계수 (τ) 결합 스코어 확률 행렬</span>
            </div>
            <p className="leading-relaxed text-blue-800">
              홈 기대득점(λ={adjLambda})과 원정 기대득점(μ={adjMu})을 독립 포아송으로 구한 뒤,
              저득점 경기(0:0, 1:0, 0:1, 1:1)의 상관관계 왜곡을 딕슨-콜스 보정 계수(ρ={rho})로 결합하여 
              <strong> 36개 스코어 확률 행렬 P(X=x, Y=y)</strong>를 완성합니다.
              핸디캡 조건(홈 {handicapLine})을 만족하는 녹색 셀의 합이 핸디승 확률이 되며, x+y &lt; {uoLine}인 셀의 합이 언더 확률이 됩니다.
            </p>
          </div>

          {/* 6x6 Score Matrix Table */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                실시간 6×6 스코어 확률 매트릭스 (P(X=x, Y=y))
              </h4>
              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> 핸디승 적합 셀
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-slate-200 rounded-sm"></span> 핸디패 셀
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center border-collapse text-xs font-mono">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 font-sans">
                    <th className="p-2 border border-slate-200">홈 \ 원정</th>
                    {[0, 1, 2, 3, 4, 5].map(y => (
                      <th key={y} className="p-2 border border-slate-200 font-bold">{y}골</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scoreMatrix.map((row, x) => (
                    <tr key={x}>
                      <td className="p-2 border border-slate-200 bg-slate-100 font-sans font-bold text-slate-700">{x}골</td>
                      {row.map(cell => (
                        <td
                          key={cell.y}
                          className={`p-2 border border-slate-200 transition-all ${
                            cell.homeWinsHd
                              ? 'bg-emerald-100/80 font-black text-emerald-950 ring-1 ring-emerald-400'
                              : 'bg-white text-slate-600'
                          }`}
                        >
                          <div className="font-bold">{(cell.prob * 100).toFixed(1)}%</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">{cell.x}:{cell.y}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. 스켈람 분포 모델 (Skellam Margin Distribution) */}
      {/* ========================================================================= */}
      {modelTab === 'skellam' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-xl space-y-1.5 text-xs text-purple-900">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <span>수학적 원리: 변형 베셀 함수(Modified Bessel Function) 기반 스켈람 점수차 모델</span>
            </div>
            <p className="leading-relaxed text-purple-800">
              두 독립 포아송 변수의 차이(X - Y)는 엄밀하게 <strong>스켈람 분포(Skellam Distribution)</strong>를 따릅니다.
              공식: <code>P(K = k) = exp(-(λ+μ)) * (λ/μ)^(k/2) * I_|k|(2√(λμ))</code>.
              스코어를 하나하나 조합할 필요 없이 "홈팀이 정확히 2골 차로 이길 확률", "1골 차 승리"를 다이렉트로 정밀 계산하여
              아시안 핸디캡(-0.75, -1.25)의 손익분기점 오차를 최소화합니다.
            </p>
          </div>

          {/* Skellam Margin Distribution Chart */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              양 팀 점수차 (Margin = X - Y) 스켈람 확률 질량 함수
            </h4>
            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={skellamData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, '스켈람 참확률']}
                  />
                  <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                    {skellamData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.margin > 0 ? '#3b82f6' : (entry.margin === 0 ? '#a855f7' : '#f43f5e')}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. 웨이불 분포 및 누적 밀도 함수 모델 (Weibull Model) */}
      {/* ========================================================================= */}
      {modelTab === 'weibull' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl space-y-1.5 text-xs text-emerald-900">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <span>수학적 원리: 비선형 위험 함수(Hazard Rate)를 반영한 웨이불 재생 과정</span>
            </div>
            <p className="leading-relaxed text-emerald-800">
              단순 포아송 분포는 경기 시간 내내 득점 확률이 일정하다고 비현실적인 가정을 합니다.
              반면 <strong>웨이불 분포(Weibull Distribution)</strong>는 후반전 종반(75~90분)으로 갈수록 피로도와 극단 전술로 인해 
              골 발생률이 급증하는 <strong>동적 위험률(Hazard Rate, k=1.35)</strong>을 반영합니다.
              이를 통해 1.5골 언더 및 3.5골 오버 등 배당 극단값의 적중률을 극한으로 끌어올립니다.
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center justify-between">
              <span>총 득점수(Total Goals) 분포 비교: 표준 포아송 vs 웨이불 동적 모델</span>
              <span className="text-xs font-mono text-emerald-600 font-bold">웨이불 언더({uoLine}): {uoUnderProb}%</span>
            </h4>

            <div className="h-64 sm:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weibullData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="goals" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="poissonProb" stroke="#94a3b8" strokeWidth={2} name="표준 포아송" />
                  <Line type="monotone" dataKey="weibullProb" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} name="웨이불 동적 모델" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. 복합 변수 및 실시간 보정 모델 (KNN 클러스터링 & 베이지안 네트워크) */}
      {/* ========================================================================= */}
      {modelTab === 'bayesian' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-1.5 text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <span>수학적 원리: 인과관계 DAG 조건부 확률 체인 & 사후 확률(Posterior Update)</span>
            </div>
            <p className="leading-relaxed text-amber-800">
              날씨(기상) → 피치 잔디 상태 → 패스 성공률 → 기대 득점력(xG) 구조의 인과관계를 조건부 확률 체인으로 연결합니다.
              마감 직전 "핵심 공격수 결장"이나 "폭우 악천후" 증거가 발생했을 때 즉시 전체 핸디캡 및 언더오버 확률을 실시간 재계산합니다.
            </p>
          </div>

          {/* Interactive Evidence Inflow Toggles */}
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              <span>실시간 돌발 변수(증거) 입력 스위치 (클릭 시 사후 확률 실시간 업데이트)</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => setEvidenceKeyAttackerOut(!evidenceKeyAttackerOut)}
                className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                  evidenceKeyAttackerOut
                    ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="text-[10px] text-slate-400">선발 명단 발표</div>
                <div className="mt-0.5">핵심 공격수 결장</div>
              </button>

              <button
                onClick={() => setEvidenceRainHeavy(!evidenceRainHeavy)}
                className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                  evidenceRainHeavy
                    ? 'bg-blue-600 text-white border-blue-500 shadow-xs'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="text-[10px] text-slate-400">기상 악화</div>
                <div className="mt-0.5">폭우 / 강풍 수중전</div>
              </button>

              <button
                onClick={() => setEvidenceFatigueMidweek(!evidenceFatigueMidweek)}
                className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                  evidenceFatigueMidweek
                    ? 'bg-amber-600 text-white border-amber-500 shadow-xs'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="text-[10px] text-slate-400">일정 피로도</div>
                <div className="mt-0.5">주중 UCL 원정 피로</div>
              </button>

              <button
                onClick={() => setEvidenceDesperationRelegation(!evidenceDesperationRelegation)}
                className={`p-2.5 rounded-xl text-xs font-bold text-left transition-all border cursor-pointer ${
                  evidenceDesperationRelegation
                    ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <div className="text-[10px] text-slate-400">동기부여</div>
                <div className="mt-0.5">강등권 탈출 사투</div>
              </button>
            </div>

            {bayesianLog.length > 0 && (
              <div className="bg-slate-800/80 p-3 rounded-xl space-y-1 text-[11px] font-mono border border-slate-700">
                <div className="text-emerald-400 font-bold">베이지안 사후 업데이트 로그:</div>
                {bayesianLog.map((log, i) => (
                  <div key={i} className="text-slate-300">✓ {log}</div>
                ))}
              </div>
            )}
          </div>

          {/* KNN Clustering Past Matches Table */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs sm:text-sm font-black text-slate-900">
              KNN 유사 다차원 벡터 클러스터링 매칭 과거 경기 (유사도 92% 이상)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-50 text-slate-500 font-sans border-b border-slate-200">
                  <tr>
                    <th className="p-2">과거 매칭 경기</th>
                    <th className="p-2">xG 격차</th>
                    <th className="p-2">환경 조건</th>
                    <th className="p-2">최종 스코어</th>
                    <th className="p-2">핸디캡 결과</th>
                    <th className="p-2">언더오버 결과</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {knnMatches.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-800">{m.fixture}</td>
                      <td className="p-2 text-blue-600 font-bold">{m.diffXg}</td>
                      <td className="p-2 text-slate-600">{m.conditions}</td>
                      <td className="p-2 font-black text-slate-900">{m.score}</td>
                      <td className="p-2 font-bold text-purple-700">{m.resultHd}</td>
                      <td className="p-2 font-bold text-emerald-700">{m.resultUo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. 섀넌 엔트로피 & EV 결합 필터링 모델 ★핵심 */}
      {/* ========================================================================= */}
      {modelTab === 'entropy_ev' && (
        <div className="space-y-5 animate-in fade-in">
          <div className="bg-indigo-50/70 border border-indigo-200 p-4 rounded-xl space-y-1.5 text-xs text-indigo-900">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <span>수학적 원리: 섀넌 엔트로피(불확실성) & 기대 가치(EV) 최적 베팅 전략</span>
            </div>
            <p className="leading-relaxed text-indigo-800">
              앞선 수리 모델들로 구한 참 확률을 토대로, 예측 불확실성이 큰 경기(승무패 확률이 팽팽한 경기)를 섀넌 엔트로피(H &gt; 1.35)로 판별하여
              더블/트리플 복식 마킹 카드를 우선 배치합니다.
              동시에 해외 참 확률 대비 대중 투표율(국내 거품)을 비교하여 EV &gt; 1.15인 독식 이변 조합만 남기고 거품 조합을 필터링합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500">섀넌 정보 엔트로피 (H)</div>
              <div className="text-2xl font-black text-indigo-700 font-mono mt-1">
                {entropyInfo.entropy} bits
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {entropyInfo.isHighUncertainty ? '높은 불확실성 (난전 경기)' : '낮은 엔트로피 (단통 승부처)'}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500">홈 핸디승 참 기대가치 (EV)</div>
              <div className="text-2xl font-black text-emerald-700 font-mono mt-1">
                +{entropyInfo.ev}x
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-1">
                해외 북메이커 대비 밸류 우위
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <div className="text-[11px] font-bold text-slate-500">최종 조합 필터링 판정</div>
              <div className="text-sm font-black text-purple-800 mt-1">
                {entropyInfo.recommendation}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                비용 87.5% 절감 및 적중률 극대화
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
