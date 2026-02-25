import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Servicevoorwaarden() {
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
        <h1 className="text-3xl font-light text-gray-900 mb-2">SERVICEVOORWAARDEN – Bas Michel Vastgoedpresentatie</h1>
        <p className="text-sm text-gray-500 mb-10">Laatst bijgewerkt: 01/05/2025</p>
        <p className="text-gray-700 mb-8">Deze servicevoorwaarden zijn een aanvulling op onze algemene voorwaarden en geven meer duidelijkheid over de werkwijze en verwachtingen rondom onze diensten.</p>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">1. Opdrachten & communicatie</h2>
            <p>- Opdrachten worden uitsluitend aangenomen via e-mail of het contactformulier op de website.</p>
            <p>- Klanten zijn verantwoordelijk voor het aanleveren van correcte gegevens en eventuele specifieke wensen voorafgaand aan de opdracht.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">2. Levering van bestanden</h2>
            <p>- Alle bestanden (zoals foto's, video's, plattegronden en meetrapporten) worden geleverd via een downloadlink, meestal via Dropbox.</p>
            <p>- Standaardlevering: binnen 3 werkdagen na opname, tenzij anders afgesproken.</p>
            <p>- Spoedlevering is mogelijk in overleg en kan extra kosten met zich meebrengen.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">3. Correctierondes</h2>
            <p>- Bij fotografie en plattegronden is 1 correctieronde inbegrepen (binnen redelijkheid).</p>
            <p>- Aanvullende correcties of aanpassingen kunnen apart in rekening worden gebracht.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">4. Gebruik van materiaal</h2>
            <p>- Klanten mogen het geleverde materiaal vrij gebruiken voor promotie van het betreffende vastgoedobject.</p>
            <p>- Voor hergebruik bij andere projecten of door derden is vooraf toestemming nodig (zie ook de algemene voorwaarden).</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">5. Toegang tot de locatie</h2>
            <p>- De locatie dient op het afgesproken tijdstip toegankelijk te zijn.</p>
            <p>- Bij geen toegang of afwezigheid (no-show) kan 50% van het afgesproken bedrag in rekening worden gebracht.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">6. Weersomstandigheden</h2>
            <p>- Bij slecht weer (regen, storm) kan een buitenopname of drone-opname worden uitgesteld.</p>
            <p>- In overleg plannen we kosteloos een nieuwe opnamedag in.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">7. Archivering</h2>
            <p>- Geleverd materiaal wordt maximaal 30 dagen bewaard na aflevering. Daarna zijn wij niet verplicht het opnieuw beschikbaar te stellen.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">8. Contact</h2>
            <p>Voor vragen of overleg kun je altijd contact opnemen via <a href="mailto:info@basmichel.nl" className="text-gray-900 underline">info@basmichel.nl</a>.</p>
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