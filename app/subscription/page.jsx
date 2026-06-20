'use client';

import React, { Suspense } from 'react';
import SubscriptionPage from '../../src/pages/SubscriptionPage';

export default function Page() {
  return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <SubscriptionPage />
    </Suspense>
  );
}
