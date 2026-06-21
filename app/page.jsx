'use client';


export const dynamic = 'force-dynamic';
import React from 'react';
import { HeroCarousel, AdSections, AdoptionList, LoginWidget, PersonalRecommendWidget } from '../src/components/Sections';
import SearchBar from '../src/components/SearchBar';

export default function HomePage() {
  return (
    <main className="container" style={{ padding: '0 20px' }}>
      {/* 1. 최상단 가로형 대표 강아지 홍보 배너 배치 */}
      <HeroCarousel />
      
      {/* 2. 검색창 배치 및 인기견종 통합 */}
      <SearchBar />
      
      {/* 3. 2컬럼 레이아웃 (Main 콘텐츠 / Sidebar 위젯) */}
      <div className="main-portal-layout">
        {/* 좌측 메인 영역 */}
        <div className="portal-main-col">
          <AdSections />
          <AdoptionList />
        </div>
        
        {/* 우측 사이드바 영역 */}
        <div className="portal-side-col">
          <LoginWidget />
          
          {/* 입양 안내 위젯 */}
          <div style={{
            backgroundColor: '#FFF8F6',
            border: '1px solid #FFECE5',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'var(--shadow)',
            marginBottom: '10px'
          }}>
            <h4 style={{ color: '#E65100', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              💡 안심 입양 가이드
            </h4>
            <ul style={{ fontSize: '0.8rem', color: '#6D4C41', display: 'flex', flexDirection: 'column', gap: '6px', padding: 0, listStyle: 'none' }}>
              <li>• 분양 시 반드시 <b>동물판매업 등록번호</b>를 확인하세요.</li>
              <li>• 직접 매장을 방문하여 아이의 건강 상태를 살피는 것이 좋습니다.</li>
              <li>• 계약서 작성 시 15일 이내 폐사/질병에 대한 보상 조건을 확인하세요.</li>
            </ul>
          </div>

          {/* 맞춤형 개별 추천 위젯 */}
          <PersonalRecommendWidget />
        </div>
      </div>
    </main>
  );
}
