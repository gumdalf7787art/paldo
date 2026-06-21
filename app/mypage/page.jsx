'use client';


export const dynamic = 'force-dynamic';
import React, { Suspense } from 'react';
import MyPage from '../../src/pages/MyPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <MyPage />
    </Suspense>
  );
}
