'use client';

export const runtime = 'edge';

import React, { Suspense } from 'react';
import AdSetupPage from '../../../src/pages/AdSetupPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <AdSetupPage />
    </Suspense>
  );
}
