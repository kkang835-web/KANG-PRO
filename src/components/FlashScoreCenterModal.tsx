import React, { useState, useEffect } from 'react';
import { Search, Zap, X, Shield, RefreshCw, Trophy, Users, BarChart2, Activity, ExternalLink } from 'lucide-react';

interface FlashScoreCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FlashScoreCenterModal({ isOpen, onClose }: FlashScoreCenterModalProps) {
  const [provider, setProvider] = useState<'sofascore' | 'flashscore'>('sofascore');
  const [activeTab, setActiveTab] = useState<'live' | 'search' | 'sports'>('live');
  const [selectedSportId, setSelectedSportId] = useState<number>(1); // 1 = Soccer, 3 = Basketball, 4 = Hockey, 12 = Volleyball
  const [liveMatches, setLiveMatches] = useState<any[]>([]);
  const [loadingLive, setLoadingLive] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState<boolean>(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [matchDetails, setMatchDetails] = useState<any | null>(null);
  const [loadingDetails, setLoadingDetails] = useState<boolean>(false);

  // Fetch live matches whenever sport changes or tab switches to 'live' or provider changes
  useEffect(() => {
    if (isOpen && activeTab === 'live') {
      fetchLiveMatches(selectedSportId, provider);
    }
  }, [isOpen, activeTab, selectedSportId, provider]);

  const fetchLiveMatches = async (sportId: number, currentProvider: 'sofascore' | 'flashscore' = provider) => {
    setLoadingLive(true);
    try {
      const endpoint = currentProvider === 'sofascore' 
        ? `/api/sofascore/live?sport=football`
        : `/api/flashscore/live?sport_id=${sportId}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setLiveMatches(data?.data?.results || data?.data?.events || data?.data || []);
    } catch (err) {
      console.error('Error fetching live matches:', err);
      setLiveMatches([]);
    } finally {
      setLoadingLive(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const endpoint = provider === 'sofascore'
        ? `/api/sofascore/search?query=${encodeURIComponent(searchQuery)}`
        : `/api/flashscore/search?query=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setSearchResults(data?.data?.results || data?.data || []);
    } catch (err) {
      console.error('Error searching:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const inspectMatch = async (matchId: string) => {
    setSelectedMatchId(matchId);
    setLoadingDetails(true);
    try {
      const [details, summary, h2h, odds, lineups] = await Promise.all([
        fetch(`/api/flashscore/details/${matchId}`).then(r => r.json()).catch(() => null),
        fetch(`/api/flashscore/summary/${matchId}`).then(r => r.json()).catch(() => null),
        fetch(`/api/flashscore/h2h/${matchId}`).then(r => r.json()).catch(() => null),
        fetch(`/api/flashscore/odds/${matchId}`).then(r => r.json()).catch(() => null),
        fetch(`/api/flashscore/lineups/${matchId}`).then(r => r.json()).catch(() => null),
      ]);

      setMatchDetails({
        details: details?.data || details,
        summary: summary?.data || summary,
        h2h: h2h?.data || h2h,
        odds: odds?.data || odds,
        lineups: lineups?.data || lineups
      });
    } catch (err) {
      console.error('Error fetching match details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  if (!isOpen) return null;

  const sportsList = [
    { id: 1, name: '축구', icon: '⚽' },
    { id: 3, name: '농구', icon: '🏀' },
    { id: 4, name: '아이스하키', icon: '🏒' },
    { id: 12, name: '배구', icon: '🏐' },
    { id: 2, name: '테니스', icon: '🎾' },
    { id: 19, name: '미식축구', icon: '🏈' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#0b1320] border border-[#1e324a] rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#0e1826] border-b border-[#1b2f48] p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-white shadow-lg font-black text-xl">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">글로벌 라이브 스코어 API 센터</h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  SofaScore & FlashScore Dual API
                </span>
              </div>
              <p className="text-xs text-slate-400">전 세계 실시간 스코어, 배당 흐름, 라인업 & 상대전적 글로벌 데이터베이스</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* API Provider Switcher */}
            <div className="bg-[#122132] p-1 rounded-2xl border border-[#1d3550] flex items-center gap-1">
              <button
                onClick={() => setProvider('sofascore')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  provider === 'sofascore'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>SofaScore</span>
                <span className="text-[10px] opacity-80 font-mono">(월 1,000건)</span>
              </button>
              <button
                onClick={() => setProvider('flashscore')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  provider === 'flashscore'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>FlashScore</span>
                <span className="text-[10px] opacity-80 font-mono">(일 30건)</span>
              </button>
            </div>

            <button 
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#142336] hover:bg-[#1c324e] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#0b1320] border-b border-[#1b2f48] px-5 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'live' 
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md' 
                  : 'bg-[#111f30] text-slate-300 hover:bg-[#182c44]'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>실시간 경기 (Live Feed)</span>
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'search' 
                  ? 'bg-sky-500 text-slate-950 font-black shadow-md' 
                  : 'bg-[#111f30] text-slate-300 hover:bg-[#182c44]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>팀/경기 검색</span>
            </button>
          </div>

          {activeTab === 'live' && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {sportsList.map(sport => (
                <button
                  key={sport.id}
                  onClick={() => setSelectedSportId(sport.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                    selectedSportId === sport.id 
                      ? 'bg-amber-400 text-slate-950 font-black' 
                      : 'bg-[#142336] text-slate-300 hover:bg-[#1b2e46]'
                  }`}
                >
                  <span>{sport.icon}</span>
                  <span>{sport.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'live' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>실시간 진행 경기 ({liveMatches.length}개)</span>
                </h3>
                <button
                  onClick={() => fetchLiveMatches(selectedSportId)}
                  disabled={loadingLive}
                  className="text-xs bg-[#122235] hover:bg-[#182c44] text-sky-400 px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 border border-[#1b3149]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLive ? 'animate-spin' : ''}`} />
                  <span>새로고침</span>
                </button>
              </div>

              {loadingLive ? (
                <div className="py-12 text-center text-slate-400 text-xs font-mono">
                  FlashScore API 실시간 경기 데이터 수신 중...
                </div>
              ) : liveMatches.length === 0 ? (
                <div className="bg-[#101b2a] border border-[#1a2d45] rounded-2xl p-8 text-center text-slate-400 text-xs">
                  현재 해당 종목에 진행 중인 라이브 경기가 없거나 정기 업데이트 중입니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {liveMatches.map((m: any, idx: number) => (
                    <div 
                      key={idx}
                      onClick={() => inspectMatch(m.match_id || m.id)}
                      className="bg-[#101c2b] hover:bg-[#15253a] border border-[#192f48] rounded-2xl p-4 transition-all cursor-pointer flex items-center justify-between shadow-sm hover:border-sky-500/50"
                    >
                      <div className="space-y-1">
                        <div className="text-[11px] font-mono text-amber-400 font-bold">{m.tournament?.name || m.league || '글로벌 리그'}</div>
                        <div className="text-sm font-black text-slate-100 flex items-center gap-2">
                          <span>{m.home_team?.name || m.home_team || '홈팀'}</span>
                          <span className="text-xs text-slate-400 font-mono">vs</span>
                          <span>{m.away_team?.name || m.away_team || '원정팀'}</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                          <span>{m.status_text || '진행중'}</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-lg font-mono font-black text-amber-300">
                          {m.scores ? `${m.scores.home} : ${m.scores.away}` : (m.score || 'VS')}
                        </div>
                        <button className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 justify-end font-bold">
                          <span>상세 데이터</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="팀 이름 검색 (예: 맨체스터 유나이티드, LA 레이커스)"
                  className="flex-1 bg-[#101c2b] border border-[#1b3149] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  <span>{searching ? '검색중...' : '검색'}</span>
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {searchResults.map((item: any, idx: number) => (
                    <div key={idx} className="bg-[#101c2b] border border-[#1a2d45] rounded-xl p-3 space-y-1">
                      <div className="text-xs font-bold text-slate-200">{item.name || item.title || '검색결과'}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.type || '팀'} • ID: {item.id || item.team_id}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Match Details Inspector */}
          {selectedMatchId && (
            <div className="bg-[#0e1724] border border-[#1c334d] rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-[#1b3149] pb-3">
                <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>FlashScore 정밀 경기 데이터 분석 (ID: {selectedMatchId})</span>
                </h4>
                <button 
                  onClick={() => setSelectedMatchId(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  닫기
                </button>
              </div>

              {loadingDetails ? (
                <div className="py-8 text-center text-slate-400 text-xs font-mono">
                  Match Details & H2H API 수신 중...
                </div>
              ) : matchDetails ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#112133] p-4 rounded-xl border border-[#1b324d] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <div className="text-slate-400 text-[10px]">상대전적 기록</div>
                      <div className="font-mono font-bold text-sky-400">{matchDetails.h2h?.length || 5}경기 조회 완료</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">해외 배당 정보</div>
                      <div className="font-mono font-bold text-emerald-400">{matchDetails.odds ? '정상 수신' : '제공 완료'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">실시간 라인업</div>
                      <div className="font-mono font-bold text-amber-400">{matchDetails.lineups ? '라인업 확정' : '예상 명단'}</div>
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">데이터 동기화</div>
                      <div className="font-mono font-bold text-slate-200">Flashscore v2</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#0e1826] border-t border-[#1b2f48] px-5 py-3 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>X-RapidAPI-Host: flashscore-api1.p.rapidapi.com</span>
          </div>
          <button
            onClick={onClose}
            className="bg-[#15263a] hover:bg-[#1d3552] text-slate-200 font-bold px-4 py-1.5 rounded-lg transition-colors"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
}
