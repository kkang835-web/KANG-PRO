import React, { useEffect, useState } from 'react';
import { TabType, GameType, MatchItem, TotoType } from './types';
import { Header } from './components/Header';
import { MatchTable } from './components/MatchTable';
import { QuantLab } from './components/QuantLab';
import { BacktestModal } from './components/BacktestModal';
import { CrawlerManager } from './components/CrawlerManager';
import { QuantModal } from './components/QuantModal';
import { PortfolioOptimizer } from './components/PortfolioOptimizer';
import { CalculatorsModal } from './components/CalculatorsModal';
import { TotoTable } from './components/TotoTable';
import { BacktestLab } from './components/BacktestLab';
import { FlashScoreCenterModal } from './components/FlashScoreCenterModal';
import { WisetotoImportModal } from './components/WisetotoImportModal';
import { AdSenseComplianceFooter } from './components/AdSenseComplianceFooter';
import { TotoRoundLimits } from './types';
import { resolveRoundByDate } from './utils/calendarRoundResolver';

const initialCalendar = resolveRoundByDate();

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('proto');
  const [gameType, setGameType] = useState<GameType>('pt1');
  const [totoType, setTotoType] = useState<TotoType>('sc');
  const [selectedYear, setSelectedYear] = useState<number>(initialCalendar.year);
  const [selectedRound, setSelectedRound] = useState<number>(initialCalendar.protoRound);
  const [showWisetotoImport, setShowWisetotoImport] = useState<boolean>(false);
  const [activeRounds, setActiveRounds] = useState<{ pt1: number; sc: number; bs: number; bk: number; year?: number; today?: string }>({
    pt1: initialCalendar.protoRound,
    sc: initialCalendar.totoSoccerRound,
    bs: initialCalendar.totoBaseballRound,
    bk: initialCalendar.totoBasketballRound,
    year: initialCalendar.year,
    today: initialCalendar.dateStr
  });

  const [protoRoundLimits, setProtoRoundLimits] = useState<Record<number, number>>({
    2009: 104, 2010: 104, 2011: 107, 2012: 111, 2013: 103, 2014: 104,
    2015: 102, 2016: 105, 2017: 95, 2018: 100, 2019: 103, 2020: 92,
    2021: 103, 2022: 108, 2023: 153, 2024: 157, 2025: 154, 2026: 155
  });

  const [totoRoundLimits, setTotoRoundLimits] = useState<TotoRoundLimits>({
    sc: {},
    bs: {},
    bk: {}
  });

  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [roundMetadata, setRoundMetadata] = useState<{
    roundPeriod?: string;
    totalGames?: number;
    status?: string;
    domesticRefundRate?: string;
    foreignRefundRate?: string;
    fetchedAt?: string;
  }>({});
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);

  const [selectedMatchForQuant, setSelectedMatchForQuant] = useState<MatchItem | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<'overview' | 'h2h' | 'quant' | 'backtest' | 'ai'>('overview');
  const [showBacktestModal, setShowBacktestModal] = useState<boolean>(false);
  const [showFlashScoreModal, setShowFlashScoreModal] = useState<boolean>(false);
  const [activeCalc, setActiveCalc] = useState<string | null>(null);

  // Auto-recognize Proto & Toto active rounds and dates on program startup
  useEffect(() => {
    async function initActiveRounds() {
      try {
        const cal = resolveRoundByDate();
        const [activeRes, totoLimitsRes] = await Promise.all([
          fetch('/api/active-rounds'),
          fetch('/api/toto/limits')
        ]);
        if (activeRes.ok) {
          const data = await activeRes.json();
          if (data) {
            setActiveRounds(data);
            const liveYear = data.year || cal.year;
            setSelectedYear(liveYear);
            if (currentTab === 'proto') {
              setSelectedRound(data.pt1 || cal.protoRound);
            } else if (currentTab === 'toto') {
              const defaultTotoRound = totoType === 'sc' ? cal.totoSoccerRound : (totoType === 'bs' ? cal.totoBaseballRound : cal.totoBasketballRound);
              setSelectedRound(data[totoType] || defaultTotoRound);
            }
            if (data.pt1) {
              setProtoRoundLimits(prev => ({ ...prev, [liveYear]: Math.max(prev[liveYear] || 0, data.pt1) }));
            }
          }
        }
        if (totoLimitsRes.ok) {
          const limitsData = await totoLimitsRes.json();
          if (limitsData) {
            setTotoRoundLimits(limitsData);
          }
        }
      } catch (err) {
        console.error("Failed to initialize active rounds:", err);
      }
    }
    initActiveRounds();
  }, []);

  const handleTabSelect = (tab: TabType) => {
    setCurrentTab(tab);
    const cal = resolveRoundByDate();
    if (selectedYear === 2026 || selectedYear === cal.year) {
      if (tab === 'proto') {
        setGameType('pt1');
        setSelectedRound(activeRounds.pt1 || cal.protoRound);
      } else if (tab === 'toto') {
        const defaultTotoRound = totoType === 'sc' ? cal.totoSoccerRound : (totoType === 'bs' ? cal.totoBaseballRound : cal.totoBasketballRound);
        setSelectedRound(activeRounds[totoType] || defaultTotoRound);
      }
    }
  };

  const handleSelectTotoType = (newType: TotoType) => {
    setTotoType(newType);
    const cal = resolveRoundByDate();
    const defaultTotoRound = newType === 'sc' ? cal.totoSoccerRound : (newType === 'bs' ? cal.totoBaseballRound : cal.totoBasketballRound);
    setSelectedRound(activeRounds[newType] || defaultTotoRound);
  };

  const fetchMatches = async (force = false) => {
    try {
      setLoadingMatches(true);
      const res = await fetch(`/api/matches?gameType=${gameType}&year=${selectedYear}&round=${selectedRound}${force ? '&force=true' : ''}`);
      const data = await res.json();
      const list: MatchItem[] = data.matches || [];
      setMatches(list);

      // Auto-select first match if none selected or not in list
      if (list.length > 0) {
        setSelectedMatch(prev => {
          if (!prev) return list[0];
          const exists = list.find(m => m.gameNo === prev.gameNo && m.categoryLabel === prev.categoryLabel);
          return exists || list[0];
        });
      } else {
        setSelectedMatch(null);
      }

      setRoundMetadata({
        roundPeriod: data.roundPeriod,
        totalGames: data.totalGames,
        status: data.status,
        domesticRefundRate: data.domesticRefundRate,
        foreignRefundRate: data.foreignRefundRate,
        fetchedAt: data.fetchedAt
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatches(false);
    }
  };

  useEffect(() => {
    fetchMatches(false);
  }, [gameType, selectedYear, selectedRound]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-gray-800">
      {/* Clean Header Navigation */}
      <Header 
        currentTab={currentTab} 
        onTabChange={handleTabSelect} 
        onOpenWisetotoImport={() => setShowWisetotoImport(true)}
      />

      {/* Main Container */}
      <div id="content" className="max-w-[1720px] mx-auto w-full px-3 sm:px-6 py-5 grow">
        <div className="space-y-5 w-full">
          {/* Active View Renderer */}
          {currentTab === 'toto' ? (
            <TotoTable 
              selectedTotoType={totoType}
              selectedYear={selectedYear}
              selectedRound={selectedRound}
              onSelectTotoType={handleSelectTotoType}
              onYearChange={setSelectedYear}
              onRoundChange={setSelectedRound}
              onOpenQuantModal={(m) => {
                setSelectedMatchForQuant(m);
                setModalInitialTab('overview');
              }}
            />
          ) : currentTab === 'crawler' ? (
            <CrawlerManager />
          ) : currentTab === 'quant_lab' ? (
            <QuantLab onOpenCalculator={(type) => setActiveCalc(type)} />
          ) : currentTab === 'backtest' ? (
            <BacktestLab onOpenCalculator={(type) => setActiveCalc(type)} />
          ) : currentTab === 'portfolio' ? (
            <PortfolioOptimizer selectedTotoType={totoType} />
          ) : (
            <div className="space-y-4">
              {/* Top Header Information */}
              <div id="matches-table-container" className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    프로토 승부식 경기 목록 ({selectedYear}년도 {selectedRound}회차)
                  </h3>
                  {roundMetadata?.status && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                      {roundMetadata.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    총 {matches.length}경기 편성
                  </span>
                </div>
              </div>

              {loadingMatches ? (
                <div className="py-20 text-center space-y-3 bg-white rounded-xl border border-gray-200">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-xs font-bold text-gray-600">경기 데이터를 불러오는 중입니다...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Matches Table */}
                  <MatchTable 
                    matches={matches}
                    selectedYear={selectedYear}
                    selectedRound={selectedRound}
                    protoRoundLimits={protoRoundLimits}
                    selectedMatch={selectedMatch}
                    roundMetadata={roundMetadata}
                    isLoading={loadingMatches}
                    onYearChange={setSelectedYear}
                    onRoundChange={setSelectedRound}
                    onRefresh={(force) => fetchMatches(force ?? true)}
                    onSelectMatchForQuant={(m, tab = 'overview') => {
                      setSelectedMatch(m);
                      setSelectedMatchForQuant(m);
                      setModalInitialTab(tab || 'overview');
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quant Modal */}
      {selectedMatchForQuant && (
        <QuantModal 
          match={selectedMatchForQuant} 
          initialTab={modalInitialTab}
          onClose={() => setSelectedMatchForQuant(null)} 
        />
      )}

      {/* Backtest Modal */}
      {showBacktestModal && (
        <BacktestModal 
          onClose={() => setShowBacktestModal(false)}
        />
      )}

      {/* Calculators Modal */}
      {activeCalc && (
        <CalculatorsModal 
          calcType={activeCalc} 
          onClose={() => setActiveCalc(null)} 
        />
      )}

      {/* FlashScore RapidAPI Modal */}
      <FlashScoreCenterModal 
        isOpen={showFlashScoreModal}
        onClose={() => setShowFlashScoreModal(false)}
      />

      {/* Wisetoto 5-Tab Import & Synchronization Modal */}
      <WisetotoImportModal
        isOpen={showWisetotoImport}
        onClose={() => setShowWisetotoImport(false)}
        onImportSuccess={() => {
          fetchMatches(true);
        }}
      />

      {/* Footer */}
      <AdSenseComplianceFooter />
    </div>
  );
}
