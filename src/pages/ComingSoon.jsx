export default function ComingSoon() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white select-none"
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div className="text-center flex flex-col items-center gap-10">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/41d5ec5ec_BasMichel_K152.png"
          alt="Bas Michel"
          className="h-16 absolute top-8 left-1/2 -translate-x-1/2"
        />
        <p
          className="text-4xl md:text-6xl lg:text-7xl font-light text-gray-800 tracking-wide"
          style={{ fontFamily: 'Georgia, serif' }}
        >
          Binnenkort online
        </p>
      </div>
    </div>
  );
}