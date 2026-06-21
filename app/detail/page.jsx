'use client';


export const dynamic = 'force-dynamic';
import React, { Suspense } from 'react';
import DetailPage from '../../src/pages/DetailPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <DetailPage />
    </Suspense>
  );
}
