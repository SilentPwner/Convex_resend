// app/verify-email/page.tsx
'use client'

import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const verifyEmail = useMutation(api.auth.verifyEmail);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (token) {
      verifyEmail({ token })
        .then(() => setStatus('success'))
        .catch(() => setStatus('error'));
    } else {
      setStatus('error');
    }
  }, [token, verifyEmail]);

  if (status === 'loading') {
    return <div>Verifying your email...</div>;
  }

  if (status === 'error') {
    return (
      <div className="text-center">
        <h1>Email Verification Failed</h1>
        <p>The verification link is invalid or has expired.</p>
        <Button asChild>
          <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <h1>Email Verified Successfully</h1>
      <p>Your email has been verified. You can now log in to your account.</p>
      <Button asChild>
        <Link href="/login">Go to Login</Link>
      </Button>
    </div>
  );
}