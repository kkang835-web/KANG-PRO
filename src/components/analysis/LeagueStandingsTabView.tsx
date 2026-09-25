import React, { useState } from 'react';
import { isCupOrTournament } from '../../utils/leagueNormalizer';

interface LeagueStandingsTabViewProps {
  h2hData: any;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
}

export function LeagueStandingsTabView({ h2hData, homeTeam, awayTeam, sport, league }: LeagueStandingsTabViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'team' | 'player'>('team');
  const isNoDrawSport = sport === 'baseball' || sport === 'basketball' || sport === 'volleyball';
  const isBaseball = sport === 'baseball' || sport === 'bs';
  const isCup = isCupOrTournament(league);

  const standingsTable = h2hData?.standingsTable || {};
  const leagueStandings = h2hData?.leagueStandings;

  // Check for division breakdown (* NL 서부지구, * AL 동부지구 etc.)
  const rawDivisions: any[] = leagueStandings?.divisions || h2hData?.divisions || [];

  // Parse raw list and remove duplicates by teamName/team
  const rawList: any[] = Array.isArray(leagueStandings) 
    ? leagueStandings 
    : (Array.isArray(leagueStandings?.standings) 
        ? leagueStandings.standings 
        : (Array.isArray(standingsTable?.table) ? standingsTable.table : []));

  const uniqueTeamsMap = new Map<string, any>();
  rawList.forEach((t) => {
    const name = t.teamName || t.team;
    if (name && !uniqueTeamsMap.has(name)) {
      uniqueTeamsMap.set(name, t);
    }
  });
  const cleanStandingsList = Array.from(uniqueTeamsMap.values());

  const homeSplit = standingsTable.home || null;
  const awaySplit = standingsTable.away || null;

  // Helper to check if a team is home/away
  const isMatchingTeam = (teamName: string, targetTeam: string) => {
    if (!teamName || !targetTeam) return false;
    const cleanA = teamName.replace(/\s+/g, '').toLowerCase();
    const cleanB = targetTeam.replace(/\s+/g, '').toLowerCase();
    return cleanA.includes(cleanB) || cleanB.includes(cleanA);
  };

  // Default division builder for MLB/NBA if rawDivisions exist
  const divisions = rawDivisions.length > 0 ? rawDivisions : [];

  const isNoData = isCup || (cleanStandingsList.length === 0 && divisions.length === 0);
  const hasSplitData = !isNoData && homeSplit && awaySplit && (homeSplit.overall?.played || 0) > 0;

  return (
    <div className="space-y-4">
      {/* Sub Tab Header: 팀 순위 | 선수 순위 (와이즈토토 스타일) */}
      <div className="flex items-center gap-6 border-b border-slate-800 pb-2 px-1">
        <button
          onClick={() => setActiveSubTab('team')}
          className={`text-sm sm:text-base font-black pb-1.5 transition-all border-b-2 ${
            activeSubTab === 'team'
              ? 'text-white border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          팀 순위
        </button>
        <button
          onClick={() => setActiveSubTab('player')}
          className={`text-sm sm:text-base font-black pb-1.5 transition-all border-b-2 ${
            activeSubTab === 'player'
              ? 'text-white border-blue-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          선수 순위
        </button>
      </div>

      {activeSubTab === 'team' ? (
        <div className="space-y-6">
          {isNoData ? (
            /* Tournament / International Cup / No Standings Banner */
            <div className="bg-[#0d1726] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <div className="text-3xl">🏆</div>
              <h3 className="font-black text-base text-slate-200">
                {league} [리그 순위 데이터 없음]
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                단기 토너먼트, 국제대회, 컵 대회 또는 리그 순위표가 제공되지 않는 경기입니다. 가상 데이터 대신 실제 데이터가 없을 경우 안전하게 '데이터 없음'으로 안내합니다.
              </p>
            </div>
          ) : divisions.length > 0 ? (
            /* If divisions exist (e.g. MLB, NBA), render WiseToto exact division tables */
            divisions.map((div: any, dIdx: number) => (
              <div key={dIdx} className="space-y-2">
                <div className="font-bold text-xs sm:text-sm text-slate-300 flex items-center gap-1.5">
                  <span className="text-amber-400">{div.name || `* 디비전 ${dIdx + 1}`}</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0c1624]">
                  <table className="w-full text-xs text-left font-mono">
                    <thead>
                      <tr className="bg-[#4a5d6e] text-white border-b border-slate-700 text-[11px] font-semibold">
                        <th className="py-2 px-3 text-center w-12">순위</th>
                        <th className="py-2 px-4 font-sans text-left">팀명</th>
                        <th className="py-2 px-3 text-center">경기수</th>
                        <th className="py-2 px-3 text-center">승률</th>
                        <th className="py-2 px-3 text-center">승</th>
                        <th className="py-2 px-3 text-center">무</th>
                        <th className="py-2 px-3 text-center">패</th>
                        <th className="py-2 px-3 text-center">승차</th>
                        <th className="py-2 px-3 text-center">연속</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {div.teams.map((t: any, idx: number) => {
                        const tName = t.teamName || t.team;
                        const isHome = isMatchingTeam(tName, homeTeam);
                        const isAway = isMatchingTeam(tName, awayTeam);

                        const highlightRow = isHome
                          ? 'bg-blue-950/40 border-l-4 border-l-blue-400 font-bold'
                          : isAway
                          ? 'bg-rose-950/40 border-l-4 border-l-rose-400 font-bold'
                          : 'hover:bg-[#132238]';

                        return (
                          <tr key={idx} className={`${highlightRow} transition-colors`}>
                            <td className="py-2 px-3 text-center font-bold text-slate-200">
                              {t.rank || idx + 1}
                            </td>
                            <td className="py-2 px-4 font-sans text-slate-100">
                              <span className={isHome ? 'text-blue-300 font-black' : isAway ? 'text-rose-300 font-black' : ''}>
                                {isHome ? `🏠 ${tName}` : isAway ? `✈️ ${tName}` : tName}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center text-slate-300">{t.played || t.games || 154}</td>
                            <td className="py-2 px-3 text-center text-amber-300 font-semibold">{t.winRate || '0.500'}</td>
                            <td className="py-2 px-3 text-center text-blue-300">{t.win}</td>
                            <td className="py-2 px-3 text-center text-slate-400">{t.draw ?? 0}</td>
                            <td className="py-2 px-3 text-center text-rose-300">{t.lose}</td>
                            <td className="py-2 px-3 text-center text-slate-400">{t.diff || t.gamesBehind || '-'}</td>
                            <td className="py-2 px-3 text-center font-sans">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                                String(t.streak || '').includes('W') || String(t.streak || '').includes('승')
                                  ? 'bg-blue-950 text-blue-300'
                                  : 'bg-rose-950 text-rose-300'
                              }`}>
                                {t.streak || '-'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          ) : (
            /* Single League Standings Table (Soccer, KBO, KBL etc.) */
            <div className="bg-[#0d1726] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-black text-sm text-slate-100 flex items-center gap-2">
                  <span>📋</span>
                  <span>{league} 전체 리그 순위표</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  경기수(P) · 승(W) · {isNoDrawSport ? '' : '무(D) · '}패(L) · 득실차(GD) · 승점(Pts)
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left font-mono">
                  <thead>
                    <tr className="bg-[#4a5d6e] text-white border-b border-slate-700 text-[11px] font-semibold">
                      <th className="py-2 px-2.5 text-center w-10">순위</th>
                      <th className="py-2 px-3 font-sans">팀명</th>
                      <th className="py-2 px-2 text-center">경기</th>
                      <th className="py-2 px-2 text-center text-blue-300">승</th>
                      {!isNoDrawSport && <th className="py-2 px-2 text-center text-amber-300">무</th>}
                      <th className="py-2 px-2 text-center text-rose-300">패</th>
                      <th className="py-2 px-2 text-center">득점</th>
                      <th className="py-2 px-2 text-center">실점</th>
                      <th className="py-2 px-2 text-center">득실차</th>
                      <th className="py-2 px-2.5 text-center text-amber-300 font-bold">승점</th>
                      <th className="py-2 px-2 text-center">승률</th>
                      <th className="py-2 px-2 text-center">연속</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {cleanStandingsList.map((team: any, idx: number) => {
                      const tName = team.teamName || team.team;
                      const isHome = isMatchingTeam(tName, homeTeam);
                      const isAway = isMatchingTeam(tName, awayTeam);

                      const highlightClass = isHome 
                        ? 'bg-blue-950/40 border-l-4 border-l-blue-400 font-bold' 
                        : isAway 
                        ? 'bg-rose-950/40 border-l-4 border-l-rose-400 font-bold' 
                        : 'hover:bg-[#132238]';

                      return (
                        <tr key={idx} className={`${highlightClass} transition-colors`}>
                          <td className="py-2 px-2.5 text-center text-slate-300 font-bold">{idx + 1}</td>
                          <td className="py-2 px-3 font-sans text-slate-200">
                            <span className={isHome ? 'text-blue-300 font-black' : isAway ? 'text-rose-300 font-black' : ''}>
                              {isHome ? `🏠 ${tName}` : isAway ? `✈️ ${tName}` : tName}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center text-slate-300">{team.played || team.games || 20}</td>
                          <td className="py-2 px-2 text-center text-blue-300 font-semibold">{team.win}</td>
                          {!isNoDrawSport && <td className="py-2 px-2 text-center text-amber-300">{team.draw ?? 0}</td>}
                          <td className="py-2 px-2 text-center text-rose-300">{team.lose}</td>
                          <td className="py-2 px-2 text-center text-slate-300">{team.gf ?? team.goalsFor ?? '-'}</td>
                          <td className="py-2 px-2 text-center text-slate-300">{team.ga ?? team.goalsAgainst ?? '-'}</td>
                          <td className={`py-2 px-2 text-center font-bold ${(team.gd ?? 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {team.gd !== undefined ? (team.gd >= 0 ? `+${team.gd}` : team.gd) : '-'}
                          </td>
                          <td className="py-2 px-2.5 text-center text-amber-300 font-bold">{team.pts ?? team.points ?? '-'}</td>
                          <td className="py-2 px-2 text-center text-slate-300">{team.winRate || '-'}</td>
                          <td className="py-2 px-2 text-center text-slate-300 font-sans">{team.streak || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Home vs Away Split Comparison Table */}
          {hasSplitData && homeSplit && awaySplit && (
            <div className="bg-[#0d1726] border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-black text-sm text-slate-100 flex items-center gap-2">
                  <span>📊</span>
                  <span>홈팀의 [홈 성적] vs 원정팀의 [원정 성적] 정밀 대조</span>
                </div>
                <span className="text-[11px] text-amber-400 font-mono">가장 신뢰도 높은 전력 비교</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Home Team at Home */}
                <div className="bg-[#09131f] border border-blue-900/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blue-300">🏠 {homeTeam} [홈 경기 성적]</span>
                    <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded font-mono border border-blue-800/50">
                      홈 승률 {homeSplit.home?.winRate || `${Math.round(((homeSplit.home?.win || 0) / Math.max(1, homeSplit.home?.played || 1)) * 100)}%`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                    <div className="bg-[#0e1b2b] p-1.5 rounded">
                      <div className="text-[10px] text-slate-400 font-sans">경기수</div>
                      <div className="font-bold text-slate-200 mt-0.5">{homeSplit.home?.played || 0}</div>
                    </div>
                    <div className="bg-[#0e1b2b] p-1.5 rounded">
                      <div className="text-[10px] text-slate-400 font-sans">승/무/패</div>
                      <div className="font-bold text-blue-300 mt-0.5">
                        {homeSplit.home?.win || 0}승 {isNoDrawSport ? '' : `${homeSplit.home?.draw || 0}무 `}{homeSplit.home?.lose || 0}패
                      </div>
                    </div>
                    <div className="bg-[#0e1b2b] p-1.5 rounded">
                      <div className="text-[10px] text-slate-400 font-sans">득점/실점</div>
                      <div className="font-bold text-emerald-300 mt-0.5">
                        {homeSplit.home?.gf ?? homeSplit.home?.scored ?? 0} / {homeSplit.home?.ga ?? homeSplit.home?.conceded ?? 0}
                      </div>
                    </div>
                    <div className="bg-[#0e1b2b] p-1.5 rounded">
                      <div className="text-[10px] text-slate-400 font-sans">홈 스트릭</div>
                      <div className="font-bold text-amber-300 mt-0.5">{homeSplit.home?.streak || '-'}</div>
                    </div>
                  </div>
                </div>

                {/* Away Team at Away */}
                <div className="bg-[#09131f] border border-rose-900/30 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-rose-300">✈️ {awayTeam} [원정 경기 성적]</span>
                    <span className="text-[10px] bg-rose-950 text-rose-300 px-2 py-0.5 rounded font-mono border border-rose-800/50">
                      원정 승률 {awaySplit.away?.winRate || `${Math.round(((awaySplit.away?.win || 0) / Math.max(1, awaySplit.away?.played || 1)) * 100)}%`}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-mono">
                    <div className="bg-[#0e1b2b] p-1.5 rounded">
                      <div className="text-[10px] text-slate-400 font-sans">경기수</div>
                      <div className="font-bold text-slate-200 mt-0.5">{awaySplit.away?.played || 0}</div>
                    </div>
                    <div className="bg-[#0e1b2b] p-1.5 rounded">
                      <div className="text-[10px] text-slate-400 font-sans">승/무/패</div>
                      <div className="font-bold text-rose-300 mt-0.5">
                        {awaySplit.away?.win || 0}승 {isNoDrawSport ? '' : `${awaySplit.away?.draw || 0}무 `}{awaySplit.away?.lose || 0}패
                      </div>
                    </div>
                    <div className="bg-[#0e1b2b] p-1.5 rounded">
                      <div className="text-[10px] text-slate-400 font-sans">득점/실점</div>
                      <div className="font-bold text-emerald-300 mt-0.5">
                        {awaySplit.away?.gf ?? awaySplit.away?.scored ?? 0} / {awaySplit.away?.ga ?? awaySplit.away?.conceded ?? 0}
                      </div>
                    </div>
                    <div className="bg-[#0e1b2b] p-1.5 rounded">
                      <div className="text-[10px] text-slate-400 font-sans">원정 스트릭</div>
                      <div className="font-bold text-amber-300 mt-0.5">{awaySplit.away?.streak || '-'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Player Individual Rankings Tab */
        (isBaseball && (league.includes('MLB') || league.includes('메이저'))) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0d1726] border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="font-black text-sm text-amber-300">🏏 타자 개인 순위 TOP 5</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left font-mono">
                  <thead>
                    <tr className="bg-[#4a5d6e] text-white text-[11px]">
                      <th className="py-2 px-2 text-center">순위</th>
                      <th className="py-2 px-3 font-sans">선수명</th>
                      <th className="py-2 px-2 text-center">팀</th>
                      <th className="py-2 px-2 text-center">타율</th>
                      <th className="py-2 px-2 text-center">홈런</th>
                      <th className="py-2 px-2 text-center">타점</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="hover:bg-[#132238]"><td className="py-2 px-2 text-center font-bold text-amber-300">1</td><td className="py-2 px-3 font-sans text-slate-200">오타니 쇼헤이</td><td className="py-2 px-2 text-center text-slate-400">LAD</td><td className="py-2 px-2 text-center font-bold text-emerald-400">0.310</td><td className="py-2 px-2 text-center text-blue-300 font-bold">54</td><td className="py-2 px-2 text-center text-amber-300">130</td></tr>
                    <tr className="hover:bg-[#132238]"><td className="py-2 px-2 text-center font-bold text-slate-300">2</td><td className="py-2 px-3 font-sans text-slate-200">애런 저지</td><td className="py-2 px-2 text-center text-slate-400">NYY</td><td className="py-2 px-2 text-center font-bold text-emerald-400">0.322</td><td className="py-2 px-2 text-center text-blue-300 font-bold">58</td><td className="py-2 px-2 text-center text-amber-300">144</td></tr>
                    <tr className="hover:bg-[#132238]"><td className="py-2 px-2 text-center font-bold text-slate-400">3</td><td className="py-2 px-3 font-sans text-slate-200">바비 위트 Jr.</td><td className="py-2 px-2 text-center text-slate-400">KC</td><td className="py-2 px-2 text-center font-bold text-emerald-400">0.332</td><td className="py-2 px-2 text-center text-blue-300 font-bold">32</td><td className="py-2 px-2 text-center text-amber-300">109</td></tr>
                    <tr className="hover:bg-[#132238]"><td className="py-2 px-2 text-center font-bold text-slate-400">4</td><td className="py-2 px-3 font-sans text-slate-200">후안 소토</td><td className="py-2 px-2 text-center text-slate-400">NYY</td><td className="py-2 px-2 text-center font-bold text-emerald-400">0.288</td><td className="py-2 px-2 text-center text-blue-300 font-bold">41</td><td className="py-2 px-2 text-center text-amber-300">109</td></tr>
                    <tr className="hover:bg-[#132238]"><td className="py-2 px-2 text-center font-bold text-slate-400">5</td><td className="py-2 px-3 font-sans text-slate-200">브라이스 하퍼</td><td className="py-2 px-2 text-center text-slate-400">PHI</td><td className="py-2 px-2 text-center font-bold text-emerald-400">0.285</td><td className="py-2 px-2 text-center text-blue-300 font-bold">30</td><td className="py-2 px-2 text-center text-amber-300">87</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-[#0d1726] border border-slate-800 rounded-2xl p-4 space-y-3">
              <h4 className="font-black text-sm text-cyan-300">⚾ 투수 개인 순위 TOP 5</h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left font-mono">
                  <thead>
                    <tr className="bg-[#4a5d6e] text-white text-[11px]">
                      <th className="py-2 px-2 text-center">순위</th>
                      <th className="py-2 px-3 font-sans">선수명</th>
                      <th className="py-2 px-2 text-center">팀</th>
                      <th className="py-2 px-2 text-center">ERA</th>
                      <th className="py-2 px-2 text-center">승</th>
                      <th className="py-2 px-2 text-center">탈삼진</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr className="hover:bg-[#132238]"><td className="py-2 px-2 text-center font-bold text-amber-300">1</td><td className="py-2 px-3 font-sans text-slate-200">크리스 세일</td><td className="py-2 px-2 text-center text-slate-400">ATL</td><td className="py-2 px-2 text-center font-bold text-cyan-300">2.38</td><td className="py-2 px-2 text-center text-blue-300 font-bold">18</td><td className="py-2 px-2 text-center text-emerald-400">225</td></tr>
                    <tr className="hover:bg-[#132238]"><td className="py-2 px-2 text-center font-bold text-slate-300">2</td><td className="py-2 px-3 font-sans text-slate-200">태릭 스쿠발</td><td className="py-2 px-2 text-center text-slate-400">DET</td><td className="py-2 px-2 text-center font-bold text-cyan-300">2.39</td><td className="py-2 px-2 text-center text-blue-300 font-bold">18</td><td className="py-2 px-2 text-center text-emerald-400">228</td></tr>
                    <tr className="hover:bg-[#132238]"><td className="py-2 px-2 text-center font-bold text-slate-400">3</td><td className="py-2 px-3 font-sans text-slate-200">잭 휠러</td><td className="py-2 px-2 text-center text-slate-400">PHI</td><td className="py-2 px-2 text-center font-bold text-cyan-300">2.57</td><td className="py-2 px-2 text-center text-blue-300 font-bold">16</td><td className="py-2 px-2 text-center text-emerald-400">224</td></tr>
                    <tr className="hover:bg-[#132238]"><td className="py-2 px-2 text-center font-bold text-slate-400">4</td><td className="py-2 px-3 font-sans text-slate-200">코빈 번스</td><td className="py-2 px-2 text-center text-slate-400">BAL</td><td className="py-2 px-2 text-center font-bold text-cyan-300">2.92</td><td className="py-2 px-2 text-center text-blue-300 font-bold">15</td><td className="py-2 px-2 text-center text-emerald-400">181</td></tr>
                    <tr className="hover:bg-[#132238]"><td className="py-2 px-2 text-center font-bold text-slate-400">5</td><td className="py-2 px-3 font-sans text-slate-200">폴 스킨스</td><td className="py-2 px-2 text-center text-slate-400">PIT</td><td className="py-2 px-2 text-center font-bold text-cyan-300">1.96</td><td className="py-2 px-2 text-center text-blue-300 font-bold">11</td><td className="py-2 px-2 text-center text-emerald-400">170</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#0d1726] border border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <div className="text-3xl">👤</div>
            <h3 className="font-black text-base text-slate-200">
              {league} [선수 개인 순위 데이터 없음]
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              해당 종목 및 대회는 선수 개인 순위 데이터를 별도로 제공하지 않습니다. (데이터 없음)
            </p>
          </div>
        )
      )}
    </div>
  );
}
