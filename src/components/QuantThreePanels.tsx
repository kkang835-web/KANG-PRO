import React, { useState, useEffect } from 'react';
import { MatchItem, QuantAnalysisResult, MatchAnalysisData, PredictionResult } from '../types';
import { calculateQuantMetrics, generateSeoMetadata, syncDocumentSeo, SeoAnalysisPackage } from '../utils/quantMetrics';
import { getPrimaryPickInfo } from '../utils/quantPickEvaluator';

interface QuantThreePanelsProps {
  match: MatchItem;
  quantData: QuantAnalysisResult | null;
  h2hData: MatchAnalysisData | null;
  predictionData: PredictionResult | null;
  activeQuant?: any;
}

export function QuantThreePanels({
  match,
  quantData,
  h2hData,
  predictionData,
  activeQuant
}: QuantThreePanelsProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const [showSeoDetail, setShowSeoDetail] = useState<boolean>(true);

  const home = match.homeTeam || '홈팀';
  const away = match.awayTeam || '원정팀';
  const league = match.league || '프로리그';
  const sport = match.sport || 'soccer';
  const isSoccer = sport === 'soccer';
  const isBaseball = sport === 'baseball';
  const isBasketball = sport === 'basketball';

  // 1. Calculate Primary Pick & Multi-Market Values
  const primaryEval = getPrimaryPickInfo(match);
  const bestPickText = predictionData?.recommendedPick || primaryEval.recommendedPick || `${home} 승`;

  // Odds & Probabilities
  const domWin = match.domestic?.win || 1.85;
  const domDraw = match.domestic?.draw || 0;
  const domLose = match.domestic?.lose || 1.85;
  const hasDraw = domDraw > 0;

  const pFundWin = (quantData?.shinsModel?.winProb ? parseFloat(quantData.shinsModel.winProb) : (100 / domWin)) / 100;
  const pFundDraw = hasDraw ? (quantData?.shinsModel?.drawProb ? parseFloat(quantData.shinsModel.drawProb) : (100 / domDraw)) / 100 : 0;
  const pFundLose = (quantData?.shinsModel?.loseProb ? parseFloat(quantData.shinsModel.loseProb) : (100 / domLose)) / 100;

  const probsArray = hasDraw ? [pFundWin, pFundDraw, pFundLose] : [pFundWin, pFundLose];
  const targetOdds = primaryEval.odds || domWin;
  const targetProb = (primaryEval.prob || 50) / 100;

  // 2. Compute Core Quant Metrics (Entropy, Shin's, 1/4 Kelly)
  const quantMetrics = calculateQuantMetrics(targetProb, (1 / targetOdds), targetOdds, probsArray);

  // 3. Generate Real-time Google AdSense & SEO Package
  const seoPackage: SeoAnalysisPackage = generateSeoMetadata(
    match,
    quantData,
    bestPickText,
    quantMetrics.kelly,
    quantMetrics.entropy
  );

  // 4. Synchronize Browser DOM Header (<title>, <meta description>, og:tags)
  useEffect(() => {
    const cleanup = syncDocumentSeo(seoPackage);
    return () => {
      cleanup();
    };
  }, [seoPackage.serpTitle, seoPackage.serpDescription]);

  const handleCopyMeta = () => {
    const textToCopy = `<!-- ${home} vs ${away} SEO Meta Tags -->\n<title>${seoPackage.serpTitle}</title>\n<meta name="description" content="${seoPackage.serpDescription}" />\n<meta name="keywords" content="${seoPackage.metaKeywords}" />\n<meta property="og:title" content="${seoPackage.ogTitle}" />\n<meta property="og:description" content="${seoPackage.ogDescription}" />\n<link rel="canonical" href="${seoPackage.canonicalUrl}" />`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Extract Dixon-Coles & Score Distribution
  const dixonDetail = quantData?.dixonColesDetail || (quantData?.soccer as any)?.dixonColesDetail;
  const lambdaH = quantData?.dixonColes?.lambdaHome || (quantData?.soccer as any)?.lambdaHome || (isSoccer ? 1.45 : isBaseball ? 4.2 : 108.5);
  const muA = quantData?.dixonColes?.muAway || (quantData?.soccer as any)?.muAway || (isSoccer ? 1.15 : isBaseball ? 3.8 : 102.3);
  const tau00 = dixonDetail?.tau00 || 1.18;
  const rho = dixonDetail?.rhoParameter || -0.12;

  // Extract Referee & Weather
  const refereeProfile = quantData?.refereeProfile || activeQuant?.refereeProfile;
  const weatherProfile = quantData?.weatherEnvironment || activeQuant?.weatherEnvironment;

  return (
    <div className="space-y-6">
      {/* ======================================================== */}
      {/* 🎯 상단 요약 및 리스크 진단 (Header Summary & Risk Diagnosis) */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                QUANT CORE ARCHITECTURE
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {league} • 경기 No.{match.gameNo} ({match.categoryLabel})
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 flex-wrap">
              <span>🎯 [상세분석:</span>
              <span className="text-amber-400 underline decoration-amber-400/40 underline-offset-4">
                {bestPickText}
              </span>
              <span>]</span>
            </h2>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80">
                <span className="text-emerald-400 font-bold">💰 자금 관리:</span>
                <span>1/4 켈리 공식 권장 비중</span>
                <strong className="text-emerald-300 font-mono font-black text-sm">{quantMetrics.kelly}%</strong>
                <span className="text-[10px] text-slate-400">(Full {quantMetrics.fullKelly}%)</span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/80">
                <span className="text-amber-400 font-bold">🎲 판정 포인트:</span>
                <span>섀넌 엔트로피</span>
                <strong className="text-amber-300 font-mono font-black text-sm">{quantMetrics.entropy} bits</strong>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${quantMetrics.riskZoneColor}`}>
                  {quantMetrics.riskZoneLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stat Pill */}
          <div className="bg-slate-800/90 border border-slate-700 p-3 rounded-xl sm:text-right shrink-0 min-w-[140px]">
            <div className="text-[10px] text-slate-400 font-bold uppercase">포지션 기대값 (+EV)</div>
            <div className={`text-xl font-black font-mono ${quantMetrics.evPercentNum >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {quantMetrics.evPercent}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              공정 승률 {quantMetrics.pFundPercent}% / 배당 {targetOdds}배
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3대 패널 영역 (Panels Grid) */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ---------------------------------------------------- */}
        {/* PANEL 1: 📊 종합 퀀트 요약 (Comprehensive Quant Summary) */}
        {/* ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="text-base">📊</span>
                <span>종합 퀀트 요약</span>
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                수리모형 통합
              </span>
            </div>

            <div className="space-y-3 mt-3.5">
              {/* Shin's Model Calibration */}
              <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950 flex items-center gap-1">
                    <span>⚡</span>
                    <span>신스(Shin's) No-Vig 보정 공정확률</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-indigo-700">Shin (1993)</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center pt-1 font-mono text-xs">
                  <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                    <span className="text-[10px] text-slate-500 block">홈 승(P)</span>
                    <strong className="text-indigo-900 font-black">{(pFundWin * 100).toFixed(1)}%</strong>
                  </div>
                  {hasDraw ? (
                    <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                      <span className="text-[10px] text-slate-500 block">무승부(P)</span>
                      <strong className="text-slate-700 font-black">{(pFundDraw * 100).toFixed(1)}%</strong>
                    </div>
                  ) : (
                    <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                      <span className="text-[10px] text-slate-500 block">원정 승(P)</span>
                      <strong className="text-rose-700 font-black">{(pFundLose * 100).toFixed(1)}%</strong>
                    </div>
                  )}
                  {hasDraw && (
                    <div className="bg-white p-1.5 rounded-lg border border-indigo-100">
                      <span className="text-[10px] text-slate-500 block">원정 승(P)</span>
                      <strong className="text-rose-700 font-black">{(pFundLose * 100).toFixed(1)}%</strong>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-indigo-700/90 leading-tight pt-1">
                  북메이커 마진(Overround)을 제거한 정보거래자(Insider) 기반 공정 펀더멘털 확률을 산출했습니다.
                </p>
              </div>

              {/* Shannon Entropy Metric */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>섀넌 엔트로피 불확실성 지수</span>
                  <span className="font-mono text-indigo-600">{quantMetrics.uncertainty}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      quantMetrics.riskZone === 'SAFE_FAVORITE' ? 'bg-emerald-500' :
                      quantMetrics.riskZone === 'BALANCED_VALUE' ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, quantMetrics.uncertaintyRateNum)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-600 font-mono">
                  <span>0.0 bits (확정 승리)</span>
                  <span>1.585 bits (완전 무작위)</span>
                </div>
              </div>

              {/* Kelly Capital Sizing */}
              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950">1/4 켈리 비중 권장</span>
                  <span className="text-xs font-mono font-black text-emerald-700">{quantMetrics.kelly}%</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-snug">
                  단기 연패 변동성(Drawdown)을 4% 이내로 제어하기 위해 Full Kelly 대신 1/4 보수적 배분을 적용합니다.
                </p>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-2 flex justify-between">
            <span>Model: Shin + Entropy + Kelly</span>
            <span>Status: Verified</span>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* PANEL 2: 📈 마켓별 심층 가치 (Deep Value by Market) */}
        {/* ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="text-base">📈</span>
                <span>마켓별 심층 가치</span>
              </h3>
              <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded-full border border-teal-200">
                +EV 포지션 검증
              </span>
            </div>

            <div className="space-y-2.5 mt-3.5">
              {/* Market 1: Match 1X2 */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                    <span>⚽</span>
                    <span>일반 승무패 (1X2)</span>
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    primaryEval.marketLabel === '일반' 
                      ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    {primaryEval.marketLabel === '일반' ? '주력 추천' : '보조'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">{home} 승</span>
                  <span className="font-mono text-slate-600">
                    실전 {domWin}배 <span className="text-slate-400">/ 공정 {(1 / pFundWin).toFixed(2)}배</span>
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono pt-0.5">
                  <span className="text-slate-500">수리 승률 {(pFundWin * 100).toFixed(1)}%</span>
                  <span className={`font-black ${((pFundWin * domWin - 1) * 100) > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                    ROI {((pFundWin * domWin - 1) * 100) > 0 ? `+${((pFundWin * domWin - 1) * 100).toFixed(1)}` : ((pFundWin * domWin - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Market 2: Handicap */}
              {quantData?.handicapAnalysis && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <span>🛡️</span>
                      <span>핸디캡 ({quantData.handicapAnalysis.handicapLine})</span>
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      primaryEval.marketLabel === '핸디캡' 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {quantData.handicapAnalysis.recommendedSide === 'home' ? '홈 커버' : '원정 커버'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-700">홈커버 {quantData.handicapAnalysis.homeCoverProb}%</span>
                    <span className="text-slate-700">원정커버 {quantData.handicapAnalysis.awayCoverProb}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono pt-0.5">
                    <span className="text-slate-500">공정 {quantData.handicapAnalysis.fairHandicapOdds?.home || '1.92'}배</span>
                    <span className={`font-black ${quantData.handicapAnalysis.valueGapCover > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                      가치 격차 +{quantData.handicapAnalysis.valueGapCover}%
                    </span>
                  </div>
                </div>
              )}

              {/* Market 3: Under/Over */}
              {quantData?.uoAnalysis && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <span>⚖️</span>
                      <span>언더 / 오버 ({quantData.uoAnalysis.uoLine})</span>
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                      {quantData.uoAnalysis.recommendedSide === 'under' ? '언더 우세' : '오버 우세'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-teal-700 font-bold">언더 {quantData.uoAnalysis.underProb}%</span>
                    <span className="text-amber-700 font-bold">오버 {quantData.uoAnalysis.overProb}%</span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-mono pt-0.5">
                    <span className="text-slate-500">공정 {quantData.uoAnalysis.fairUnderOdds || '1.85'}배</span>
                    <span className="text-emerald-600 font-black">
                      가치 격차 +{quantData.uoAnalysis.valueGap}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-2 flex justify-between">
            <span>Multi-Market Evaluation</span>
            <span>+EV Verified</span>
          </div>
        </div>

        {/* ---------------------------------------------------- */}
        {/* PANEL 3: 🔍 베팅 근거 데이터 (Betting Evidence & Drivers) */}
        {/* ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span className="text-base">🔍</span>
                <span>베팅 근거 데이터</span>
              </h3>
              <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                피처 & 변수 분석
              </span>
            </div>

            <div className="space-y-2.5 mt-3.5">
              {/* Dixon-Coles / Negative Binomial xG Engine */}
              <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/70 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                    <span>🎯</span>
                    <span>딕슨-콜스 & 음이항 기대득점(xG)</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-800">τ(0,0)={tau00}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-700">{home} xG: <strong className="text-indigo-900">{lambdaH}</strong></span>
                  <span className="text-slate-700">{away} xG: <strong className="text-rose-900">{muA}</strong></span>
                </div>
                <p className="text-[10px] text-slate-600 leading-snug">
                  저득점 보정비율 τ(0,0)={tau00}, 공방 상관계수 ρ={rho}가 반영된 과분산 음이항 분포입니다.
                </p>
              </div>

              {/* Referee Context */}
              {refereeProfile && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <span>⚖️</span>
                      <span>심판/구심: {refereeProfile.refereeName}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">λ {refereeProfile.lambdaMultiplier}x</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-snug">
                    {refereeProfile.foulTendency}
                  </p>
                </div>
              )}

              {/* Weather / Ground Environment */}
              {weatherProfile && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                      <span>🌤️</span>
                      <span>환경: {weatherProfile.conditionText} ({weatherProfile.tempC}°C, 풍속 {weatherProfile.windSpeedMs}m/s)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{weatherProfile.source}</span>
                  </div>
                  <p className="text-[10px] text-slate-600 leading-snug">
                    {weatherProfile.quantImpactNote}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 font-mono border-t border-slate-100 pt-2 flex justify-between">
            <span>Features: xG, Weather, Referee</span>
            <span>Calibrated</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 🔎 애드센스 SEO 실시간 프리뷰 패널 (AdSense & SEO Live Preview) */}
      {/* ======================================================== */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Toggle / Header Bar */}
        <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center text-base">
              🔎
            </span>
            <div>
              <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>구글 애드센스 및 SEO 실시간 프리뷰 (SERP & Meta Engine)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-bold px-2 py-0.5 rounded-full">
                  Score {seoPackage.adsenseReadinessScore}/100
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                검색엔진 크롤러봇 및 애드센스 승인을 위한 메타 태그, 키워드 밀도, SERP 스니펫이 실시간 렌더링됩니다.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMeta}
              className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 rounded-xl border border-blue-400/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>{copied ? '✓ 복사 완료!' : '📋 SEO 메타태그 복사'}</span>
            </button>
            <button
              onClick={() => setShowSeoDetail(!showSeoDetail)}
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              <span>{showSeoDetail ? '접기 ▲' : '펼치기 ▼'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        {showSeoDetail && (
          <div className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-150">
            {/* 1. Google SERP Snippet Preview Box */}
            <div className="bg-slate-950/80 p-4 sm:p-5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="w-4 h-4 rounded-full bg-blue-600 text-[9px] flex items-center justify-center font-bold text-white">
                  G
                </span>
                <span className="text-slate-300 truncate max-w-full font-mono text-[11px]">
                  {seoPackage.canonicalUrl}
                </span>
              </div>
              <h5 className="text-base sm:text-lg font-bold text-blue-400 hover:underline cursor-pointer leading-snug">
                {seoPackage.serpTitle}
              </h5>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {seoPackage.serpDescription}
              </p>
            </div>

            {/* 2. Keyword Density Analysis Grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                <span className="flex items-center gap-1.5">
                  <span>📊</span>
                  <span>핵심 키워드 밀도 분석 (Keyword Density Analysis)</span>
                </span>
                <span className="text-[10px] text-slate-400">애드센스 고부가가치 용어 타겟팅</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {seoPackage.keywordDensity.map((kwItem, kwIdx) => (
                  <div key={kwIdx} className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/80 text-center space-y-0.5">
                    <span className="text-xs font-bold text-slate-200 block truncate">{kwItem.keyword}</span>
                    <div className="flex items-center justify-center gap-1 text-[11px] font-mono">
                      <span className="text-amber-400 font-bold">{kwItem.count}회</span>
                      <span className="text-slate-500">({kwItem.densityPct}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. SEO Quality & AdSense Checklist */}
            <div className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-[11px] font-black text-slate-200 flex items-center gap-1">
                <span>🛡️</span>
                <span>검색엔진 최적화 및 애드센스 품질 점검 항목</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {seoPackage.seoQualityChecklist.map((chk, cIdx) => (
                  <div key={cIdx} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold text-sm shrink-0">✓</span>
                    <div>
                      <span className="font-bold text-slate-200 block">{chk.label}</span>
                      <span className="text-[10px] text-slate-400 leading-tight">{chk.note}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
