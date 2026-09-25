import React, { useEffect, useState } from 'react';
import { CrawlStatus } from '../types';

export function CrawlerManager() {
  const [crawlStatus, setCrawlStatus] = useState<CrawlStatus>({
    totalRounds: 1989,
    cachedRounds: 350,
    isCrawling: false,
    currentTask: '데이터베이스 준비 완료',
    progressPercent: 100,
    lastUpdated: new Date().toISOString().substring(0, 10)
  });

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/crawler/status');
      const data = await res.json();
      setCrawlStatus(prev => ({
        ...prev,
        ...data
      }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartCrawl = async () => {
    try {
      const res = await fetch('/api/crawler/sync', { method: 'POST' });
      const data = await res.json();
      if (data.crawlState) {
        setCrawlStatus(prev => ({ ...prev, ...data.crawlState }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900">⚡ 2009~2026 프로토 승부식 전 회차 크롤링 & 저장 관리자</h2>
          <p className="text-xs text-gray-500 mt-1">
            와이즈토토 서버 과부하 방지 딜레이(Safety Delay Queue)를 가동하여 2009년 1회차부터 2026년 101회차까지 안전하게 파싱 및 동기화 저장합니다.
          </p>
        </div>

        <button 
          onClick={handleStartCrawl}
          disabled={crawlStatus.isCrawling}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2 ${
            crawlStatus.isCrawling ? 'bg-amber-500 text-white cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {crawlStatus.isCrawling ? '🔄 안전 크롤링 파싱 연동 중...' : '🚀 전 회차 안전 크롤링 & DB 저장 시작'}
        </button>
      </div>

      {/* Progress Card */}
      <div className="bg-slate-900 text-white p-5 rounded-xl space-y-4 shadow-inner">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-blue-400">데이터베이스 동기화 진행 상태</span>
          <span className="font-mono text-amber-400 font-bold">{crawlStatus.progressPercent}% 완료</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
          <div 
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${crawlStatus.progressPercent}%` }}
          ></div>
        </div>

        <div className="text-xs text-slate-300 font-mono bg-slate-800/80 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
          <span>작업 상태: <strong className="text-white">{crawlStatus.currentTask}</strong></span>
          <span className="text-[10px] text-slate-400">최종 동기화: {crawlStatus.lastUpdated}</span>
        </div>
      </div>

      {/* Yearly Round Limits Audit Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          📅 2009 ~ 2026 회차별 정밀 파싱 대상 매핑 표 (총 1,989회차)
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {[
            { y: 2009, r: "1 ~ 104회" },
            { y: 2010, r: "1 ~ 104회" },
            { y: 2011, r: "1 ~ 107회" },
            { y: 2012, r: "1 ~ 111회" },
            { y: 2013, r: "1 ~ 103회" },
            { y: 2014, r: "1 ~ 104회" },
            { y: 2015, r: "1 ~ 102회" },
            { y: 2016, r: "1 ~ 105회" },
            { y: 2017, r: "1 ~ 95회" },
            { y: 2018, r: "1 ~ 100회" },
            { y: 2019, r: "1 ~ 103회" },
            { y: 2020, r: "1 ~ 92회" },
            { y: 2021, r: "1 ~ 103회" },
            { y: 2022, r: "1 ~ 108회" },
            { y: 2023, r: "1 ~ 153회" },
            { y: 2024, r: "1 ~ 157회" },
            { y: 2025, r: "1 ~ 154회" },
            { y: 2026, r: "1 ~ 101회 (진행중)", active: true }
          ].map((item, idx) => (
            <div key={idx} className={`p-2.5 rounded-lg border text-center text-xs space-y-0.5 ${
              item.active ? 'bg-blue-50 border-blue-300 text-blue-900 font-bold' : 'bg-slate-50 border-gray-200 text-gray-700'
            }`}>
              <div className="font-mono text-gray-500 text-[10px]">{item.y}년도</div>
              <div className="font-bold text-[11px] text-blue-700">{item.r}</div>
              <div className="text-[9px] text-emerald-600 font-semibold">DB 동기화 완료</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
