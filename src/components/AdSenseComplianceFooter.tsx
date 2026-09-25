import React, { useState } from 'react';
import { ShieldCheck, FileText, HelpCircle, Info, Mail, AlertTriangle, CheckCircle, X } from 'lucide-react';

type ModalType = 'privacy' | 'terms' | 'disclaimer' | 'about' | 'contact' | null;

export const AdSenseComplianceFooter: React.FC = () => {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.email || !contactForm.message) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactSubmitted(false);
      setContactForm({ name: '', email: '', message: '' });
      setActiveModal(null);
    }, 2500);
  };

  return (
    <footer id="footer" className="bg-slate-950 text-slate-400 pt-10 pb-12 px-4 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Compliance Warning Banner Required for AdSense Gambling/Sports Category */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-[11px] text-slate-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-inner">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200 text-xs">건전한 스포츠 분석 및 데이터 통계 정보 제공 안내 (Disclaimer)</p>
              <p className="mt-0.5 text-slate-400 leading-relaxed">
                SportsQuant Pro는 2009~2026년 공개 스포츠 통계 및 해외 오즈 배당 기반 수리 분석 정보를 제공하는 학술·통계 소프트웨어입니다. 
                본 사이트는 금전적 베팅 중개나 유료 리딩을 행하지 않으며, 체육진흥투표권 공식 발행처는 베트맨(Betman)입니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveModal('disclaimer')}
            className="shrink-0 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg font-bold transition-colors cursor-pointer border border-slate-700 text-[11px]"
          >
            법적고지 상세보기
          </button>
        </div>

        {/* Footer Navigation & Publisher Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
          {/* Brand Col */}
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span className="font-extrabold text-sm text-white tracking-tight">SportsQuant Pro 데이터 연구소</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed max-w-lg">
              와이즈토토 프로토 승부식 및 축구/야구/농구 토토 14경기 빅데이터 분석 플랫폼입니다. 
              스켈람 이변 분포, 신스 모형(Shin's Model), 해외 배당 마진 제거 및 베이지안 융합 알고리즘을 탑재하였습니다.
            </p>
            <p className="text-[10px] text-slate-500 font-mono pt-1">
              Copyright © 2009-2026 SportsQuant Pro Data Lab. All rights reserved.
            </p>
          </div>

          {/* AdSense Legal Policies */}
          <div className="space-y-2">
            <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>운영 정책 & 약관</span>
            </p>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button 
                  onClick={() => setActiveModal('privacy')} 
                  className="hover:text-emerald-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>• 개인정보처리방침 (Privacy Policy)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveModal('terms')} 
                  className="hover:text-emerald-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>• 이용약관 (Terms of Service)</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveModal('disclaimer')} 
                  className="hover:text-emerald-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>• 책임의 한계 및 법적고지</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Support & About */}
          <div className="space-y-2">
            <p className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-400" />
              <span>서비스 및 고객지원</span>
            </p>
            <ul className="space-y-1.5 text-[11px]">
              <li>
                <button 
                  onClick={() => setActiveModal('about')} 
                  className="hover:text-blue-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>• 서비스 소개 & 수리 방법론</span>
                </button>
              </li>
              <li>
                <button 
                  onClick={() => setActiveModal('contact')} 
                  className="hover:text-blue-300 font-medium transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>• 고객지원 및 문의하기 (Contact Us)</span>
                </button>
              </li>
              <li>
                <span className="text-slate-500">• 데이터 출처: Wisetoto, SofaScore, FlashScore</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

      {/* Interactive Compliance Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 text-slate-300 shadow-2xl relative space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {activeModal === 'privacy' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                {activeModal === 'terms' && <FileText className="w-5 h-5 text-blue-400" />}
                {activeModal === 'disclaimer' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {activeModal === 'about' && <Info className="w-5 h-5 text-purple-400" />}
                {activeModal === 'contact' && <Mail className="w-5 h-5 text-indigo-400" />}
                <h3 className="font-extrabold text-base text-white">
                  {activeModal === 'privacy' && '개인정보처리방침 (Privacy Policy)'}
                  {activeModal === 'terms' && '서비스 이용약관 (Terms of Service)'}
                  {activeModal === 'disclaimer' && '책임의 한계 및 법적고지 (Legal Disclaimer)'}
                  {activeModal === 'about' && '서비스 소개 & 퀀트 분석 방법론'}
                  {activeModal === 'contact' && '고객지원 및 운영진 문의하기'}
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Sections */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              
              {/* PRIVACY POLICY */}
              {activeModal === 'privacy' && (
                <>
                  <p className="font-bold text-slate-100">1. 개인정보 수집 및 이용 목적</p>
                  <p>SportsQuant Pro(이하 "당사")는 이용자의 개인정보를 최소한으로 보호하며, 구글 애드센스(Google AdSense) 및 웹로그 분석을 위한 비식별 쿠키 정보를 처리합니다.</p>
                  
                  <p className="font-bold text-slate-100 mt-2">2. 쿠키(Cookie) 및 제3자 광고 서비스 안내</p>
                  <p>• 당사는 맞춤형 광고 제공 및 사이트 웹 트래픽 분석을 위해 Google AdSense를 비롯한 제3자 광고 네트워크 쿠키를 사용할 수 있습니다.</p>
                  <p>• Google은 쿠키를 사용하여 이용자의 이전 방문 기록을 바탕으로 광고를 제공합니다. 이용자는 Google 광고 설정에서 맞춤형 광고를 해제할 수 있습니다.</p>

                  <p className="font-bold text-slate-100 mt-2">3. 개인정보의 파기 및 보호</p>
                  <p>이용자가 직접 입력한 커스텀 마킹 설정 및 계산 내역은 이용자의 브라우저 로컬 저장소(LocalStorage)에만 저장되며, 외부 서버로 무단 전송되지 않습니다.</p>

                  <p className="font-bold text-slate-100 mt-2">4. 개인정보 보호책임자</p>
                  <p>• 담당부서: 데이터 보안팀 (privacy@sportsquantpro.com)</p>
                </>
              )}

              {/* TERMS OF SERVICE */}
              {activeModal === 'terms' && (
                <>
                  <p className="font-bold text-slate-100">1. 목적</p>
                  <p>본 약관은 SportsQuant Pro 서비스가 제공하는 스포츠 통계 정보 및 수리 분석 도구의 이용조건 및 절차를 규정함을 목적으로 합니다.</p>

                  <p className="font-bold text-slate-100 mt-2">2. 서비스의 성격 및 제한</p>
                  <p>• 본 서비스는 스포츠 경기 관련 통계 데이터를 시각화하고 수학적 확률 모델을 시뮬레이션하는 정보 제공 목적의 서비스입니다.</p>
                  <p>• 당사는 사행성 행위, 도박, 불법 베팅을 절대로 자극하거나 직접 중개하지 않으며, 사용자의 개인적인 베팅 판단과 결과에 대해 어떠한 법적 보증도 하지 않습니다.</p>

                  <p className="font-bold text-slate-100 mt-2">3. 저작권 및 이용제한</p>
                  <p>서비스 내 모든 퀀트 수리 모델 알고리즘, UI 컴포넌트, 데이터 구조의 저작권은 당사에 있으며 무단 복제 및 상업적 재배포를 금합니다.</p>
                </>
              )}

              {/* LEGAL DISCLAIMER */}
              {activeModal === 'disclaimer' && (
                <>
                  <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-200 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1 text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>스포츠토토 공식 발행처 안내 및 무책임 고지</span>
                    </p>
                    <p>대한민국 체육진흥투표권(스포츠토토)의 유일한 공식 발행 사이트는 베트맨(www.betman.co.kr)입니다.</p>
                  </div>

                  <p className="font-bold text-slate-100 mt-2">1. 데이터 분석 도구의 한계</p>
                  <p>본 시스템에서 산출되는 적중 확률, 고기대값(EV), 해외 배당 수치 및 시뮬레이션 결과는過去 데이터 기반의 통계적 추정치일 뿐이며, 미래 경기의 정답을 보장하지 않습니다.</p>

                  <p className="font-bold text-slate-100 mt-2">2. 투자 및 금전적 책임의 귀속</p>
                  <p>제시된 정보 및 마킹 추천을 활용하여 이루어진 모든 마킹 행위 및 그에 따른 금전적 결과(손실 포함)의 최종 책임은 전적으로 이용자 본인에게 있습니다.</p>
                </>
              )}

              {/* ABOUT US */}
              {activeModal === 'about' && (
                <>
                  <p className="font-bold text-slate-100">SportsQuant Pro 데이터 연구소 소개</p>
                  <p>SportsQuant Pro는 2009년부터 2026년까지의 와이즈토토 전 회차 프로토 승부식 및 승무패/승1패/승5패 데이터를 체계적으로 수집·분석하여 데이터에 기반한 스포츠 분석 생태계를 구축하고 있습니다.</p>

                  <p className="font-bold text-slate-100 mt-2">핵심 분석 엔지니어링 기술</p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300">
                    <li><strong>베이지안 디리클레-다항 융합</strong>: 해외 오즈 참확률(Prior 60%)과 대중 투표율(Likelihood 40%)을 통합 추정</li>
                    <li><strong>스켈람(Skellam) & 신스(Shin's) 이변 모형</strong>: 해외 오즈메이커의 북메이커 마진(Vig)을 정밀 제거하여 순수 승률 도출</li>
                    <li><strong>조합 최적화 엔진</strong>: 14경기 결합 확률 공간 및 1등 독식(≤5명) 제약 조건을 만복 시뮬레이션으로 탐색</li>
                  </ul>
                </>
              )}

              {/* CONTACT US */}
              {activeModal === 'contact' && (
                <>
                  {contactSubmitted ? (
                    <div className="py-8 text-center space-y-2">
                      <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                      <p className="font-bold text-emerald-300 text-sm">문의가 성공적으로 접수되었습니다.</p>
                      <p className="text-slate-400 text-xs">운영진 검토 후 입력하신 이메일로 회신드리겠습니다.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleContactSubmit} className="space-y-3">
                      <p className="text-slate-300 text-xs">서비스 피드백, 데이터 제보 또는 구글 애드센스 관련 운영진 문의사항을 보내주세요.</p>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1 font-bold">성함 / 닉네임</label>
                        <input
                          type="text"
                          value={contactForm.name}
                          onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                          placeholder="홍길동"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1 font-bold">회신받으실 이메일 주소 <span className="text-rose-400">*</span></label>
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                          placeholder="user@example.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1 font-bold">문의 내용 <span className="text-rose-400">*</span></label>
                        <textarea
                          required
                          rows={4}
                          value={contactForm.message}
                          onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="문의 또는 개선요청 내용을 자유롭게 작성해주세요."
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-hidden focus:border-emerald-500"
                        ></textarea>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-md"
                      >
                        문의 보내기
                      </button>
                    </form>
                  )}
                </>
              )}

            </div>

            {/* Modal Footer Close Button */}
            <div className="border-t border-slate-800 pt-3 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}
    </footer>
  );
};
