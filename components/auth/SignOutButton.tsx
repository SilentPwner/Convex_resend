// components/auth/SignOutButton.tsx
'use client'

import { signOut } from 'next-auth/react';

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="text-red-600 hover:underline"
    >
      تسجيل الخروج
    </button>
  );
}