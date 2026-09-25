import React, { useState } from 'react';
import { 
  Upload, 
  Copy, 
  CheckCircle2, 
  FileCode, 
  AlertCircle, 
  Download, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  ShieldCheck,
  X
} from 'lucide-react';

interface WisetotoImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

const DEVTOOLS_SCRIPT = `(async () => {
  // 서버 부담 방지를 위해 낮게 유지하세요.
  const CONCURRENCY = 2;
  const REQUEST_GAP_MS = 250;

  const TARGET_TABS = [
    "match_record",  // 상대전적
    "latest_record", // 최근전적
    "statistics",    // 기록통계
    "lineup",        // 라인업
    "league_rank",   // 리그순위
  ];

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const tidy = (value) =>
    (value || "")
      .replace(/\\u00a0/g, " ")
      .replace(/\\s+/g, " ")
      .trim();

  const quotedArgs = (text) =>
    [...(text || "").matchAll(/'([^']*)'/g)].map((match) => match[1]);

  function getGamesFromPage() {
    const seen = new Set();
    return [...document.querySelectorAll('[onclick*="get_gameinfo_detail("]')]
      .map((el) => {
        const onclick = el.getAttribute("onclick") || "";
        const args = quotedArgs(onclick);
        return {
          schedule_info_seq: args[0],
          game_no: args[1],
          game_category: args[2],
          tab_type: args[3],
          game_year: args[4],
          game_round: args[5],
          league_info_seq: args[6],
          pt1_half_game: args[7] || "n",
        };
      })
      .filter((game) => {
        if (!game.schedule_info_seq || !game.game_no) return false;
        const key = \`\${game.schedule_info_seq}_\${game.game_no}\`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  async function fetchText(url, retries = 3) {
    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, { credentials: "same-origin" });
        if (!response.ok) throw new Error(\`HTTP \${response.status}\`);
        return await response.text();
      } catch (error) {
        lastError = error;
        if (attempt < retries) await sleep(1000 * attempt);
      }
    }
    throw lastError;
  }

  function extractHTML(raw) {
    return raw.split("|!|")[0];
  }

  function tablesToJSON(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return [...doc.querySelectorAll("table")].map((table, tableIndex) => {
      const rows = [...table.querySelectorAll("tr")]
        .map((tr) =>
          [...tr.querySelectorAll(":scope > th, :scope > td")]
            .map((cell) => ({
              value: tidy(cell.innerText),
              type: cell.tagName.toLowerCase(),
              colspan: Number(cell.getAttribute("colspan") || 1),
              rowspan: Number(cell.getAttribute("rowspan") || 1),
            }))
            .filter((cell) => cell.value)
        )
        .filter((row) => row.length);

      return {
        tableIndex,
        className: table.className || "",
        rows,
      };
    });
  }

  async function getScheduleDetail(game) {
    const query = new URLSearchParams({
      schedule_info_seq: game.schedule_info_seq,
      game_no: game.game_no,
      div_id: \`\${game.schedule_info_seq}_\${game.game_no}\`,
      game_category: game.game_category,
      tab_type: game.tab_type,
      game_year: game.game_year,
      game_round: game.game_round,
      page_type: window.page_type || "",
      league_info_seq: game.league_info_seq,
      pt1_half_game: game.pt1_half_game,
    });

    const raw = await fetchText(\`/util/gameinfo/get_schedule_detail.htm?\${query.toString()}\`);
    const html = extractHTML(raw);
    const doc = new DOMParser().parseFromString(html, "text/html");
    const tabs = {};

    for (const el of doc.querySelectorAll('[onclick*="change_detail_tab("]')) {
      const args = quotedArgs(el.getAttribute("onclick"));
      const tabName = args[0];
      if (!tabName) continue;

      tabs[tabName] = {
        schedule_info_seq: args[1] || game.schedule_info_seq,
        tab_type: args[2] || "",
        game_no: args[3] || "",
        game_year: args[4] || "",
        game_round: args[5] || "",
        league_info_seq: args[6] || "",
        limit: args[7] || "",
        same_home_away: args[8] || "",
        sports: args[9] || "",
      };
    }
    return tabs;
  }

  async function getDetailTab(tabName, params) {
    const query = new URLSearchParams({
      schedule_info_seq: params.schedule_info_seq,
      tab_type: params.tab_type,
      game_year: params.game_year,
      game_round: params.game_round,
      game_no: params.game_no,
      league_info_seq: params.league_info_seq,
      limit: params.limit,
      same_home_away: params.same_home_away,
    });

    const endpoint = \`/util/gameinfo/get_detail_\${tabName}.htm?\${query.toString()}\`;
    const raw = await fetchText(endpoint);
    const html = extractHTML(raw);

    return {
      endpoint: new URL(endpoint, location.origin).href,
      params,
      tables: tablesToJSON(html),
    };
  }

  async function crawlGame(game, index, total) {
    const result = {
      game: {
        schedule_info_seq: game.schedule_info_seq,
        game_no: game.game_no,
        game_category: game.game_category,
        tab_type: game.tab_type,
        game_year: game.game_year,
        game_round: game.game_round,
        league_info_seq: game.league_info_seq,
      },
      data: {},
      errors: [],
    };

    try {
      console.log(\`[\${index + 1}/\${total}] 경기 수집 중: \${game.schedule_info_seq}_\${game.game_no}\`);
      const tabs = await getScheduleDetail(game);

      for (const tabName of TARGET_TABS) {
        if (!tabs[tabName]) {
          result.errors.push({ tab: tabName, error: "해당 경기에서 탭을 제공하지 않음" });
          continue;
        }

        try {
          result.data[tabName] = await getDetailTab(tabName, tabs[tabName]);
        } catch (error) {
          result.errors.push({ tab: tabName, error: String(error.message || error) });
        }
        await sleep(REQUEST_GAP_MS);
      }
    } catch (error) {
      result.errors.push({ tab: "schedule_detail", error: String(error.message || error) });
    }

    return result;
  }

  async function mapWithConcurrency(items, limit, worker) {
    const output = new Array(items.length);
    let cursor = 0;

    async function run() {
      while (true) {
        const index = cursor++;
        if (index >= items.length) return;
        output[index] = await worker(items[index], index, items.length);
      }
    }

    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
    return output;
  }

  const games = getGamesFromPage();
  if (!games.length) throw new Error("경기 목록을 찾지 못했습니다. 와이즈토토 경기 목록 페이지에서 실행하세요.");

  console.log(\`총 \${games.length}경기 수집 시작\`);
  const gamesData = await mapWithConcurrency(games, CONCURRENCY, crawlGame);

  const payload = {
    scrapedAt: new Date().toISOString(),
    sourcePage: location.href,
    totalGames: games.length,
    targetTabs: TARGET_TABS,
    games: gamesData,
  };

  const fileName = \`wisetoto_\${games[0].game_year}_\${games[0].game_round}_all_games.json\`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const download = document.createElement("a");
  download.href = URL.createObjectURL(blob);
  download.download = fileName;
  download.click();
  setTimeout(() => URL.revokeObjectURL(download.href), 1000);

  console.log(\`수집 완료: \${games.length}경기\`);
  return payload;
})();`;

export function WisetotoImportModal({ isOpen, onClose, onImportSuccess }: WisetotoImportModalProps) {
  const [copied, setCopied] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(DEVTOOLS_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonText(content);
      processUpload(content);
    };
    reader.readAsText(file);
  };

  const processUpload = async (rawJson: string) => {
    try {
      setIsUploading(true);
      setUploadResult(null);

      const parsed = JSON.parse(rawJson);
      const res = await fetch('/api/wisetoto/import-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setUploadResult({
          success: true,
          message: data.message || `총 ${data.importedCount}개 경기 데이터 동기화 완료!`,
          count: data.importedCount
        });
        if (onImportSuccess) onImportSuccess();
      } else {
        setUploadResult({
          success: false,
          message: data.message || '데이터 형식 오류로 동기화에 실패했습니다.'
        });
      }
    } catch (err: any) {
      setUploadResult({
        success: false,
        message: '유효한 JSON 파일이 아닙니다: ' + (err.message || String(err))
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="wisetoto-import-modal"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-slate-200"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                와이즈토토 5대 핵심 탭 전수 수집기 & JSON 동기화
              </h2>
              <p className="text-xs text-slate-400">
                상대전적·최근전적·기록통계·라인업·리그순위를 브라우저 콘솔에서 추출 후 즉시 동기화합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Target Tabs Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { tab: 'match_record', name: '1. 상대전적', desc: '맞대결 승무패·득실점', color: 'border-blue-500/40 text-blue-300 bg-blue-950/30' },
              { tab: 'latest_record', name: '2. 최근전적', desc: '5경기 폼 & 득실점', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/30' },
              { tab: 'statistics', name: '3. 기록통계', desc: '슈팅·점유율·세부스탯', color: 'border-amber-500/40 text-amber-300 bg-amber-950/30' },
              { tab: 'lineup', name: '4. 실시간 라인업', desc: '선발·결장·부상선수', color: 'border-rose-500/40 text-rose-300 bg-rose-950/30' },
              { tab: 'league_rank', name: '5. 리그순위', desc: '순위표·승점·골득실', color: 'border-purple-500/40 text-purple-300 bg-purple-950/30' },
            ].map((item) => (
              <div key={item.tab} className={`p-3 rounded-xl border ${item.color} flex flex-col justify-between`}>
                <div className="font-bold text-sm text-white">{item.name}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">{item.desc}</div>
                <div className="text-[9px] font-mono text-slate-500 mt-2 truncate">/get_detail_{item.tab}.htm</div>
              </div>
            ))}
          </div>

          {/* STEP 1: Copy Chrome DevTools Script */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">1</span>
                <span className="font-bold text-slate-200">와이즈토토 페이지에서 개발자도구(F12) 콘솔 실행</span>
              </div>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '스크립트 복사 완료!' : '스크립트 전체 복사'}</span>
              </button>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              와이즈토토 프로토/토토 경기 목록 페이지(<span className="font-mono text-blue-300">wisetoto.com</span>)에서 <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono">F12</kbd> (또는 <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-mono">Ctrl+Shift+I</kbd>)를 누른 후 <strong>Console</strong> 탭에 붙여넣고 Enter를 치면 자동으로 모든 경기의 5개 탭을 수집하여 <code className="font-mono text-amber-300">wisetoto_YYYY_RR_all_games.json</code> 파일로 다운로드됩니다.
            </p>
          </div>

          {/* STEP 2: Upload or Drop JSON */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">2</span>
              <span className="font-bold text-slate-200">다운로드된 JSON 파일 업로드 / 붙여넣기</span>
            </div>

            {/* Dropzone */}
            <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-900/50 hover:bg-slate-900 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors group">
              <input 
                type="file" 
                accept=".json"
                onChange={handleFileChange}
                className="hidden" 
              />
              <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 mb-2 transition-colors" />
              <div className="font-bold text-slate-300 text-sm">
                JSON 파일을 여기로 드래그하거나 클릭하여 선택
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                wisetoto_2026_106_all_games.json 등
              </div>
            </label>

            {/* Direct Paste Fallback */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>또는 JSON 텍스트 직접 붙여넣기:</span>
                {jsonText && (
                  <button 
                    onClick={() => setJsonText('')}
                    className="text-slate-500 hover:text-slate-300 underline"
                  >
                    내용 비우기
                  </button>
                )}
              </div>
              <textarea
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder='{"scrapedAt": "...", "games": [...] } 형식의 JSON 데이터 붙여넣기'
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500 resize-none"
              />
              {jsonText && !uploadResult && (
                <button
                  onClick={() => processUpload(jsonText)}
                  disabled={isUploading}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isUploading ? '데이터 파싱 및 삼각 동기화 중...' : '붙여넣은 JSON 데이터 즉시 동기화 적용'}</span>
                </button>
              )}
            </div>

            {/* Status Messages */}
            {uploadResult && (
              <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                uploadResult.success 
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
                  : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
              }`}>
                {uploadResult.success ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">
                    {uploadResult.success ? '동기화 완료' : '동기화 실패'}
                  </div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {uploadResult.message}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>상대전적 ↔ 최근 5경기 ↔ 순위표 삼각 동기화 엔진(synchronizeTriangularData) 자동 적용</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
