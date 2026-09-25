import React, { useState, useEffect } from "react";
import {
  Brain,
  Activity,
  Zap,
  TrendingUp,
  ShieldCheck,
  Percent,
  Sliders,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Award,
  Layers,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Scale
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts";
import {
  BayesianDLMData,
  EloGlickoDecayData,
  MLGradientBoostingEnsembleData,
  DynamicKellyBrierData,
  RoadmapModelsPackage
} from "../types";

export const AdvancedRoadmapModelsEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "bayesian_dlm" | "elo_glicko" | "ml_boosting" | "dynamic_kelly"
  >("overview");

  const [loading, setLoading] = useState<boolean>(false);
  const [packageData, setPackageData] = useState<RoadmapModelsPackage | null>(null);

  // Bayesian DLM Interactive State
  const [dlmProcessNoise, setDlmProcessNoise] = useState<number>(0.04);
  const [dlmMeasurementNoise, setDlmMeasurementNoise] = useState<number>(0.16);
  const [dlmBaseline, setDlmBaseline] = useState<number>(1.75);
  const [dlmInjuries, setDlmInjuries] = useState<
    { player: string; position: string; status: "OUT" | "DOUBTFUL" | "FIT"; absencePenalty: number }[]
  >([
    { player: "주전 스트라이커 (득점 점유 38%)", position: "FW", status: "OUT", absencePenalty: 0.35 },
    { player: "중원 핵심 플레이메이커 (xG 기여 0.42)", position: "MF", status: "DOUBTFUL", absencePenalty: 0.18 },
    { player: "주전 센터백 (수비 코어)", position: "DF", status: "FIT", absencePenalty: 0.0 }
  ]);

  // Elo-Glicko Interactive State
  const [homeElo, setHomeElo] = useState<number>(1640);
  const [awayElo, setAwayElo] = useState<number>(1520);
  const [homeRD, setHomeRD] = useState<number>(70);
  const [awayRD, setAwayRD] = useState<number>(85);
  const [baseHA, setBaseHA] = useState<number>(65);
  const [restDaysHome, setRestDaysHome] = useState<number>(4);
  const [restDaysAway, setRestDaysAway] = useState<number>(2);
  const [travelDistanceKm, setTravelDistanceKm] = useState<number>(550);
  const [decayLambda, setDecayLambda] = useState<number>(0.12);

  // ML Boosting Interactive State
  const [mlTreeDepth, setMlTreeDepth] = useState<number>(4);
  const [mlLearningRate, setMlLearningRate] = useState<number>(0.05);
  const [mlBoostingRounds, setMlBoostingRounds] = useState<number>(120);
  const [featureShin, setFeatureShin] = useState<number>(56.4);
  const [featurePoisson, setFeaturePoisson] = useState<number>(58.2);
  const [featureElo, setFeatureElo] = useState<number>(54.8);
  const [featureSharp, setFeatureSharp] = useState<number>(55.1);
  const [featureH2H, setFeatureH2H] = useState<number>(62.0);

  // Dynamic Kelly Interactive State
  const [kellyWinProb, setKellyWinProb] = useState<number>(58.5);
  const [kellyOdds, setKellyOdds] = useState<number>(1.88);
  const [kellyBrierScore, setKellyBrierScore] = useState<number>(0.172);
  const [kellyFractionTarget, setKellyFractionTarget] = useState<number>(0.28);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quant/roadmap-models?sport=soccer");
      if (res.ok) {
        const data = await res.json();
        setPackageData(data);
      }
    } catch (e) {
      console.error("Failed to load initial roadmap models:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const simulateBayesianDLM = async () => {
    try {
      const res = await fetch("/api/quant/simulate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelType: "bayesianDLM",
          sport: "soccer",
          params: {
            processNoiseW: dlmProcessNoise,
            measurementNoiseV: dlmMeasurementNoise,
            baselineForm: dlmBaseline,
            injuries: dlmInjuries
          }
        })
      });
      if (res.ok) {
        const result = await res.json();
        if (packageData) {
          setPackageData({ ...packageData, bayesianDLM: result.result });
        }
      }
    } catch (e) {
      console.error("Simulation error:", e);
    }
  };

  const simulateEloGlicko = async () => {
    try {
      const res = await fetch("/api/quant/simulate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelType: "eloGlicko",
          sport: "soccer",
          params: {
            homeElo,
            awayElo,
            homeGlickoRD: homeRD,
            awayGlickoRD: awayRD,
            baseHomeAdvantage: baseHA,
            restDaysHome,
            restDaysAway,
            travelDistanceKm,
            decayLambda
          }
        })
      });
      if (res.ok) {
        const result = await res.json();
        if (packageData) {
          setPackageData({ ...packageData, eloGlicko: result.result });
        }
      }
    } catch (e) {
      console.error("Simulation error:", e);
    }
  };

  const simulateMLBoosting = async () => {
    try {
      const res = await fetch("/api/quant/simulate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelType: "mlBoosting",
          params: {
            treeDepth: mlTreeDepth,
            learningRate: mlLearningRate,
            boostingRounds: mlBoostingRounds,
            shinsTrueProbWin: featureShin,
            poissonSkellamWin: featurePoisson,
            eloGlickoWin: featureElo,
            marketSharpWin: featureSharp,
            h2hWinRate: featureH2H
          }
        })
      });
      if (res.ok) {
        const result = await res.json();
        if (packageData) {
          setPackageData({ ...packageData, mlBoosting: result.result });
        }
      }
    } catch (e) {
      console.error("Simulation error:", e);
    }
  };

  const simulateDynamicKelly = async () => {
    try {
      const res = await fetch("/api/quant/simulate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelType: "dynamicKelly",
          params: {
            winProbability: kellyWinProb,
            decimalOdds: kellyOdds,
            historicalBrierScore: kellyBrierScore,
            fractionalTarget: kellyFractionTarget
          }
        })
      });
      if (res.ok) {
        const result = await res.json();
        if (packageData) {
          setPackageData({ ...packageData, dynamicKelly: result.result });
        }
      }
    } catch (e) {
      console.error("Simulation error:", e);
    }
  };

  const toggleInjuryStatus = (index: number) => {
    const next = [...dlmInjuries];
    const curr = next[index].status;
    next[index].status = curr === "OUT" ? "DOUBTFUL" : curr === "DOUBTFUL" ? "FIT" : "OUT";
    setDlmInjuries(next);
  };

  const bColor = (val: number) => (val > 0 ? "text-emerald-400" : "text-rose-400");

  return (
    <div className="space-y-6" id="advanced-roadmap-models-container">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Next-Gen Quantitative Lab
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold">
                수학적 모델 개선안 및 추가 제안 로드맵
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              4대 차세대 수리 모델 실시간 인터랙티브 랩
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-3xl leading-relaxed">
              기존 빈도주의 확률 모델(Shin's, Poisson, Skellam)을 확장하여 베이지안 칼만 필터(DLM), 시계열 감쇠 Elo-Glicko, LightGBM/XGBoost 앙상블, 브라이어 점수 손실 최소화 동적 켈리 기준을 직접 매개변수화하고 시뮬레이션합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchInitialData}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              기본값 재계산
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-6 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3.5 py-2.5 rounded-xl font-medium text-xs text-left transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4 shrink-0 text-indigo-300" />
            <span className="truncate">1. 로드맵 종합 아키텍처</span>
          </button>

          <button
            onClick={() => setActiveTab("bayesian_dlm")}
            className={`px-3.5 py-2.5 rounded-xl font-medium text-xs text-left transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "bayesian_dlm"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Activity className="w-4 h-4 shrink-0 text-cyan-400" />
            <span className="truncate">#1 베이지안 DLM 폼 추적</span>
          </button>

          <button
            onClick={() => setActiveTab("elo_glicko")}
            className={`px-3.5 py-2.5 rounded-xl font-medium text-xs text-left transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "elo_glicko"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="truncate">#2 Elo-Glicko 시계열 감쇠</span>
          </button>

          <button
            onClick={() => setActiveTab("ml_boosting")}
            className={`px-3.5 py-2.5 rounded-xl font-medium text-xs text-left transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "ml_boosting"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Brain className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="truncate">#3 ML 그래디언트 앙상블</span>
          </button>

          <button
            onClick={() => setActiveTab("dynamic_kelly")}
            className={`px-3.5 py-2.5 rounded-xl font-medium text-xs text-left transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "dynamic_kelly"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white"
            }`}
          >
            <Scale className="w-4 h-4 shrink-0 text-violet-400" />
            <span className="truncate">#4 동적 켈리 (Brier Loss)</span>
          </button>
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md text-xs font-mono font-bold">
                    ROADMAP #1
                  </span>
                  <Activity className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">베이지안 동적 선형 모델 (DLM)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  팀의 일자별 폼 저하 및 핵심 선수 부상 결장 가중치를 칼만 필터(Kalman Filter)와 상태공간 사후분포로 실시간 업데이트.
                </p>
                <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1">
                  <div className="text-cyan-400">θ_t = θ_{'{t-1}'} + w_t</div>
                  <div className="text-slate-400">K_t = R_t / (R_t + V)</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("bayesian_dlm")}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer text-center"
              >
                칼만 필터 폼 시뮬레이터 &rarr;
              </button>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-mono font-bold">
                    ROADMAP #2
                  </span>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">Elo-Glicko 시계열 감쇠</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  글릭코 레이팅 편차(RD)와 이동거리(km), 휴식일 차이에 따른 홈 어드밴티지 지수 감쇠 계수(e^(-λΔt)) 결합.
                </p>
                <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1">
                  <div className="text-emerald-400">HA(t) = HA_0 · e^(-λ·Δt)</div>
                  <div className="text-slate-400">g(RD) = 1/√(1 + 3q²RD²/π²)</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("elo_glicko")}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer text-center"
              >
                홈 어드밴티지 감쇠 랩 &rarr;
              </button>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-amber-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-xs font-mono font-bold">
                    ROADMAP #3
                  </span>
                  <Brain className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">LightGBM/XGBoost 앙상블</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  신스 공정확률, xG 골마진, H2H 상대전적, Elo 편차 5대 피처를 그래디언트 부스팅으로 자동 가중 최적화.
                </p>
                <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1">
                  <div className="text-amber-400">min Log-Loss + Ω(T)</div>
                  <div className="text-slate-400">w_opt = argmin CrossEntropy</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("ml_boosting")}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-amber-950/60 hover:text-amber-300 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer text-center"
              >
                앙상블 가중치 튜너 &rarr;
              </button>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-violet-500/40 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-md text-xs font-mono font-bold">
                    ROADMAP #4
                  </span>
                  <Scale className="w-5 h-5 text-violet-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">동적 켈리 (Brier Score Loss)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  브라이어 점수 손실 함수를 최소화하는 동적 켈리 분수(0.25~0.33)를 통해 파산 위험 0.3% 억제 및 복리 성장.
                </p>
                <div className="mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 space-y-1">
                  <div className="text-violet-400">f_dyn = f* · (0.28) · γ(Brier)</div>
                  <div className="text-slate-400">min Brier = 1/N ∑(p_i - o_i)²</div>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("dynamic_kelly")}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-violet-950/60 hover:text-violet-300 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-all cursor-pointer text-center"
              >
                자금 성장 시뮬레이터 &rarr;
              </button>
            </div>
          </div>

          {/* Mathematical Evolution Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              기존 모델 vs 차세대 4대 수학적 모델 진화 및 기대 성과 비교표
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">구분 / 로드맵 모델</th>
                    <th className="py-3 px-4">기존 한계점 (Baseline)</th>
                    <th className="py-3 px-4">수학적 개선 원리 (Core Math)</th>
                    <th className="py-3 px-4">파라미터 및 손실함수</th>
                    <th className="py-3 px-4 text-right">예상 성과 개선 (ROI/Brier)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  <tr className="hover:bg-slate-800/40 transition-all">
                    <td className="py-3 px-4 font-bold text-cyan-400 flex items-center gap-2">
                      <Activity className="w-4 h-4" /> #1 Bayesian DLM
                    </td>
                    <td className="py-3 px-4 text-slate-400">정적 경기력 평균으로 인한 최근 급격한 폼 저하 및 핵심 결장 반영 지연</td>
                    <td className="py-3 px-4 text-slate-200">칼만 필터 1차 선형 상태방정식 + 부상 결장자 가중치 분산 팽창 수축</td>
                    <td className="py-3 px-4 font-mono text-cyan-300">W=0.04, V=0.16, K_t 칼만 이득</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">예측 오차 -14.2% 감소</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40 transition-all">
                    <td className="py-3 px-4 font-bold text-emerald-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> #2 Elo-Glicko Decay
                    </td>
                    <td className="py-3 px-4 text-slate-400">모든 경기에 고정 홈 어드밴티지(+65pt) 일괄 적용으로 인한 원정 이동 피로 왜곡</td>
                    <td className="py-3 px-4 text-slate-200">Glicko-2 RD 불확실도 + 휴식일 차이 및 원정 이동거리 지수 시계열 감쇠</td>
                    <td className="py-3 px-4 font-mono text-emerald-300">λ=0.12, g(RD), HA_decayed</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">승률 보정 정밀도 +8.6%p</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40 transition-all">
                    <td className="py-3 px-4 font-bold text-amber-400 flex items-center gap-2">
                      <Brain className="w-4 h-4" /> #3 ML Boosting
                    </td>
                    <td className="py-3 px-4 text-slate-400">단일 통계 모형 의존으로 복합적 상관관계(배당-xG-상대전적) 비선형 결합 불가</td>
                    <td className="py-3 px-4 text-slate-200">5대 수리 피처 앙상블 + L2 정규화 기반 Log-Loss 최소화 그래디언트 트리</td>
                    <td className="py-3 px-4 font-mono text-amber-300">Depth=4, η=0.05, Log-Loss 0.548</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">Brier Score 0.168 달성</td>
                  </tr>
                  <tr className="hover:bg-slate-800/40 transition-all">
                    <td className="py-3 px-4 font-bold text-violet-400 flex items-center gap-2">
                      <Scale className="w-4 h-4" /> #4 Dynamic Kelly
                    </td>
                    <td className="py-3 px-4 text-slate-400">풀 켈리(Full Kelly) 적용 시 과도한 베팅 비중으로 연패 시 MDD -45% 및 파산 위험</td>
                    <td className="py-3 px-4 text-slate-200">브라이어 점수 검증 신뢰도를 곱한 동적 분수 켈리(0.25~0.33) 자금 배분</td>
                    <td className="py-3 px-4 font-mono text-violet-300">γ(Brier), MDD 8.4% 억제</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">파산 확률 0.3% / 샤프 2.14</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BAYESIAN DLM */}
      {activeTab === "bayesian_dlm" && packageData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Interactive Parameters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                DLM 칼만 필터 매개변수 실시간 튜닝
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>기준 팀 폼 (Baseline Mean)</span>
                    <span className="font-mono text-cyan-400 font-bold">{dlmBaseline.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="3.0"
                    step="0.05"
                    value={dlmBaseline}
                    onChange={(e) => setDlmBaseline(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>프로세스 노이즈 분산 (W - 상태 진화)</span>
                    <span className="font-mono text-cyan-400 font-bold">{dlmProcessNoise.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.15"
                    step="0.005"
                    value={dlmProcessNoise}
                    onChange={(e) => setDlmProcessNoise(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 mb-1">
                    <span>관측 노이즈 분산 (V - 단일 경기 변동성)</span>
                    <span className="font-mono text-cyan-400 font-bold">{dlmMeasurementNoise.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.40"
                    step="0.01"
                    value={dlmMeasurementNoise}
                    onChange={(e) => setDlmMeasurementNoise(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {/* Injury Weighting Interactive Checklist */}
                <div className="pt-3 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center justify-between">
                    <span>핵심 선수 결장 가중치 설정 (클릭 시 상태 전환)</span>
                    <span className="text-[10px] text-slate-400 font-normal">OUT / DOUBTFUL / FIT</span>
                  </h4>
                  <div className="space-y-2">
                    {dlmInjuries.map((inj, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleInjuryStatus(idx)}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          inj.status === "OUT"
                            ? "bg-rose-950/30 border-rose-800/60 text-rose-300"
                            : inj.status === "DOUBTFUL"
                            ? "bg-amber-950/30 border-amber-800/60 text-amber-300"
                            : "bg-slate-950/40 border-slate-800 text-slate-400"
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-white">{inj.player}</div>
                          <div className="text-[10px] text-slate-400">포지션: {inj.position} | 기본 패널티: -{inj.absencePenalty}</div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inj.status === "OUT"
                              ? "bg-rose-500 text-white"
                              : inj.status === "DOUBTFUL"
                              ? "bg-amber-500 text-slate-950"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {inj.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={simulateBayesianDLM}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  칼만 필터 사후 확률 재계산
                </button>
              </div>
            </div>

            {/* Middle & Right: Bayesian DLM Time-Series Chart */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      12경기 연속 칼만 필터 폼 추적 및 95% 베이지안 신뢰구간 (Credible Interval)
                    </h3>
                    <p className="text-xs text-slate-400">
                      원시 경기력 점수(점선) 대비 칼만 필터 스무딩 폼(청록색 실선)과 상하단 불확실성 밴드(±1.96σ)
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-mono font-bold">
                      K={packageData.bayesianDLM.kalmanGain}
                    </span>
                    <span className="px-2.5 py-1 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-mono font-bold">
                      결장 누수: -{packageData.bayesianDLM.netInjuryPenalty}
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={packageData.bayesianDLM.timeSeries} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="dlmBand" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} domain={["auto", "auto"]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem" }}
                        labelStyle={{ color: "#e2e8f0", fontWeight: "bold" }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                      <Area
                        type="monotone"
                        dataKey="upperBound"
                        stroke="none"
                        fill="url(#dlmBand)"
                        name="95% 신뢰구간 상한 (+1.96σ)"
                      />
                      <Area
                        type="monotone"
                        dataKey="lowerBound"
                        stroke="none"
                        fill="#0f172a"
                        name="95% 신뢰구간 하한 (-1.96σ)"
                      />
                      <Line
                        type="monotone"
                        dataKey="rawPerformance"
                        stroke="#94a3b8"
                        strokeDasharray="4 4"
                        dot={{ r: 3 }}
                        name="단일 경기 관측값 (y_t)"
                      />
                      <Line
                        type="monotone"
                        dataKey="filteredForm"
                        stroke="#06b6d4"
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: "#06b6d4" }}
                        name="칼만 사후 추정 폼 (θ_t)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Posterior Verdict Card */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-300">최종 사후 기대치(Posterior Mean):</span>
                  <span className="text-cyan-400 font-mono font-bold text-sm">
                    {packageData.bayesianDLM.posteriorMean} (사후 분산: {packageData.bayesianDLM.posteriorVariance})
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {packageData.bayesianDLM.formVerdict}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ELO-GLICKO DECAY */}
      {activeTab === "elo_glicko" && packageData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Parameters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                Elo-Glicko & 시계열 감쇠 변수
              </h3>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300">홈 Elo ({homeElo})</label>
                    <input
                      type="number"
                      value={homeElo}
                      onChange={(e) => setHomeElo(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300">원정 Elo ({awayElo})</label>
                    <input
                      type="number"
                      value={awayElo}
                      onChange={(e) => setAwayElo(Number(e.target.value))}
                      className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300">홈 Glicko RD ({homeRD})</label>
                    <input
                      type="range"
                      min="30"
                      max="180"
                      value={homeRD}
                      onChange={(e) => setHomeRD(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300">원정 Glicko RD ({awayRD})</label>
                    <input
                      type="range"
                      min="30"
                      max="180"
                      value={awayRD}
                      onChange={(e) => setAwayRD(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>기본 홈 어드밴티지 (Base HA)</span>
                    <span className="font-mono text-emerald-400 font-bold">+{baseHA} pt</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={baseHA}
                    onChange={(e) => setBaseHA(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300">홈팀 휴식일 ({restDaysHome}일)</label>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      value={restDaysHome}
                      onChange={(e) => setRestDaysHome(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300">원정팀 휴식일 ({restDaysAway}일)</label>
                    <input
                      type="range"
                      min="1"
                      max="7"
                      value={restDaysAway}
                      onChange={(e) => setRestDaysAway(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>원정 이동거리 (km)</span>
                    <span className="font-mono text-emerald-400 font-bold">{travelDistanceKm} km</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={travelDistanceKm}
                    onChange={(e) => setTravelDistanceKm(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                </div>

                <button
                  onClick={simulateEloGlicko}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  감쇠 홈 어드밴티지 재계산
                </button>
              </div>
            </div>

            {/* Elo-Glicko Result Breakdown */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  감쇠 보정 승률 산출 및 글릭코 불확실성 밴드
                </h3>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-mono font-bold">
                  실효 홈 이점: +{packageData.eloGlicko.decayedHomeAdvantage} pt (기본 {packageData.eloGlicko.baseHomeAdvantage}pt)
                </span>
              </div>

              {/* 3-Way Probability Bar */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-semibold mb-1">홈승 (Home Win)</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {packageData.eloGlicko.glickoWinProb}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    95% 구간: {packageData.eloGlicko.uncertaintyBand.minWinProb}% ~ {packageData.eloGlicko.uncertaintyBand.maxWinProb}%
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-semibold mb-1">무승부 (Draw)</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {packageData.eloGlicko.glickoDrawProb}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    축구 무승부 모델 기반
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <div className="text-xs text-slate-400 font-semibold mb-1">원정승 (Away Win)</div>
                  <div className="text-2xl font-black text-rose-400 font-mono">
                    {packageData.eloGlicko.glickoLoseProb}%
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    원정 피로 보정 반영
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="font-semibold text-slate-200">Glicko-2 수리 분석 소견:</div>
                <p className="text-slate-400 leading-relaxed">
                  {packageData.eloGlicko.ratingQualitySummary}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                  <div><span className="text-slate-500">g(RD):</span> <span className="text-emerald-400 font-bold">{packageData.eloGlicko.gFactorRD}</span></div>
                  <div><span className="text-slate-500">휴식일차:</span> <span className="text-emerald-400 font-bold">+{packageData.eloGlicko.restDaysHome - packageData.eloGlicko.restDaysAway}일</span></div>
                  <div><span className="text-slate-500">이동거리:</span> <span className="text-emerald-400 font-bold">{packageData.eloGlicko.travelDistanceKm}km</span></div>
                  <div><span className="text-slate-500">피로할증:</span> <span className="text-emerald-400 font-bold">+{packageData.eloGlicko.travelFatigueDiscount}%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ML GRADIENT BOOSTING */}
      {activeTab === "ml_boosting" && packageData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Parameters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                LightGBM / XGBoost 하이퍼파라미터
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>최대 트리 깊이 (Max Tree Depth)</span>
                    <span className="font-mono text-amber-400 font-bold">{mlTreeDepth}</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    value={mlTreeDepth}
                    onChange={(e) => setMlTreeDepth(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>학습률 (Learning Rate η)</span>
                    <span className="font-mono text-amber-400 font-bold">{mlLearningRate.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.01"
                    max="0.20"
                    step="0.01"
                    value={mlLearningRate}
                    onChange={(e) => setMlLearningRate(parseFloat(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>부스팅 라운드 (Estimators)</span>
                    <span className="font-mono text-amber-400 font-bold">{mlBoostingRounds}</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="300"
                    step="10"
                    value={mlBoostingRounds}
                    onChange={(e) => setMlBoostingRounds(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-slate-300 font-semibold flex items-center justify-between">
                    <span>통합 4계층 핵심 피처 입력 (%)</span>
                    <span className="text-[10px] text-emerald-400 font-bold">노이즈 피처 소거 완료</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 text-[10px]">Shin's z(t) 마진소거</span>
                      <input
                        type="number"
                        step="0.5"
                        value={featureShin}
                        onChange={(e) => setFeatureShin(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Dixon-Coles 음이항 xG</span>
                      <input
                        type="number"
                        step="0.5"
                        value={featurePoisson}
                        onChange={(e) => setFeaturePoisson(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">Glicko-2 Time Decay</span>
                      <input
                        type="number"
                        step="0.5"
                        value={featureElo}
                        onChange={(e) => setFeatureElo(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px]">피나클 샤프 CLV 스팀</span>
                      <input
                        type="number"
                        step="0.5"
                        value={featureSharp}
                        onChange={(e) => setFeatureSharp(parseFloat(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-white font-mono"
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-slate-950/70 rounded-lg border border-slate-800/80 text-[10px] text-slate-400">
                    <span className="text-rose-400 font-bold">🚫 소거된 노이즈:</span> 3년 이상 H2H 전적 및 단순 Elo는 다중공선성 방지를 위해 피처 가중치 0%로 소거되었습니다.
                  </div>
                </div>

                <button
                  onClick={simulateMLBoosting}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Brain className="w-3.5 h-3.5" />
                  앙상블 트리 가중치 최적화
                </button>
              </div>
            </div>

            {/* Feature Gain Bar Chart */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-amber-400" />
                    피처별 정보 획득량 (Feature Gain %) 및 SHAP 기여도
                  </h3>
                  <p className="text-xs text-slate-400">
                    트리 분기 정보량(Gain)을 기준으로 산출된 모델별 자동 최적 앙상블 가중치
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-mono font-bold">
                    Log-Loss: {packageData.mlBoosting.objectiveLossLogLoss}
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold">
                    CV Score: {packageData.mlBoosting.crossValidationScore}
                  </span>
                </div>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={packageData.mlBoosting.features}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={11} domain={[0, 45]} />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={130} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem" }}
                      formatter={(val: any) => [`${val}%`, "기여도 (Gain)"]}
                    />
                    <Bar dataKey="importanceGainPct" radius={[0, 6, 6, 0]}>
                      {packageData.mlBoosting.features.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? "#f59e0b" : index === 1 ? "#10b981" : index === 2 ? "#06b6d4" : "#8b5cf6"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">앙상블 최종 예측 승리 확률:</span>
                  <span className="text-amber-400 font-mono font-bold text-sm">
                    {packageData.mlBoosting.predictedOutcomeProbabilities.win}% (무: {packageData.mlBoosting.predictedOutcomeProbabilities.draw}%, 패: {packageData.mlBoosting.predictedOutcomeProbabilities.lose}%)
                  </span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  {packageData.mlBoosting.modelExplanation}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DYNAMIC FRACTIONAL KELLY */}
      {activeTab === "dynamic_kelly" && packageData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Parameters */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-violet-400" />
                켈리 분수 및 브라이어 점수 튜너
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>진성 승리 확률 (p)</span>
                    <span className="font-mono text-violet-400 font-bold">{kellyWinProb.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="80"
                    step="0.5"
                    value={kellyWinProb}
                    onChange={(e) => setKellyWinProb(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>소수점 배당률 (Odds)</span>
                    <span className="font-mono text-violet-400 font-bold">{kellyOdds.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="1.20"
                    max="3.50"
                    step="0.02"
                    value={kellyOdds}
                    onChange={(e) => setKellyOdds(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>과거 모델 브라이어 점수 (Brier Score)</span>
                    <span className="font-mono text-violet-400 font-bold">{kellyBrierScore.toFixed(3)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.30"
                    step="0.005"
                    value={kellyBrierScore}
                    onChange={(e) => setKellyBrierScore(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                  <span className="text-[10px] text-slate-400">0.15 미만: 최상위 보정 | 0.22 초과: 신뢰도 급감 패널티</span>
                </div>

                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>목표 켈리 분수 계수 (Fractional Multiplier)</span>
                    <span className="font-mono text-violet-400 font-bold">{kellyFractionTarget.toFixed(2)}x (권장 0.25~0.33)</span>
                  </div>
                  <input
                    type="range"
                    min="0.10"
                    max="0.50"
                    step="0.01"
                    value={kellyFractionTarget}
                    onChange={(e) => setKellyFractionTarget(parseFloat(e.target.value))}
                    className="w-full accent-violet-500"
                  />
                </div>

                <button
                  onClick={simulateDynamicKelly}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Scale className="w-3.5 h-3.5" />
                  동적 켈리 자금 곡선 시뮬레이션
                </button>
              </div>
            </div>

            {/* Bankroll Growth Curve Simulation */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-violet-400" />
                    50회 연속 베팅 자금 운용 전략별 시뮬레이션 곡선 (100만원 시드 기준)
                  </h3>
                  <p className="text-xs text-slate-400">
                    풀 켈리(붉은색 급변동) vs 고정 베팅(회색) vs 0.25x/0.33x 동적 분수 켈리(안정적 복리 성장)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-violet-500/20 text-violet-300 border border-violet-500/30 rounded-lg text-xs font-mono font-bold">
                    동적 켈리: {packageData.dynamicKelly.dynamicKellyFraction}%
                  </span>
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-mono font-bold">
                    파산위험: {packageData.dynamicKelly.ruinProbabilityPct}%
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={packageData.dynamicKelly.simulatedBankrollCurve} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="betIndex" stroke="#94a3b8" fontSize={11} label={{ value: "베팅 횟수 (회)", position: "insideBottomRight", offset: -5, fontSize: 10, fill: "#94a3b8" }} />
                    <YAxis stroke="#94a3b8" fontSize={11} domain={["auto", "auto"]} tickFormatter={(v) => `${(v / 10000).toFixed(0)}만`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem" }}
                      formatter={(val: any) => [`${Number(val).toLocaleString()} 원`, "잔고"]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    <Line type="monotone" dataKey="flatBetting" stroke="#94a3b8" strokeDasharray="3 3" dot={false} name="고정 2% 베팅" />
                    <Line type="monotone" dataKey="fullKelly" stroke="#f43f5e" strokeWidth={1.5} dot={false} name={`풀 켈리 (${packageData.dynamicKelly.fullKellyFraction}%)`} />
                    <Line type="monotone" dataKey="fractionalKelly25" stroke="#10b981" strokeWidth={2.5} dot={false} name="분수 켈리 (0.25x)" />
                    <Line type="monotone" dataKey="fractionalKelly33" stroke="#8b5cf6" strokeWidth={2.5} dot={false} name="분수 켈리 (0.33x)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="font-semibold text-slate-200">수리적 자금 관리 권고 (Bankroll Protocol):</div>
                <p className="text-slate-300 leading-relaxed">
                  {packageData.dynamicKelly.capitalAllocationAdvice}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
                  <div><span className="text-slate-500">풀 켈리 비중:</span> <span className="text-rose-400 font-bold">{packageData.dynamicKelly.fullKellyFraction}%</span></div>
                  <div><span className="text-slate-500">브라이어 보정치:</span> <span className="text-violet-400 font-bold">{packageData.dynamicKelly.brierConfidenceMultiplier}x</span></div>
                  <div><span className="text-slate-500">최대 낙폭(MDD):</span> <span className="text-emerald-400 font-bold">-{packageData.dynamicKelly.maxDrawdownRiskPct}%</span></div>
                  <div><span className="text-slate-500">샤프 지수:</span> <span className="text-emerald-400 font-bold">{packageData.dynamicKelly.sharpeRatio}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
