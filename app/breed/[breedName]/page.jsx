'use client';


export const dynamic = 'force-dynamic';
import React, { Suspense } from 'react';
import BreedPage from '../../../src/pages/BreedPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <BreedPage />
    </Suspense>
  );
}
