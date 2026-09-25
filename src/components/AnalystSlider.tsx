import React from 'react';

export function AnalystSlider() {
  const analysts = [
    { name: "유상열", sports: "축구", title: "판매왕 · MLS언옵왕", hit: "13.2배", streak: "5연속 적중" },
    { name: "김홍석", sports: "농구", title: "농구 전문위원", hit: "5.9배", streak: "야구 9연속" },
    { name: "2월30일생", sports: "농구", title: "스페셜 마스터", hit: "16.3배", streak: "라리가 83%" },
    { name: "민준킴", sports: "야구", title: "KBO 분석위원", hit: "10.0배", streak: "야구 13연속" },
    { name: "류동혁", sports: "농구", title: "승5패 26회차 1등", hit: "18.4배", streak: "승5패 👑" },
    { name: "박명표", sports: "야구", title: "해외배당 분석가", hit: "23.0배", streak: "야구 10연속" }
  ];

  return (
    <div className="analyst_wrap bg-slate-900 text-white py-3 px-4 overflow-x-auto shadow-inner">
      <div className="max-w-7xl mx-auto flex items-center gap-6">
        <span className="text-xs font-bold text-amber-400 bg-amber-950 px-2.5 py-1 rounded-md shrink-0 border border-amber-800">
          🔥 TOP 분석위원 리얼타임 픽
        </span>
        <div className="flex items-center gap-6 overflow-x-auto no-scrollbar py-1">
          {analysts.map((a, i) => (
            <div key={i} className="flex items-center gap-3 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 shrink-0 hover:border-blue-500 transition-all cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-blue-600 font-bold flex items-center justify-center text-xs shadow-xs">
                {a.name[0]}
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold">{a.name}</span>
                  <span className="text-[10px] bg-blue-950 text-blue-300 px-1 rounded">{a.sports}</span>
                </div>
                <div className="text-slate-300 font-mono text-[11px]">최근 평균 <strong className="text-amber-400">{a.hit}</strong> ({a.streak})</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
