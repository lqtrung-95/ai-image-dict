import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#101417] flex flex-col">
      {/* Minimal header */}
      <header className="h-16 flex items-center px-8 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-[#76ffbb] tracking-tight">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>photo_camera</span>
          Snap Mandarin
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center p-6">
        {children}
      </main>
    </div>
  );
}
