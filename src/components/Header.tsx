import React from 'react';
import { TabType } from '../types';
import { Layers, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenWisetotoImport?: () => void;
}

export function Header({ currentTab, onTabChange, onOpenWisetotoImport }: HeaderProps) {
  return (
    <header className="bg-slate-900 text-white shadow-md border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-[1720px] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo and Brand Title */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onTabChange('proto')}
            className="flex items-center gap-2.5 text-xl font-black tracking-tight text-white hover:opacity-90 transition-opacity cursor-pointer"
          >
            <span className="bg-blue-600 text-white px-2.5 py-1 rounded-lg text-sm font-bold shadow-xs">SQ</span>
            <span>SportsQuant Pro</span>
          </button>
        </div>

        {/* Clean Primary Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => onTabChange('proto')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'proto'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            ⚽ 프로토 승부식
          </button>
          <button
            onClick={() => onTabChange('toto')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'toto'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            🏆 토토 14경기 (승무패·승1패·승5패)
          </button>
          <button
            onClick={() => onTabChange('quant_lab')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'quant_lab'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            🔬 퀀트 수리 모델
          </button>
          <button
            onClick={() => onTabChange('backtest')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              currentTab === 'backtest'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            📊 백테스트 검증
          </button>
        </nav>
      </div>
    </header>
  );
}

