'use client';


export const dynamic = 'force-dynamic';
import React, { Suspense } from 'react';
import PrivacyPage from '../../src/pages/PrivacyPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <PrivacyPage />
    </Suspense>
  );
}
