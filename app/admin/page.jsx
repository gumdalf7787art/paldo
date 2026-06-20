'use client';

import React, { Suspense } from 'react';
import AdminPage from '../../src/pages/AdminPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <AdminPage />
    </Suspense>
  );
}
