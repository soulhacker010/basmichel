import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 py-4 px-6 lg:px-12">
        <Link to={createPageUrl('Home')}>
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/41d5ec5ec_BasMichel_K152.png"
            alt="Bas Michel"
            className="h-16"
          />
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-16 w-full">
        <h1 className="text-3xl font-light text-gray-900 mb-10">DISCLAIMER – Bas Michel</h1>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>De informatie op deze website is met grote zorg samengesteld. Toch kan het voorkomen dat gegevens onvolledig, verouderd of onjuist zijn. Aan de inhoud van deze website kunnen geen rechten worden ontleend.</p>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Gebruik van de website</h2>
            <p>Het gebruik van de informatie op deze website is volledig voor eigen risico van de bezoeker. Bas Michel Vastgoedpresentatie is niet aansprakelijk voor schade die voortvloeit uit het gebruik van de website, noch voor technische storingen of tijdelijke onbereikbaarheid.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Externe links</h2>
            <p>Op deze website kunnen links naar externe websites voorkomen. Wij zijn niet verantwoordelijk voor de inhoud of werking van deze externe sites.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">Intellectuele eigendom</h2>
            <p>Alle beelden, teksten en ander materiaal op deze site zijn eigendom van Bas Michel of zijn partners, tenzij anders vermeld. Gebruik hiervan zonder toestemming is niet toegestaan.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-16 bg-black text-white mt-auto">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
            <div>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/d493012a0_BasMichel_K102.png"
                alt="Bas Michel"
                className="h-14 brightness-0 invert mb-4"
              />
              <ul className="space-y-1 text-sm text-gray-400">
                <li>Bas Michel</li>
                <li><a href="mailto:basmichelsite@gmail.com" className="hover:text-white transition-colors">basmichelsite@gmail.com</a></li>
                <li>Goudvink 35, Numansdorp</li>
                <li className="pt-1">KvK: 87212978</li>
                <li>BTW: 004372351B68</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide">Diensten</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to={createPageUrl('Home')} className="hover:text-white transition-colors">Fotografie</Link></li>
                <li><Link to={createPageUrl('Home')} className="hover:text-white transition-colors">Video Tours</Link></li>
                <li><Link to={createPageUrl('Home')} className="hover:text-white transition-colors">360° Virtuele Tours</Link></li>
                <li><Link to={createPageUrl('Home')} className="hover:text-white transition-colors">Plattegronden</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-4 uppercase tracking-wide">Juridisch</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to={createPageUrl('AlgemeneVoorwaarden')} className="hover:text-white transition-colors">Algemene Voorwaarden</Link></li>
                <li><Link to={createPageUrl('Servicevoorwaarden')} className="hover:text-white transition-colors">Servicevoorwaarden</Link></li>
                <li><Link to={createPageUrl('Privacyverklaring')} className="hover:text-white transition-colors">Privacyverklaring</Link></li>
                <li><Link to={createPageUrl('Cookieverklaring')} className="hover:text-white transition-colors">Cookieverklaring</Link></li>
                <li><Link to={createPageUrl('Disclaimer')} className="hover:text-white transition-colors">Disclaimer</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-800">
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} Bas Michel. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}