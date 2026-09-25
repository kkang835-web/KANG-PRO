import React, { useState, useMemo } from 'react';
import { MatchItem } from '../types';
import { getPrimaryPickInfo, PrimaryPickInfo } from '../utils/quantPickEvaluator';

interface TopPicksViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchItem[];
  selectedYear: number;
  selectedRound: number;
  onSelectMatchForQuant: (match: MatchItem, initialTab?: 'overview' | 'h2h' | 'quant' | 'ai') => void;
}

export function TopPicksViewerModal({
  isOpen,
  onClose,
  matches,
  selectedYear,
  selectedRound,
  onSelectMatchForQuant
}: TopPicksViewerModalProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'highProb' | 'lowEntropy' | 'plusEv'>('all');

  // Process and rank all matches in the round
  const rankedMatches = useMemo(() => {
    const list = matches.map((m, idx) => {
      const primary = getPrimaryPickInfo(m);
      
      // Calculate Shannon Entropy for the match domestic odds
      const domWin = m.domestic?.win || 1.8;
      const domDraw = m.domestic?.draw || 0;
      const domLose = m.domestic?.lose || 1.8;

      const pWin = 1 / domWin;
      const pDraw = domDraw > 0 ? 1 / domDraw : 0;
      const pLose = 1 / domLose;
      const sumP = pWin + pDraw + pLose;

      const normPWin = pWin / sumP;
      const normPDraw = pDraw / sumP;
      const normPLose = pLose / sumP;

      const calcEnt = (p: number) => (p > 0 ? -p * Math.log2(p) : 0);
      const entropy = Math.round((calcEnt(normPWin) + calcEnt(normPDraw) + calcEnt(normPLose)) * 1000) / 1000;

      // Composite Rank Score: Higher is better
      // Lower entropy = better (+), Higher prob = better (+), Higher ROI = better (+)
      const rankScore = (primary.prob * 1.8) + ((1.585 - entropy) * 45) + (primary.expectedRoi * 1.2);

      return {
        match: m,
        primary,
        entropy,
        rankScore
      };
    });

    // Sort by rankScore descending
    list.sort((a, b) => b.rankScore - a.rankScore);

    return list;
  }, [matches]);

  // Filter ranked list
  const filteredRanked = useMemo(() => {
    return rankedMatches.filter(item => {
      if (item.primary.isAllPass) return false; // Exclude ALL PASS matches from top pick viewer
      if (filterMode === 'highProb' && item.primary.prob < 55.0) return false;
      if (filterMode === 'lowEntropy' && item.entropy > 1.20) return false;
      if (filterMode === 'plusEv' && !item.primary.isPlusEV) return false;
      return true;
    });
  }, [rankedMatches, filterMode]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-5 animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 px-5 py-4 border-b border-indigo-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg ring-2 ring-amber-300/50">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight">
                  {selectedYear}년도 {selectedRound}회차 원클릭 TOP 픽 뷰어
                </h2>
                <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide">
                  최저 엔트로피 &amp; 최고확률 TOP 픽
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                전체 {matches.length}경기 중 수리 신스 모형 &amp; 엔트로피(불확실성) 최소화 기준으로 정렬된 TOP 픽입니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer font-bold text-lg"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* Quick Filter Segment */}
        <div className="bg-slate-950/70 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👑 TOP 엄선 픽 ({rankedMatches.filter(r => !r.primary.isAllPass).length})
            </button>
            <button
              onClick={() => setFilterMode('highProb')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'highProb'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎯 고확률 픽 (&ge;55%)
            </button>
            <button
              onClick={() => setFilterMode('lowEntropy')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'lowEntropy'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🛡️ 최저 불확실성 (H&le;1.20)
            </button>
            <button
              onClick={() => setFilterMode('plusEv')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                filterMode === 'plusEv'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔥 +EV 가치 픽
            </button>
          </div>

          <span className="text-[11px] text-amber-300 font-medium">
            💡 카드를 클릭하면 해당 경기의 3대 마켓 심층 수리 퀀트 모달이 바로 열립니다.
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-3 custom-scrollbar flex-1">
          {filteredRanked.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-medium">
              선택한 조건에 해당하는 TOP 픽 경기가 없습니다.
            </div>
          ) : (
            filteredRanked.map((item, index) => {
              const m = item.match;
              const p = item.primary;
              const rankNum = index + 1;

              return (
                <div
                  key={`${m.gameNo}_${m.categoryLabel}_${index}`}
                  onClick={() => {
                    onClose();
                    onSelectMatchForQuant(m, 'overview');
                  }}
                  className="bg-slate-850 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-500/50 rounded-xl p-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-xl group relative overflow-hidden"
                >
                  {/* Rank Ribbon */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                        rankNum === 1
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 shadow-xs'
                          : rankNum === 2
                          ? 'bg-slate-300 text-slate-950 font-bold'
                          : rankNum === 3
                          ? 'bg-amber-700/60 text-amber-200 border border-amber-500/40'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {rankNum}
                      </span>

                      <span className="text-xs font-mono font-bold text-amber-400">
                        No. {m.gameNo}
                      </span>
                      <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {m.league}
                      </span>
                      <span className="text-xs text-slate-400">
                        {m.date}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        엔트로피: <strong className="text-emerald-400 font-mono">{item.entropy} bits</strong>
                      </span>
                      <button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-lg transition-all group-hover:scale-105 shadow-xs">
                        상세 퀀트 분석 ▶
                      </button>
                    </div>
                  </div>

                  {/* Main Match & Pick Banner */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    
                    {/* Teams Info */}
                    <div className="md:col-span-5 flex items-center justify-between bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">{m.homeTeam || '홈팀'}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-400 px-2">
                        {m.status === '종료' ? (
                          <span className="text-amber-400 font-mono font-black text-xs">
                            {m.score ? `${m.score.home} : ${m.score.away}` : (m.homeScore !== undefined && m.awayScore !== undefined ? `${m.homeScore} : ${m.awayScore}` : 'VS')}
                          </span>
                        ) : (
                          'VS'
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-sm">{m.awayTeam || '원정팀'}</span>
                      </div>
                    </div>

                    {/* Primary Pick Banner */}
                    <div className="md:col-span-7 bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 p-3 rounded-xl border border-amber-500/50 flex items-center justify-between gap-2 shadow-inner">
                      <div>
                        <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider mb-0.5">
                          👑 1순위 TOP 픽
                        </div>
                        <div className="text-base font-black text-white tracking-tight flex items-center gap-2">
                          <span>{p.recommendedPick}</span>
                          <span className="bg-amber-500 text-slate-950 text-xs font-mono font-black px-2 py-0.5 rounded">
                            {p.odds}배
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-400">
                          적중확률 {p.prob}%
                        </div>
                        <div className="text-[11px] font-mono font-bold text-amber-300">
                          예상 ROI: {p.expectedRoi >= 0 ? `+${p.expectedRoi}%` : `${p.expectedRoi}%`}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>* 100% 신스 모형(Shin's Model) 공정 확률 및 엔트로피 가치 기반 정렬</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
