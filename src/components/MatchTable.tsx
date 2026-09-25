import React, { useState } from 'react';
import { MatchItem, SportCategory } from '../types';
import { resolveRoundByDate, getTodayDateString } from '../utils/calendarRoundResolver';

/**
 * Formats the match type badge cleanly without duplicate numbers
 * (e.g., prevents "H-1.5 -1.5" or "U8.5 8.5")
 */
function formatCategoryBadge(m: MatchItem): string {
  const rawLabel = (m.categoryLabel || '').trim();
  if (!rawLabel || rawLabel === '일반') return '일반';
  if (rawLabel === '승1패' || rawLabel === '승①패' || rawLabel === '승5패') return rawLabel;

  // If categoryLabel already has numbers (e.g. "H-1.5", "H+1.5", "U2.5", "8.5", "U/O 2.5", "핸디 -1.5")
  if (/\d/.test(rawLabel)) {
    // If it starts with 'H' or 'U' or contains Korean, standardize it cleanly
    if (rawLabel.startsWith('H') || rawLabel.includes('핸디')) {
      return rawLabel;
    }
    if (rawLabel.startsWith('U') || rawLabel.startsWith('O') || rawLabel.includes('언더') || rawLabel.includes('오버')) {
      return rawLabel;
    }
    return rawLabel;
  }

  // If categoryLabel is pure text (e.g., "핸디캡", "언더오버", "H", "U") and handicapOrLine exists
  if (m.handicapOrLine !== undefined && m.handicapOrLine !== null) {
    const num = m.handicapOrLine;
    const sign = num > 0 ? `+${num}` : `${num}`;
    if (rawLabel.startsWith('H') || rawLabel.includes('핸디')) {
      return `핸디 ${sign}`;
    }
    if (rawLabel.startsWith('U') || rawLabel.startsWith('O') || rawLabel.includes('언더') || rawLabel.includes('오버')) {
      return `U/O ${num}`;
    }
    return `${rawLabel} ${sign}`;
  }

  return rawLabel;
}

/**
 * Calculates and formats the display score for match table rows.
 * For handicap rows (e.g. H +7.5), applies the handicap value to the base home score (e.g. 57 + 7.5 = 64.5 : 67).
 */
function getDisplayScore(m: MatchItem, allMatches: MatchItem[]): string {
  if (m.status !== '종료') return '-:-';

  let baseHomeScore: number | undefined = undefined;
  let baseAwayScore: number | undefined = undefined;

  const generalMatch = allMatches.find(other => 
    other.homeTeam === m.homeTeam &&
    other.awayTeam === m.awayTeam &&
    other.date === m.date &&
    other.categoryLabel === '일반'
  );

  if (generalMatch) {
    if (generalMatch.score) {
      baseHomeScore = generalMatch.score.home;
      baseAwayScore = generalMatch.score.away;
    } else if (typeof generalMatch.homeScore === 'number' && typeof generalMatch.awayScore === 'number') {
      baseHomeScore = generalMatch.homeScore;
      baseAwayScore = generalMatch.awayScore;
    }
  }

  if (baseHomeScore === undefined || baseAwayScore === undefined) {
    if (m.score) {
      baseHomeScore = m.score.home;
      baseAwayScore = m.score.away;
    } else if (typeof m.homeScore === 'number' && typeof m.awayScore === 'number') {
      baseHomeScore = m.homeScore;
      baseAwayScore = m.awayScore;
    }
  }

  if (baseHomeScore === undefined || baseAwayScore === undefined) {
    return '-:-';
  }

  const isHandicap = m.categoryType === '핸디캡' || 
    (m.categoryLabel && (
      m.categoryLabel.startsWith('H') || 
      m.categoryLabel.includes('핸디') ||
      /^[+-]\d+/.test(m.categoryLabel)
    ));

  if (isHandicap) {
    let line = m.handicapLine ?? m.handicapOrLine;
    if (line === undefined || line === null) {
      const match = (m.categoryLabel || '').match(/([+-]?\d+(?:\.\d+)?)/);
      if (match) line = parseFloat(match[1]);
    }
    const netHdp = line ?? 0;
    const finalHome = Math.round((baseHomeScore + netHdp) * 10) / 10;
    return `${finalHome}:${baseAwayScore}`;
  }

  return `${baseHomeScore}:${baseAwayScore}`;
}

interface MatchTableProps {
  matches: MatchItem[];
  selectedYear: number;
  selectedRound: number;
  protoRoundLimits: Record<number, number>;
  selectedMatch?: MatchItem | null;
  roundMetadata?: {
    roundPeriod?: string;
    totalGames?: number;
    status?: string;
    domesticRefundRate?: string;
    foreignRefundRate?: string;
    fetchedAt?: string;
  };
  isLoading?: boolean;
  onYearChange: (y: number) => void;
  onRoundChange: (r: number) => void;
  onRefresh?: (force?: boolean) => void;
  onSelectMatchForQuant: (match: MatchItem, initialTab?: 'overview' | 'sharp_edge' | 'quant_deep' | 'h2h' | 'quant' | 'ai' | string) => void;
}

export function MatchTable({
  matches,
  selectedYear,
  selectedRound,
  protoRoundLimits,
  selectedMatch,
  roundMetadata,
  isLoading = false,
  onYearChange,
  onRoundChange,
  onRefresh,
  onSelectMatchForQuant
}: MatchTableProps) {
  const [sportFilter, setSportFilter] = useState<SportCategory>('all');

  const maxRoundsForYear = protoRoundLimits[selectedYear] || (selectedYear === 2026 ? 155 : 150);

  // Filter matches by sport category
  const filteredMatches = matches.filter(m => {
    if (sportFilter !== 'all' && m.sport !== sportFilter) return false;
    return true;
  });

  const sortedYears = Object.keys(protoRoundLimits).map(Number).sort((a, b) => a - b);
  const currentYearIdx = sortedYears.indexOf(selectedYear);

  const canGoPrev = selectedRound > 1 || currentYearIdx > 0;
  const canGoNext = selectedRound < maxRoundsForYear || selectedYear === 2026 || (currentYearIdx < sortedYears.length - 1);

  const handlePrevRound = () => {
    if (selectedRound > 1) {
      onRoundChange(selectedRound - 1);
      onRefresh?.(true);
    } else if (currentYearIdx > 0) {
      const prevYear = sortedYears[currentYearIdx - 1];
      const prevYearMaxRound = protoRoundLimits[prevYear] || 100;
      onYearChange(prevYear);
      onRoundChange(prevYearMaxRound);
      onRefresh?.(true);
    }
  };

  const handleNextRound = () => {
    if (selectedRound < maxRoundsForYear || selectedYear === 2026) {
      onRoundChange(selectedRound + 1);
      onRefresh?.(true);
    } else if (currentYearIdx < sortedYears.length - 1) {
      const nextYear = sortedYears[currentYearIdx + 1];
      onYearChange(nextYear);
      onRoundChange(1);
      onRefresh?.(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden text-slate-800">
      
      {/* Table Navigation Header */}
      <div className="bg-slate-900 text-white p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        
        {/* Left: Round Navigator & Date Picker & One-Click Top Picks Viewer */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Round Selector Widget */}
          <div className="flex items-center gap-1 bg-slate-800 rounded-xl p-1 border border-slate-700 shadow-inner">
            <button
              onClick={handlePrevRound}
              disabled={!canGoPrev}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                canGoPrev 
                  ? 'bg-slate-700 hover:bg-blue-600 text-white cursor-pointer shadow-xs' 
                  : 'bg-slate-850 text-slate-500 cursor-not-allowed'
              }`}
              title="이전 회차"
            >
              <span>◀</span>
              <span>이전 회차</span>
            </button>

            {/* Year Select */}
            <div className="flex items-center gap-1 px-2 border-l border-slate-700">
              <select 
                value={selectedYear} 
                onChange={e => {
                  const newYear = Number(e.target.value);
                  onYearChange(newYear);
                  const maxR = protoRoundLimits[newYear] || 100;
                  if (selectedRound > maxR) onRoundChange(maxR);
                  onRefresh?.(true);
                }}
                className="bg-transparent border-0 text-xs font-black text-amber-400 focus:outline-none cursor-pointer py-1"
              >
                {sortedYears.slice().reverse().map(y => (
                  <option key={y} value={y} className="bg-slate-800 text-white">
                    {y}년도 ({protoRoundLimits[y]}회차)
                  </option>
                ))}
              </select>
            </div>

            {/* Round Select */}
            <div className="flex items-center gap-1 px-2 border-l border-slate-700">
              <select 
                value={selectedRound} 
                onChange={e => {
                  onRoundChange(Number(e.target.value));
                  onRefresh?.(true);
                }}
                className="bg-transparent border-0 text-xs font-black text-amber-400 focus:outline-none cursor-pointer py-1"
              >
                {Array.from({ length: maxRoundsForYear }, (_, i) => maxRoundsForYear - i).map(r => (
                  <option key={r} value={r} className="bg-slate-800 text-white">
                    {r}회차
                  </option>
                ))}
              </select>
            </div>

            {/* Next Round Button */}
            <button
              onClick={handleNextRound}
              disabled={!canGoNext}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border-l border-slate-700 ${
                canGoNext 
                  ? 'bg-slate-700 hover:bg-blue-600 text-white cursor-pointer shadow-xs' 
                  : 'bg-slate-850 text-slate-500 cursor-not-allowed'
              }`}
              title="다음 회차로 바로 업데이트 (실시간 재패치)"
            >
              <span>다음 회차</span>
              <span>▶</span>
            </button>
          </div>

          {/* Calendar Date Picker Widget */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 shadow-inner">
            <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
              <span>📅</span>
              <span>캘린더 회차선택:</span>
            </span>
            <input 
              type="date"
              defaultValue={getTodayDateString()}
              onChange={e => {
                const val = e.target.value;
                if (!val) return;
                const roundInfo = resolveRoundByDate(val);
                if (roundInfo.year !== selectedYear) {
                  onYearChange(roundInfo.year);
                }
                onRoundChange(roundInfo.protoRound);
                if (onRefresh) onRefresh(true);
              }}
              className="bg-slate-900 text-amber-400 text-xs font-mono font-black border border-slate-700 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer shadow-xs hover:border-amber-400/50 transition-colors"
              title="캘린더에서 날짜를 클릭하면 해당 날짜가 포함된 프로토 회차로 즉시 이동하여 실시간 경기를 조회합니다."
            />
          </div>

          {/* Match Count Metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="hidden sm:flex items-center text-xs text-slate-400 font-medium">
              총 <span className="text-amber-400 font-bold mx-1">{filteredMatches.length}</span>경기 편성
            </span>
            <button 
              type="button"
              onClick={() => onRefresh?.(true)}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-800 text-emerald-300 hover:text-white border border-emerald-800/60 text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              title="클릭하여 프로토 승부식 경기목록 실시간 새로고침"
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isLoading ? 'animate-ping' : 'animate-pulse'}`}></span>
              <span>{isLoading ? '새로고침 중...' : '실시간 업데이트 🔄'}</span>
            </button>
          </div>
        </div>

        {/* Right: 4 Major Sports Quick Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
          <button 
            onClick={() => setSportFilter('all')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              sportFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            전체 종목
          </button>
          <button 
            onClick={() => setSportFilter('soccer')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              sportFilter === 'soccer' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <span>⚽</span>
            <span>축구</span>
          </button>
          <button 
            onClick={() => setSportFilter('baseball')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              sportFilter === 'baseball' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <span>⚾</span>
            <span>야구</span>
          </button>
          <button 
            onClick={() => setSportFilter('basketball')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              sportFilter === 'basketball' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <span>🏀</span>
            <span>농구</span>
          </button>
          <button 
            onClick={() => setSportFilter('volleyball')} 
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              sportFilter === 'volleyball' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <span>🏐</span>
            <span>배구</span>
          </button>
        </div>
      </div>

      {/* Wisetoto-Style Comparison Summary Bar */}
      <div className="bg-slate-50 px-4 py-3 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-blue-50/80 p-3 rounded-xl border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-blue-900 text-sm">🇰🇷 국내 배당 (Proto 승부식)</span>
            <span className="bg-blue-200 text-blue-900 px-2 py-0.5 rounded text-[10px] font-bold">공식 고시</span>
          </div>
          <div className="text-right">
            <span className="text-gray-500">평균환급률: </span>
            <strong className="text-blue-900 font-mono text-sm">
              {roundMetadata?.domesticRefundRate || '87.90%'}
            </strong>
          </div>
        </div>

        <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-black text-amber-900 text-sm">🌐 해외 배당 (Global Market)</span>
            <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold">Pinnacle / Bet365</span>
          </div>
          <div className="text-right">
            <span className="text-gray-500">평균환급률: </span>
            <strong className="text-amber-900 font-mono text-sm">
              {roundMetadata?.foreignRefundRate || '95.51%'}
            </strong>
          </div>
        </div>
      </div>

      {/* Main Parsed Matches Table */}
      <div className="w-full overflow-x-auto lg:overflow-x-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-gray-200 select-none">
              <th className="p-2.5 text-center w-12">번호</th>
              <th className="p-2.5 w-24 text-center">일시</th>
              <th className="p-2.5 w-20">리그</th>
              <th className="p-2.5 w-14 text-center">유형</th>
              <th className="p-2.5 text-center">홈팀 vs 원정팀 (결과 스코어)</th>
              <th className="p-2.5 text-center w-36 bg-blue-50/80 text-blue-950 border-l border-blue-200">
                국내 배당 [승·무·패]
              </th>
              <th className="p-2.5 text-center w-36 bg-amber-50/80 text-amber-950 border-l border-amber-200">
                해외 배당 [승·무·패]
              </th>
              <th className="p-2.5 text-center w-16">상태</th>
              <th className="p-2.5 text-center w-20">상세분석</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-gray-500 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>{selectedYear}년도 {selectedRound}회차 실시간 경기 데이터를 패치 중입니다...</span>
                  </div>
                </td>
              </tr>
            ) : filteredMatches.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-gray-500 font-medium">
                  해당 조건의 편성 경기가 없습니다.
                </td>
              </tr>
            ) : (
              filteredMatches.map((m, idx) => {
                const isFinished = m.status === '종료';
                const isWinHit = isFinished && m.hitOutcome === 'win';
                const isDrawHit = isFinished && m.hitOutcome === 'draw';
                const isLoseHit = isFinished && m.hitOutcome === 'lose';
                const isSelected = selectedMatch && (selectedMatch.gameNo === m.gameNo && selectedMatch.categoryLabel === m.categoryLabel);

                // Show 상세분석 button only for the main '일반' row of each match group
                const isGeneralRow = m.categoryLabel === '일반';
                const isFirstInGroup = idx === 0 || (
                  filteredMatches[idx - 1].homeTeam !== m.homeTeam ||
                  filteredMatches[idx - 1].awayTeam !== m.awayTeam
                );
                const groupHasGeneral = filteredMatches.some(
                  other => other.homeTeam === m.homeTeam && other.awayTeam === m.awayTeam && other.date === m.date && other.categoryLabel === '일반'
                );
                const showAnalysisButton = isGeneralRow || (isFirstInGroup && !groupHasGeneral);

                return (
                  <tr 
                    key={idx} 
                    onClick={() => onSelectMatchForQuant(m, 'overview')}
                    className={`transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50/90 ring-1 ring-blue-500/80 shadow-xs' 
                        : 'hover:bg-slate-50/90'
                    }`}
                  >
                    {/* Game No */}
                    <td className="p-2.5 text-center font-mono font-bold text-gray-600">
                      {m.gameNo}
                    </td>

                    {/* Date */}
                    <td className="p-2.5 text-center text-gray-500 font-mono text-[11px] whitespace-nowrap">
                      {m.date}
                    </td>

                    {/* League */}
                    <td className="p-2.5 font-medium text-gray-700 truncate max-w-[110px]" title={m.league}>
                      <span className="mr-1">
                        {m.sport === 'soccer' ? '⚽' : m.sport === 'baseball' ? '⚾' : m.sport === 'basketball' ? '🏀' : m.sport === 'volleyball' ? '🏐' : '🏆'}
                      </span>
                      {m.league}
                    </td>

                    {/* Type Badge */}
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        m.categoryLabel === '일반'
                          ? 'bg-blue-100 text-blue-800'
                          : m.categoryLabel === '승1패' || m.categoryLabel === '승①패'
                          ? 'bg-indigo-100 text-indigo-800'
                          : m.categoryLabel?.startsWith('H')
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {formatCategoryBadge(m)}
                      </span>
                    </td>

                    {/* Teams & Finished Score */}
                    <td className="p-2.5">
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 max-w-[280px] mx-auto w-full">
                        <div className={`font-bold truncate text-right text-xs ${isWinHit ? 'text-blue-700 font-black' : 'text-gray-800'}`} title={m.homeTeam}>
                          {m.homeTeam || '홈팀'}
                        </div>

                        {/* Score or VS Badge */}
                        <div className="w-[54px] flex items-center justify-center shrink-0">
                          <div className="w-full py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs font-black text-center border border-slate-200 whitespace-nowrap">
                            {isFinished ? (
                              <span className="text-amber-600 font-bold">
                                {getDisplayScore(m, filteredMatches)}
                              </span>
                            ) : (
                              <span className="text-gray-400 font-bold text-[10px]">VS</span>
                            )}
                          </div>
                        </div>

                        <div className={`font-bold truncate text-left text-xs ${isLoseHit ? 'text-blue-700 font-black' : 'text-gray-800'}`} title={m.awayTeam}>
                          {m.awayTeam || '원정팀'}
                        </div>
                      </div>
                    </td>

                    {/* Domestic Odds [Win / Draw / Lose] */}
                    <td className="p-2 text-center border-l border-blue-100 bg-blue-50/20">
                      <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
                        <span className={`py-0.5 rounded ${isWinHit ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-gray-700'}`}>
                          {m.domestic?.win || '-'}
                        </span>
                        <span className={`py-0.5 rounded ${isDrawHit ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-gray-400'}`}>
                          {m.domestic?.draw ? m.domestic.draw : '-'}
                        </span>
                        <span className={`py-0.5 rounded ${isLoseHit ? 'bg-blue-600 text-white font-bold shadow-xs' : 'text-gray-700'}`}>
                          {m.domestic?.lose || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Foreign Odds [Win / Draw / Lose] */}
                    <td className="p-2 text-center border-l border-amber-100 bg-amber-50/20">
                      <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
                        <span className="py-0.5 text-gray-700">
                          {m.foreign?.win || '-'}
                        </span>
                        <span className="py-0.5 text-gray-400">
                          {m.foreign?.draw ? m.foreign.draw : '-'}
                        </span>
                        <span className="py-0.5 text-gray-700">
                          {m.foreign?.lose || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        isFinished ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-800 animate-pulse'
                      }`}>
                        {m.status || '대기'}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="p-2.5 text-center whitespace-nowrap">
                      {showAnalysisButton ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectMatchForQuant(m, 'overview');
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                        >
                          <span>🎯</span>
                          <span>상세분석</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 font-bold">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
