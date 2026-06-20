'use client';

import React, { Suspense } from 'react';
import DetailPage from '../../src/pages/DetailPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <DetailPage />
    </Suspense>
  );
}
