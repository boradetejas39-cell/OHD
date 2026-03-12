'use client';

import { Suspense } from 'react';
import MailPageContent from './MailPageContent';

export default function MailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MailPageContent />
    </Suspense>
  );
}


