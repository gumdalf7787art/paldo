'use client';

import React, { Suspense } from 'react';
import SignupPage from '../../src/pages/SignupPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <SignupPage />
    </Suspense>
  );
}
