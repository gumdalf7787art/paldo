'use client';

import React, { Suspense } from 'react';
import LoginPage from '../../src/pages/LoginPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
