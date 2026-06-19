'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
];

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = (newLocale: string) => {
    // Strip existing locale prefix then add new one (vi only; en has no prefix)
    const withoutLocale = pathname.replace(/^\/(en|vi)/, '') || '/';
    const newPath = newLocale === 'en' ? withoutLocale : `/${newLocale}${withoutLocale}`;
    router.push(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-sm text-[#bacbbe] hover:text-[#e0e2e8] transition-colors"
          aria-label="Switch language"
        >
          <Globe size={16} />
          <span className="uppercase font-medium">{locale}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#1c2024] border-white/10 text-[#e0e2e8]">
        {LOCALES.map(({ code, label }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => switchLocale(code)}
            className={`cursor-pointer focus:bg-[#272a2e] focus:text-[#e0e2e8] ${
              locale === code ? 'text-[#76ffbb] font-semibold' : ''
            }`}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
