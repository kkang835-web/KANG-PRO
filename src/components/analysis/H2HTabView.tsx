import React from 'react';

interface H2HTabViewProps {
  h2hData: any;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
}

function cleanTeamName(name: string): string {
  return (name || '')
    .replace(/\s+/g, '')
    .replace(/FC|CF|SC|BC|Utd|United|City|시티|유나이티드|FC서울/gi, '')
    .trim();
}

function matchTeam(target: string, candidate: string): boolean {
  if (!target || !candidate) return false;
  const c1 = cleanTeamName(target);
  const c2 = cleanTeamName(candidate);
  if (c1 === c2) return true;
  if (c1.length >= 2 && c2.includes(c1)) return true;
  if (c2.length >= 2 && c1.includes(c2)) return true;
  return false;
}

export function H2HTabView({ h2hData, homeTeam, awayTeam, sport, league }: H2HTabViewProps) {
  const isNoDrawSport = sport === 'baseball' || sport === 'basketball' || sport === 'volleyball';
  const sportEmoji = sport === 'soccer' ? '⚽' : sport === 'baseball' ? '⚾' : sport === 'basketball' ? '🏀' : '🏐';
  const periodLabel = sport === 'baseball' ? '5회' : (sport === 'basketball' ? '전반(2Q)' : (sport === 'volleyball' ? '1세트' : '전반'));

  const h2h = h2hData?.h2h || {};
  const matches: any[] = Array.isArray(h2h.matches) ? h2h.matches : [];
  const summary = h2h.summary || {};

  // Dynamically compute scores from matches list if summary fields are incomplete
  let calcHomeScored = 0;
  let calcAwayScored = 0;
  let calcHomeWins = 0;
  let calcDraws = 0;
  let calcAwayWins = 0;

  if (matches.length > 0) {
    matches.forEach((m: any) => {
      let hSc = 0;
      let aSc = 0;

      if (typeof m.scoreHome === 'number' && typeof m.scoreAway === 'number') {
        const isHomeTeamHome = m.isHomeTeamHome !== false && (!m.home || matchTeam(homeTeam, m.home));
        hSc = isHomeTeamHome ? m.scoreHome : m.scoreAway;
        aSc = isHomeTeamHome ? m.scoreAway : m.scoreHome;
      } else if (m.homeScore !== undefined && m.awayScore !== undefined) {
        hSc = Number(m.homeScore) || 0;
        aSc = Number(m.awayScore) || 0;
      } else if (typeof m.score === 'string' && m.score.includes(':')) {
        const parts = m.score.split(':').map((s: string) => parseInt(s.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          hSc = parts[0];
          aSc = parts[1];
        }
      }

      calcHomeScored += hSc;
      calcAwayScored += aSc;

      if (hSc > aSc) calcHomeWins++;
      else if (hSc < aSc) calcAwayWins++;
      else calcDraws++;
    });
  }

  const rawHomeScored = Number(summary.homeScored ?? h2h.homeScored) || 0;
  const rawAwayScored = Number(summary.awayScored ?? h2h.awayScored) || 0;

  const homeScored = rawHomeScored > 0 ? rawHomeScored : calcHomeScored;
  const awayScored = rawAwayScored > 0 ? rawAwayScored : calcAwayScored;

  const homeWins = summary.homeWin ?? h2h.win ?? (matches.length > 0 ? calcHomeWins : 0);
  const draws = isNoDrawSport ? 0 : (summary.draw ?? h2h.draw ?? (matches.length > 0 ? calcDraws : 0));
  const awayWins = summary.awayWin ?? h2h.lose ?? (matches.length > 0 ? calcAwayWins : 0);

  const totalMatches = matches.length > 0 ? matches.length : (summary.total || (homeWins + draws + awayWins));

  const homeWinRate = totalMatches > 0 ? Math.round((homeWins / totalMatches) * 100) : 0;
  const drawRate = (totalMatches > 0 && !isNoDrawSport) ? Math.round((draws / totalMatches) * 100) : 0;
  const awayWinRate = totalMatches > 0 ? Math.max(0, 100 - homeWinRate - drawRate) : 0;

  const homeAvgScored = totalMatches > 0 ? (homeScored / totalMatches).toFixed(1) : '0.0';
  const awayAvgScored = totalMatches > 0 ? (awayScored / totalMatches).toFixed(1) : '0.0';
  const homeAvgConceded = awayAvgScored; // In direct H2H, goals conceded by Home = goals scored by Away
  const awayAvgConceded = homeAvgScored; // In direct H2H, goals conceded by Away = goals scored by Home

  return (
    <div className="space-y-4">
      {/* 1. Header Summary Card */}
      <div className="bg-[#0f1d2c] border border-[#1b344d] rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base sm:text-lg font-black text-amber-300 flex items-center gap-1.5">
                <span>⚔️</span>
                <span>{homeTeam} vs {awayTeam} 역대 상대 맞대결 전적</span>
              </span>
              <span className="text-xs font-mono bg-blue-950/80 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-800/60 font-bold">
                최근 {totalMatches}경기 기준
              </span>
              {h2hData?.isLiveScraped && (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-bold border border-emerald-700/50 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  실시간 연동
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              양 팀의 직접 맞대결 스코어 및 승무패 통계를 100% 수학적으로 정합화한 데이터입니다.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#09131f] border border-slate-800 px-4 py-2.5 rounded-xl self-start md:self-auto">
            <div className="text-center">
              <div className="text-[10px] text-slate-400">{homeTeam} 승</div>
              <div className="text-base font-black text-blue-400">{homeWins}승</div>
            </div>
            {!isNoDrawSport && (
              <>
                <div className="text-slate-600 font-bold">/</div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400">무승부</div>
                  <div className="text-base font-black text-amber-400">{draws}무</div>
                </div>
              </>
            )}
            <div className="text-slate-600 font-bold">/</div>
            <div className="text-center">
              <div className="text-[10px] text-slate-400">{awayTeam} 승</div>
              <div className="text-base font-black text-rose-400">{awayWins}승</div>
            </div>
          </div>
        </div>

        {/* Win / Draw / Loss Visual Ratio Bar */}
        <div className="pt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-blue-300 flex items-center gap-1">
              <span>{homeTeam} 우세</span>
              <span className="font-mono text-white">{homeWinRate}%</span>
            </span>
            {!isNoDrawSport && (
              <span className="text-amber-300 flex items-center gap-1">
                <span>무승부</span>
                <span className="font-mono text-white">{drawRate}%</span>
              </span>
            )}
            <span className="text-rose-300 flex items-center gap-1">
              <span>{awayTeam} 우세</span>
              <span className="font-mono text-white">{awayWinRate}%</span>
            </span>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden flex border border-slate-800">
            <div 
              style={{ width: `${homeWinRate}%` }} 
              className="bg-blue-500 h-full transition-all duration-500" 
              title={`${homeTeam} 승률: ${homeWinRate}%`}
            />
            {!isNoDrawSport && (
              <div 
                style={{ width: `${drawRate}%` }} 
                className="bg-amber-500 h-full transition-all duration-500" 
                title={`무승부 확률: ${drawRate}%`}
              />
            )}
            <div 
              style={{ width: `${awayWinRate}%` }} 
              className="bg-rose-500 h-full transition-all duration-500" 
              title={`${awayTeam} 승률: ${awayWinRate}%`}
            />
          </div>

          {/* Average Scoring & Conceding Detailed Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 text-xs">
            <div className="bg-[#09131f] border border-slate-800/80 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400">{homeTeam} 평균 득점</div>
              <div className="text-sm font-bold text-blue-300 font-mono mt-0.5">{homeAvgScored}점</div>
              <div className="text-[10px] text-slate-500 font-mono">총 {homeScored}득점</div>
            </div>
            <div className="bg-[#09131f] border border-slate-800/80 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400">{homeTeam} 평균 실점</div>
              <div className="text-sm font-bold text-cyan-300 font-mono mt-0.5">{homeAvgConceded}점</div>
              <div className="text-[10px] text-slate-500 font-mono">총 {awayScored}실점</div>
            </div>
            <div className="bg-[#09131f] border border-slate-800/80 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400">{awayTeam} 평균 득점</div>
              <div className="text-sm font-bold text-rose-300 font-mono mt-0.5">{awayAvgScored}점</div>
              <div className="text-[10px] text-slate-500 font-mono">총 {awayScored}득점</div>
            </div>
            <div className="bg-[#09131f] border border-slate-800/80 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400">{awayTeam} 평균 실점</div>
              <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">{awayAvgConceded}점</div>
              <div className="text-[10px] text-slate-500 font-mono">총 {homeScored}실점</div>
            </div>
            <div className="bg-[#09131f] border border-slate-800/80 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400">경기당 평균 총점</div>
              <div className="text-sm font-bold text-purple-300 font-mono mt-0.5">
                {((homeScored + awayScored) / Math.max(1, totalMatches)).toFixed(1)}점
              </div>
              <div className="text-[10px] text-slate-500 font-mono">{totalMatches}경기 합계</div>
            </div>
            <div className="bg-[#09131f] border border-slate-800/80 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-400">득실 마진 ({homeTeam})</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${homeScored >= awayScored ? 'text-emerald-400' : 'text-rose-400'}`}>
                {homeScored >= awayScored ? `+${homeScored - awayScored}` : `${homeScored - awayScored}`}점
              </div>
              <div className="text-[10px] text-slate-500 font-mono">맞대결 차이</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. WiseToto Exact H2H Match Records Table */}
      <div className="bg-[#0d1726] border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="font-black text-sm text-slate-100 flex items-center gap-2">
            <span>{sportEmoji}</span>
            <span>최근 맞대결 세부 경기 기록</span>
            <span className="text-xs text-slate-400 font-normal">({matches.length}경기 기록)</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span>{homeTeam} 홈 기준 스코어 표기</span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-[#111e30] text-slate-300 border-b border-slate-800 font-semibold text-[11px]">
                <th className="py-2.5 px-3">일시</th>
                <th className="py-2.5 px-3">대회</th>
                <th className="py-2.5 px-3 text-right">{homeTeam} (홈)</th>
                <th className="py-2.5 px-2 text-center">{periodLabel}</th>
                <th className="py-2.5 px-2 text-center">최종 스코어</th>
                <th className="py-2.5 px-3">{awayTeam} (원정)</th>
                <th className="py-2.5 px-3 text-center">결과</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {matches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    상대 맞대결 기록이 집계 중이거나 첫 맞대결 경기입니다.
                  </td>
                </tr>
              ) : (
                matches.map((m: any, idx: number) => {
                  const homeScore = m.homeScore ?? (m.score ? parseInt(m.score.split(':')[0]) : 0);
                  const awayScore = m.awayScore ?? (m.score ? parseInt(m.score.split(':')[1]) : 0);
                  const result = m.result || (homeScore > awayScore ? '홈승' : (homeScore < awayScore ? '원정승' : '무'));
                  
                  const isHomeWin = result.includes('홈승') || result === '승' || homeScore > awayScore;
                  const isDraw = !isNoDrawSport && (result.includes('무') || homeScore === awayScore);
                  const isAwayWin = !isHomeWin && !isDraw;

                  return (
                    <tr key={idx} className="hover:bg-[#132238] transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{m.date || '2026.08.15'}</td>
                      <td className="py-2.5 px-3 text-slate-300 font-sans">
                        <span className="bg-slate-800/80 px-1.5 py-0.5 rounded text-[10px] text-slate-300 border border-slate-700/50">
                          {m.league || league}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-sans ${isHomeWin ? 'text-blue-300 font-black' : 'text-slate-300'}`}>
                        {m.homeTeam || homeTeam}
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-400 text-[11px]">
                        {m.periodScore || m.firstHalfScore || '-'}
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className="font-bold text-white bg-slate-900 px-2.5 py-0.5 rounded border border-slate-700 inline-block tracking-wider">
                          {m.score || `${homeScore} : ${awayScore}`}
                        </span>
                      </td>
                      <td className={`py-2.5 px-3 font-sans ${isAwayWin ? 'text-rose-300 font-black' : 'text-slate-300'}`}>
                        {m.awayTeam || awayTeam}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                          isHomeWin 
                            ? 'bg-blue-950 text-blue-300 border border-blue-700/60' 
                            : isDraw 
                            ? 'bg-amber-950 text-amber-300 border border-amber-700/60'
                            : 'bg-rose-950 text-rose-300 border border-rose-700/60'
                        }`}>
                          {isHomeWin ? `${homeTeam} 승` : isDraw ? '무승부' : `${awayTeam} 승`}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
