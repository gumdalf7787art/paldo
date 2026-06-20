'use client';
import React, { Suspense } from 'react';
import UploadForm from '../../src/components/UploadForm';
export default function Page() { return (
    <Suspense fallback={<div style={{padding: '50px', textAlign: 'center'}}>Loading...</div>}>
      <UploadForm />
    </Suspense>
  ); }
