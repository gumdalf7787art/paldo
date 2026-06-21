'use client';


export const dynamic = 'force-dynamic';
import React, { Suspense } from 'react';
import StorePage from '../../../src/pages/StorePage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <StorePage />
    </Suspense>
  );
}
