"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="px-6 py-3 rounded-full font-['Outfit'] font-bold text-sm transition-all duration-200 hover:bg-[#FFF0F8] hover:text-[#FF2D9B]"
      style={{ border: "2px solid var(--border)", color: "var(--text-secondary)" }}
    >
      Sign out
    </button>
  );
}
