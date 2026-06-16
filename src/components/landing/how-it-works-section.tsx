export function HowItWorksSection() {
  const steps = [
    {
      step: '01',
      icon: '📷',
      title: 'Snap a photo',
      desc: 'Take a photo of anything around you — your coffee, a street sign, food at a restaurant, or objects at home. No language knowledge needed.',
    },
    {
      step: '02',
      icon: '🤖',
      title: 'AI identifies & translates',
      desc: 'Our AI detects objects in the image and instantly returns Chinese characters, pinyin pronunciation, and English meaning for each one.',
    },
    {
      step: '03',
      icon: '🎴',
      title: 'Practice until fluent',
      desc: 'Words are saved to your personal library. Spaced-repetition flashcards surface them at the right time so they move into long-term memory.',
    },
  ];

  return (
    <section className="max-w-5xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-[#e0e2e8] mb-3">How it works</h2>
        <p className="text-[#bacbbe] text-lg">From photo to fluency in three steps</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 relative">
        {/* Connector line (desktop) */}
        <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-[#76ffbb]/30 to-transparent" />

        {steps.map((s) => (
          <div key={s.step} className="relative bg-[#181c20] border border-white/5 rounded-2xl p-7 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#76ffbb]/10 border border-[#76ffbb]/20 text-[#76ffbb] text-sm font-bold mb-5">
              {s.step}
            </div>
            <div className="text-4xl mb-4">{s.icon}</div>
            <h3 className="text-lg font-semibold text-[#e0e2e8] mb-3">{s.title}</h3>
            <p className="text-sm text-[#bacbbe] leading-relaxed">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
