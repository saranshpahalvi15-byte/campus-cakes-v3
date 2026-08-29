import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { safeStorage } from '../lib/safeStorage';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Standard initialization check
    if (typeof window !== 'undefined') {
      const persisted = safeStorage.getItem('theme');
      if (persisted === 'dark') return true;
      if (persisted === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      safeStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      safeStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className="p-2.5 rounded-2xl bg-gray-50 dark:bg-[#1a0d0f]/80 hover:bg-red-50 hover:dark:bg-red-500/10 text-gray-700 dark:text-[#e4e4e7] hover:text-[#E23744] hover:dark:text-[#E23744] border border-gray-200 dark:border-[#291316] transition-all duration-300"
      aria-label="Toggle Dark Mode"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
