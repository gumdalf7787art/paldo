'use client';

import React, { Suspense } from 'react';
import TermsPage from '../../src/pages/TermsPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <TermsPage />
    </Suspense>
  );
}
