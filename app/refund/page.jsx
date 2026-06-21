'use client';


export const dynamic = 'force-dynamic';
import React, { Suspense } from 'react';
import RefundPolicyPage from '../../src/pages/RefundPolicyPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <RefundPolicyPage />
    </Suspense>
  );
}
