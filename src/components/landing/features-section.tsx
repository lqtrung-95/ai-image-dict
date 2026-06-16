export function FeaturesSection() {
  const features = [
    {
      icon: '📷',
      title: 'Visual Vocabulary Capture',
      desc: 'Analyze any photo — menus, signs, products, nature. AI returns every detected object with Chinese characters, pinyin, and English in seconds.',
    },
    {
      icon: '🎴',
      title: 'Spaced Repetition (SRS)',
      desc: 'SM-2 algorithm schedules reviews at the optimal moment — right before you forget. Rate cards Again / Hard / Good / Easy to adjust intervals.',
    },
    {
      icon: '📖',
      title: 'AI Story Generator',
      desc: 'Turn saved vocabulary into short immersive stories. Context makes words stick far better than isolated drilling.',
    },
    {
      icon: '🎮',
      title: 'Practice Games',
      desc: 'Character matching, quiz mode, and handwriting practice. Multiple game modes keep sessions engaging beyond flashcards.',
    },
    {
      icon: '📊',
      title: 'HSK Level Tracking',
      desc: 'Your vocabulary is automatically mapped to HSK 1–6. Watch your mastery grow level by level toward advanced fluency.',
    },
    {
      icon: '🔔',
      title: 'Smart Study Reminders',
      desc: 'Set a daily reminder and the app notifies you when words are due for review — so your streak stays alive without effort.',
    },
    {
      icon: '📋',
      title: 'Custom Word Lists',
      desc: 'Organize vocabulary into lists by topic, location, or HSK level. Export any list to Anki for desktop review.',
    },
    {
      icon: '🔊',
      title: 'Audio Pronunciation',
      desc: 'Tap any character to hear native-quality Mandarin pronunciation powered by Google Text-to-Speech. Tones matter — hear them.',
    },
    {
      icon: '📈',
      title: 'Learning Statistics',
      desc: 'Activity heatmap, accuracy by word, streak calendar, and vocabulary growth chart. See exactly how your learning compounds.',
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-6 py-20">
      <div className="text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-[#e0e2e8] mb-3">Everything you need to learn Mandarin</h2>
        <p className="text-[#bacbbe] text-lg max-w-xl mx-auto">
          One app that takes you from zero vocabulary to confident reading — using the world around you as your classroom.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {features.map((f) => (
          <div
            key={f.title}
            className="p-6 rounded-xl bg-[#181c20] border border-white/5 hover:border-[#76ffbb]/20 hover:bg-[#1c2024] transition-all duration-200 group"
          >
            <div className="text-3xl mb-4">{f.icon}</div>
            <h3 className="font-semibold text-[#e0e2e8] mb-2 group-hover:text-[#76ffbb] transition-colors">{f.title}</h3>
            <p className="text-sm text-[#bacbbe] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
