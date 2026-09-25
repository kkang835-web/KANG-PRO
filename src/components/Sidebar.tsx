import React from 'react';
import { Cpu, CheckCircle2, ShieldCheck, Trophy, Calculator } from 'lucide-react';
import { TabType, TotoType } from '../types';

interface SidebarProps {
  currentTab: TabType;
  selectedTotoType: TotoType;
  selectedYear: number;
  selectedRound: number;
  onSelectTab: (tab: TabType) => void;
  onSelectTotoType: (totoType: TotoType) => void;
  onOpenCalc?: (calc: string) => void;
}

export function Sidebar({
  currentTab,
  selectedTotoType,
  selectedYear,
  selectedRound,
  onSelectTab,
  onSelectTotoType,
  onOpenCalc
}: SidebarProps) {
  return (
    <aside className="side_menu w-full lg:w-72 space-y-4 shrink-0">
      {/* ======================================================== */}
      {/* 1. 수리 퀀트 & 배당률 계산기 (Mathematical Calculators) */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-2.5">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <span>수리 퀀트 & 배당률 계산기</span>
          </h3>
        </div>

        <div className="space-y-2">
          {/* Button 1: Shin's Model */}
          <button
            onClick={() => onOpenCalc?.('shin')}
            className="w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between bg-blue-50/80 hover:bg-blue-100/90 text-blue-700 border border-blue-100 shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🧮</span>
              <span className="font-black">신스 모형(Shin's) 배당률 계산기</span>
            </div>
            <span className="text-blue-500 group-hover:translate-x-0.5 transition-transform font-bold">→</span>
          </button>

          {/* Button 2: Soccer Toto Portfolio */}
          <button
            onClick={() => onOpenCalc?.('portfolio')}
            className="w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚽</span>
              <span className="font-black">축구 승무패 포트폴리오 계산기</span>
            </div>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform font-bold">→</span>
          </button>

          {/* Button 3: Baseball Skellam */}
          <button
            onClick={() => onOpenCalc?.('baseball_skellam')}
            className="w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚾</span>
              <span className="font-black">야구 승1패 스켈람 분석기</span>
            </div>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform font-bold">→</span>
          </button>

          {/* Button 4: Basketball Gaussian */}
          <button
            onClick={() => onOpenCalc?.('basketball_gaussian')}
            className="w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🏀</span>
              <span className="font-black">농구 승5패 가우시안 분석기</span>
            </div>
            <span className="text-slate-400 group-hover:translate-x-0.5 transition-transform font-bold">→</span>
          </button>

          {/* Button 5: Overseas Odds RapidAPI */}
          <button
            onClick={() => onOpenCalc?.('overseas_odds')}
            className="w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between bg-indigo-50/80 hover:bg-indigo-100/90 text-indigo-700 border border-indigo-100 shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🌍</span>
              <span className="font-black">해외배당 연동 (RapidAPI)</span>
            </div>
            <span className="text-indigo-500 group-hover:translate-x-0.5 transition-transform font-bold">→</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. 와이즈토토 프로토 동기화 안내 (Wisetoto Sync Info) */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-2.5">
        <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
          <span>와이즈토토 프로토 동기화 안내</span>
        </h3>

        <ul className="space-y-2 text-xs text-slate-600 leading-relaxed">
          <li className="flex items-start gap-1.5">
            <span className="text-slate-400 font-black">•</span>
            <span>과부하 방지 딜레이 모드로 2009~2026 전 회차 실시간 연동.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-slate-400 font-black">•</span>
            <span>일반, 핸디캡(H+), 언더오버(U/O) 배당률 자동 파싱.</span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="text-slate-400 font-black">•</span>
            <span>국내외 배당 비교 및 퀀트 수리 모델 즉시 실행.</span>
          </li>
        </ul>
      </div>

      {/* ======================================================== */}
      {/* 3. 토토 카테고리 (14경기) 빠른 전환 */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>토토 카테고리 (14경기)</span>
          </h3>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
            회차 연동
          </span>
        </div>

        <div className="space-y-1.5">
          <button
            onClick={() => {
              onSelectTotoType('sc');
              onSelectTab('toto');
            }}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
              currentTab === 'toto' && selectedTotoType === 'sc'
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚽</span>
              <div>
                <div className="font-black">축구승무패 (14경기)</div>
                <div className={`text-[10px] ${currentTab === 'toto' && selectedTotoType === 'sc' ? 'text-blue-100' : 'text-gray-500'}`}>
                  2009~2026년 (1~87회차)
                </div>
              </div>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => {
              onSelectTotoType('bs');
              onSelectTab('toto');
            }}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
              currentTab === 'toto' && selectedTotoType === 'bs'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">⚾</span>
              <div>
                <div className="font-black">야구승1패 (14경기)</div>
                <div className={`text-[10px] ${currentTab === 'toto' && selectedTotoType === 'bs' ? 'text-emerald-100' : 'text-gray-500'}`}>
                  2009~2026년 (1~79회차)
                </div>
              </div>
            </div>
            <span>→</span>
          </button>

          <button
            onClick={() => {
              onSelectTotoType('bk');
              onSelectTab('toto');
            }}
            className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between border cursor-pointer ${
              currentTab === 'toto' && selectedTotoType === 'bk'
                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                : 'bg-gray-50 text-gray-800 hover:bg-gray-100 border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🏀</span>
              <div>
                <div className="font-black">농구승5패 (14경기)</div>
                <div className={`text-[10px] ${currentTab === 'toto' && selectedTotoType === 'bk' ? 'text-amber-100' : 'text-gray-500'}`}>
                  2009~2026년 (1~48회차)
                </div>
              </div>
            </div>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. ML 자동 최적화 엔진 상태 (ML Engine Status) */}
      {/* ======================================================== */}
      <div className="bg-emerald-950/30 border border-emerald-800/50 p-4 rounded-2xl text-white space-y-3">
        <div className="flex items-center justify-between border-b border-emerald-800/40 pb-2">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-emerald-200">ML 자동 최적화 엔진</h4>
          </div>
          <span className="text-[10px] bg-emerald-900/80 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-700/60 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            동작중
          </span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">브라이어 손실 (Brier):</span>
            <span className="font-mono text-emerald-300 font-bold">0.138 (Loss 최소화)</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">ML 반복 학습:</span>
            <span className="font-mono text-amber-300 font-bold">25,000 Epochs</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">자동 튜닝 파라미터:</span>
            <span className="text-indigo-300 font-medium">Shin z / Elo λ / Kelly</span>
          </div>
        </div>

        <div className="bg-emerald-900/40 p-2 rounded-lg border border-emerald-800/60 text-[10px] text-emerald-200 leading-relaxed flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
          <span>과거 2,450경기 실전 결과 기반 머신러닝 최적 파라미터가 실시간 퀀트 모형에 주입됩니다.</span>
        </div>
      </div>
    </aside>
  );
}
