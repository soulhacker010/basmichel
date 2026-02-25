export default function ComingSoon() {
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-white select-none"
      style={{ pointerEvents: 'none', userSelect: 'none' }}
    >
      <div className="text-center">
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