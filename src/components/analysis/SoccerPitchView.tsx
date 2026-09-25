import React, { useState } from 'react';
import { getCountryFlagUrl as resolveFlagUrl, resolvePlayerCountry } from '../../utils/playerNationalityResolver';

export interface PitchPlayer {
  name: string;
  shortName?: string;
  position: string;
  shirtNumber?: number | string;
  isCaptain?: boolean;
  isAce?: boolean;
  countryName?: string;
  countryCode?: string;
  rating?: number | string;
  playerId?: string | number;
  imageLink?: string;
}

interface SoccerPitchViewProps {
  homeTeam: string;
  awayTeam: string;
  homeFormation: string;
  awayFormation: string;
  homePlayers: PitchPlayer[];
  awayPlayers: PitchPlayer[];
}

/**
 * Resolves player national flag using the centralized, verified nationality resolver.
 */
export function getCountryFlagUrl(
  countryCode?: string,
  countryName?: string,
  playerName?: string,
  teamContext?: string
): string | null {
  return resolveFlagUrl(countryCode, countryName, playerName, teamContext);
}

// Organize 11 players into tactical formation rows
function buildFormationRows(players: PitchPlayer[], formation: string, isTopTeam: boolean = false): PitchPlayer[][] {
  if (!players || players.length === 0) return [];

  // Guarantee exactly 1 GK
  let gk = players.find(p => p.position === 'GK' || p.position === 'G');
  if (!gk) gk = players[0];

  const fieldPlayers = players.filter(p => p !== gk);

  // Split field players by position
  const dfs = fieldPlayers.filter(p => p.position === 'DF' || p.position === 'D');
  const mfs = fieldPlayers.filter(p => p.position === 'MF' || p.position === 'M');
  const fws = fieldPlayers.filter(p => p.position === 'FW' || p.position === 'F');

  const cleanFormation = formation.replace(/[^0-9\-]/g, '');
  const counts = cleanFormation.split('-').map(Number).filter(n => !isNaN(n) && n > 0);

  const rows: PitchPlayer[][] = [];

  if (cleanFormation === '4-2-3-1') {
    const dLine = dfs.length >= 4 ? dfs.slice(0, 4) : fieldPlayers.slice(0, 4);
    const dmLine = mfs.length >= 2 ? mfs.slice(0, 2) : fieldPlayers.slice(4, 6);
    const amLine = mfs.length >= 5 ? mfs.slice(2, 5) : fieldPlayers.slice(6, 9);
    const fwLine = fws.length >= 1 ? fws.slice(0, 1) : fieldPlayers.slice(9, 10);
    
    rows.push([gk]);
    rows.push(dLine);
    rows.push(dmLine);
    rows.push(amLine);
    rows.push(fwLine);
  } else if (cleanFormation === '4-4-2') {
    const dLine = dfs.length >= 4 ? dfs.slice(0, 4) : fieldPlayers.slice(0, 4);
    const mLine = mfs.length >= 4 ? mfs.slice(0, 4) : fieldPlayers.slice(4, 8);
    const fLine = fws.length >= 2 ? fws.slice(0, 2) : fieldPlayers.slice(8, 10);

    rows.push([gk]);
    rows.push(dLine);
    rows.push(mLine);
    rows.push(fLine);
  } else if (counts.length >= 2 && fieldPlayers.length >= 10) {
    rows.push([gk]);
    let idx = 0;
    counts.forEach(cnt => {
      rows.push(fieldPlayers.slice(idx, idx + cnt));
      idx += cnt;
    });
    if (idx < fieldPlayers.length) {
      rows[rows.length - 1].push(...fieldPlayers.slice(idx));
    }
  } else {
    // Default 4-3-3
    rows.push([gk]);
    rows.push(fieldPlayers.slice(0, 4));
    rows.push(fieldPlayers.slice(4, 7));
    rows.push(fieldPlayers.slice(7, 10));
  }

  // If top team in full pitch, reverse rows so GK is at very top near goal, and forwards are near center
  if (isTopTeam) {
    return rows; // GK at top [0], DF [1], MF [2], FW [3] -> points downward towards midfield
  } else {
    // Bottom team: GK at bottom, DF above, MF above, FW at top of bottom half
    return [...rows].reverse(); // FW [0], MF [1], DF [2], GK [3] -> points upward towards midfield
  }
}

export const SoccerPitchView: React.FC<SoccerPitchViewProps> = ({
  homeTeam,
  awayTeam,
  homeFormation,
  awayFormation,
  homePlayers,
  awayPlayers
}) => {
  const [activeTab, setActiveTab] = useState<'full' | 'home' | 'away'>('full');

  const cleanHomeForm = homeFormation?.replace(/[^0-9\-]/g, '') || '4-4-2';
  const cleanAwayForm = awayFormation?.replace(/[^0-9\-]/g, '') || '4-2-3-1';

  // Build rows
  const homeRowsFull = buildFormationRows(homePlayers, cleanHomeForm, true); // GK at top -> FWs at middle
  const awayRowsFull = buildFormationRows(awayPlayers, cleanAwayForm, false); // FWs at middle -> GK at bottom

  const homeRowsSingle = buildFormationRows(homePlayers, cleanHomeForm, false);
  const awayRowsSingle = buildFormationRows(awayPlayers, cleanAwayForm, false);

  const renderPlayerToken = (p: PitchPlayer, isHome: boolean) => {
    const teamContext = isHome ? homeTeam : awayTeam;
    const flagUrl = getCountryFlagUrl(p.countryCode, p.countryName, p.name || p.shortName, teamContext);
    const resolvedNat = resolvePlayerCountry(p.countryCode, p.countryName, p.name || p.shortName, teamContext);
    const displayName = p.shortName || p.name;
    const isCaptain = Boolean(p.isCaptain);

    return (
      <div 
        key={`${p.name}-${p.shirtNumber}`}
        className="flex flex-col items-center group relative cursor-pointer select-none transition-transform hover:scale-105"
        title={`${p.name} | No.${p.shirtNumber} | ${p.position} | 국적: ${resolvedNat.countryName} | 평점 ${p.rating || '7.0'}`}
      >
        {/* Token Circle */}
        <div className="relative">
          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full border-2 shadow-lg flex items-center justify-center overflow-hidden bg-[#0d1726] ${
            isHome 
              ? 'border-red-500 shadow-red-950/50' 
              : 'border-blue-400 shadow-blue-950/50'
          }`}>
            {p.imageLink ? (
              <img
                src={p.imageLink}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : null}

            {/* Shirt Number */}
            <div className="flex flex-col items-center justify-center text-white">
              <span className="text-xs sm:text-sm font-black font-mono drop-shadow">
                {p.shirtNumber || ''}
              </span>
            </div>
          </div>

          {/* National Flag Badge */}
          {flagUrl ? (
            <div className="absolute -bottom-1 -right-1 bg-black/85 p-0.5 rounded border border-white/80 shadow-md">
              <img
                src={flagUrl}
                alt={resolvedNat.countryName || '국적'}
                className="w-3.5 h-2.5 sm:w-4 sm:h-3 object-cover rounded-sm"
              />
            </div>
          ) : (
            <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[9px] px-0.5 rounded border border-slate-600 text-slate-300">
              ⚽
            </div>
          )}
        </div>

        {/* Player Name Tag (SofaScore exact style) */}
        <div className="mt-0.5 flex items-center justify-center">
          <div className="text-[10px] sm:text-xs font-bold text-white bg-black/80 px-1.5 py-0.5 rounded backdrop-blur-sm border border-white/20 whitespace-nowrap shadow flex items-center gap-0.5">
            <span className="font-mono text-slate-300">{p.shirtNumber}</span>
            {isCaptain && <span className="text-amber-300 font-bold">(c)</span>}
            <span className="truncate max-w-[70px] sm:max-w-[90px]">{displayName}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#0b1622] border border-[#1b344d] rounded-2xl p-4 space-y-3 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5">
            <span>🏟️</span>
            <span>소파스코어 원본 전술 피치 (국기 배지 & 공식 라인업)</span>
          </span>
          <span className="text-xs text-slate-400">
            {homeTeam} ({cleanHomeForm}) vs {awayTeam} ({cleanAwayForm})
          </span>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-[#060e17] p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('full')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'full'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            양 팀 전술 대치 (22인 풀 피치)
          </button>
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'home'
                ? 'bg-red-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {homeTeam} ({cleanHomeForm})
          </button>
          <button
            onClick={() => setActiveTab('away')}
            className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeTab === 'away'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {awayTeam} ({cleanAwayForm})
          </button>
        </div>
      </div>

      {/* TACTICAL SOCCER PITCH FIELD */}
      <div className="relative w-full max-w-2xl mx-auto aspect-[3/4] sm:aspect-[4/5] bg-gradient-to-b from-[#1b502d] via-[#216338] to-[#1b502d] rounded-xl overflow-hidden border-2 border-emerald-600/70 shadow-2xl p-3 flex flex-col justify-between select-none">
        {/* Grass Pitch Stripes Background */}
        <div className="absolute inset-0 pointer-events-none opacity-25 bg-[repeating-linear-gradient(0deg,transparent,transparent_24px,rgba(255,255,255,0.06)_24px,rgba(255,255,255,0.06)_48px)]"></div>

        {/* Outer Boundary */}
        <div className="absolute inset-2 border-2 border-white/40 rounded pointer-events-none"></div>

        {/* Halfway Line */}
        <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-white/50 pointer-events-none transform -translate-y-1/2"></div>
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 w-28 h-28 sm:w-36 sm:h-36 border-2 border-white/50 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white/70 rounded-full pointer-events-none transform -translate-x-1/2 -translate-y-1/2"></div>

        {/* Top Penalty & Goal Area */}
        <div className="absolute top-2 left-1/2 w-52 sm:w-64 h-16 border-b-2 border-x-2 border-white/40 pointer-events-none transform -translate-x-1/2"></div>
        <div className="absolute top-2 left-1/2 w-24 sm:w-32 h-8 border-b-2 border-x-2 border-white/40 pointer-events-none transform -translate-x-1/2"></div>

        {/* Bottom Penalty & Goal Area */}
        <div className="absolute bottom-2 left-1/2 w-52 sm:w-64 h-16 border-t-2 border-x-2 border-white/40 pointer-events-none transform -translate-x-1/2"></div>
        <div className="absolute bottom-2 left-1/2 w-24 sm:w-32 h-8 border-t-2 border-x-2 border-white/40 pointer-events-none transform -translate-x-1/2"></div>

        {/* PITCH CONTENT */}
        {activeTab === 'full' ? (
          <div className="relative z-10 h-full flex flex-col justify-between py-1">
            {/* TOP HALF: HOME TEAM (e.g. AT Madrid 4-4-2) */}
            <div className="h-[48%] flex flex-col justify-between">
              {/* Home Team Badge Label */}
              <div className="flex justify-between items-center px-3 pt-0.5 text-[11px] font-bold text-red-200">
                <span className="bg-red-950/80 px-2 py-0.5 rounded border border-red-700/60 shadow">
                  🔴 {homeTeam} ({cleanHomeForm})
                </span>
                <span className="text-[10px] text-emerald-200/80 font-mono">HOME DEFENSE</span>
              </div>

              {homeRowsFull.map((rowPlayers, rIdx) => (
                <div key={`h-row-${rIdx}`} className="flex items-center justify-around w-full px-2">
                  {rowPlayers.map(p => renderPlayerToken(p, true))}
                </div>
              ))}
            </div>

            {/* BOTTOM HALF: AWAY TEAM (e.g. Real Madrid 4-2-3-1) */}
            <div className="h-[48%] flex flex-col justify-between">
              {awayRowsFull.map((rowPlayers, rIdx) => (
                <div key={`a-row-${rIdx}`} className="flex items-center justify-around w-full px-2">
                  {rowPlayers.map(p => renderPlayerToken(p, false))}
                </div>
              ))}

              {/* Away Team Badge Label */}
              <div className="flex justify-between items-center px-3 pb-0.5 text-[11px] font-bold text-blue-200">
                <span className="text-[10px] text-emerald-200/80 font-mono">AWAY DEFENSE</span>
                <span className="bg-blue-950/80 px-2 py-0.5 rounded border border-blue-700/60 shadow">
                  🔵 {awayTeam} ({cleanAwayForm})
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* SINGLE TEAM VIEW */
          <div className="relative z-10 h-full flex flex-col justify-between py-2">
            <div className="flex justify-between items-center px-3 text-xs font-bold text-slate-200">
              <span className="bg-black/60 px-2.5 py-1 rounded border border-white/20">
                {activeTab === 'home' ? `🔴 ${homeTeam} (${cleanHomeForm})` : `🔵 ${awayTeam} (${cleanAwayForm})`}
              </span>
              <span className="text-[11px] text-slate-300">선발 11인 전술 배치도</span>
            </div>

            {(activeTab === 'home' ? homeRowsSingle : awayRowsSingle).map((rowPlayers, rIdx) => (
              <div key={`single-row-${rIdx}`} className="flex items-center justify-around w-full px-2">
                {rowPlayers.map(p => renderPlayerToken(p, activeTab === 'home'))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend & Verification Info Footer */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>{homeTeam} (홈)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
            <span>{awayTeam} (원정)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-amber-300 font-bold">(c)</span>
            <span>주장 (Captain)</span>
          </div>
        </div>
        <div className="text-[10px] text-emerald-400 font-mono">
          ✓ SofaScore 공식 라인업 규격 동기화 완료
        </div>
      </div>
    </div>
  );
};
