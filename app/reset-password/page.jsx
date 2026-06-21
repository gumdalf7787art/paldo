'use client';


export const dynamic = 'force-dynamic';
import React, { Suspense } from 'react';
import ResetPasswordPage from '../../src/pages/ResetPasswordPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
