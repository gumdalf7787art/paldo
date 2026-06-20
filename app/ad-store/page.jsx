'use client';

import React, { Suspense } from 'react';
import AdStorePage from '../../src/pages/AdStorePage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <AdStorePage />
    </Suspense>
  );
}
