'use client';

import { signIn } from 'next-auth/react';

export default function SignInButton() {
  return (
    <button
      onClick={() => signIn('google', { callbackUrl: '/' })}
      style={{
        background: 'var(--fuchsia)',
        boxShadow: '0 8px 30px rgba(255,45,155,0.3)',
      }}
      className="flex items-center gap-3 px-8 py-4 rounded-full font-['Outfit'] font-bold text-base text-white transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 active:scale-95 w-full justify-center"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path
          d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.63 4.63 0 0 1-2 3.04v2.52h3.24c1.9-1.75 3-4.33 3-7.35Z"
          fill="#fff"
          fillOpacity=".9"
        />
        <path
          d="M10 20c2.7 0 4.97-.9 6.62-2.42l-3.24-2.52a6.02 6.02 0 0 1-3.38.95 5.99 5.99 0 0 1-5.64-4.14H1.02v2.6A10 10 0 0 0 10 20Z"
          fill="#fff"
          fillOpacity=".8"
        />
        <path
          d="M4.36 11.87A5.95 5.95 0 0 1 4.04 10c0-.65.11-1.28.32-1.87V5.53H1.02A10 10 0 0 0 0 10c0 1.61.38 3.13 1.02 4.47l3.34-2.6Z"
          fill="#fff"
          fillOpacity=".7"
        />
        <path
          d="M10 3.96a5.45 5.45 0 0 1 3.86 1.5l2.88-2.88A9.66 9.66 0 0 0 10 0 10 10 0 0 0 1.02 5.53l3.34 2.6A5.99 5.99 0 0 1 10 3.96Z"
          fill="#fff"
          fillOpacity=".6"
        />
      </svg>
      Continue with Google
    </button>
  );
}
