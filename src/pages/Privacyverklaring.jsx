import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function Privacyverklaring() {
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
        <h1 className="text-3xl font-light text-gray-900 mb-2">PRIVACYVERKLARING – Bas Michel</h1>
        <p className="text-sm text-gray-500 mb-10">Laatst bijgewerkt: 25/02/2026</p>
        <p className="text-gray-700 mb-8">Bij Bas Michel Vastgoedpresentatie hechten we veel waarde aan jouw privacy. In deze privacyverklaring leggen we uit welke persoonsgegevens we verzamelen, waarom we dat doen, en wat jouw rechten zijn.</p>
        <div className="space-y-6 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">1. Wie is verantwoordelijk?</h2>
            <p>Deze privacyverklaring is van toepassing op de diensten van Bas Michel. Wij zijn verantwoordelijk voor de verwerking van jouw persoonsgegevens zoals weergegeven in deze verklaring.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">2. Welke gegevens verzamelen wij?</h2>
            <p>Via onze website verzamelen wij de volgende gegevens:</p>
            <p>- Naam en bedrijfsnaam (indien opgegeven)</p>
            <p>- E-mailadres</p>
            <p>- Telefoonnummer</p>
            <p>- Eventuele aanvullende informatie die je zelf aanlevert via het contactformulier</p>
            <p>- IP-adres (via analytische cookies)</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">3. Waarvoor gebruiken we deze gegevens?</h2>
            <p>Wij verwerken jouw gegevens voor:</p>
            <p>- Het beantwoorden van vragen of aanvragen via het contactformulier</p>
            <p>- Het uitvoeren van een offerte of opdracht</p>
            <p>- Administratieve doeleinden (zoals facturatie)</p>
            <p>- Eventuele opvolging na dienstverlening</p>
            <p>- Anonieme analyse van websitegebruik (bijv. via Google Analytics)</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">4. Met wie delen wij je gegevens?</h2>
            <p>Wij verkopen jouw gegevens niet aan derden. We delen gegevens uitsluitend met:</p>
            <p>- Boekhoudsoftware (voor facturatie)</p>
            <p>- E-mailprovider</p>
            <p>- Eventueel een cloudopslagdienst (bijv. voor afleveren van foto's)</p>
            <p>- Een externe partner die namens ons plattegronden en meetrapporten maakt</p>
            <p>Met deze partijen hebben wij een verwerkersovereenkomst afgesloten.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">5. Cookies</h2>
            <p>Onze website gebruikt alleen functionele en analytische cookies:</p>
            <p>- Functionele cookies zorgen ervoor dat de site goed werkt.</p>
            <p>- Analytische cookies meten het bezoekgedrag op geanonimiseerde wijze (bijv. via Google Analytics).</p>
            <p>Je kunt je cookievoorkeuren aanpassen in je browserinstellingen.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">6. Beveiliging van jouw gegevens</h2>
            <p>Wij nemen passende maatregelen om je gegevens te beveiligen. Er is momenteel geen klantenportaal en daarom wordt geen gebruik gemaakt van wachtwoorden of authenticatie.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">7. Hoe lang bewaren we je gegevens?</h2>
            <p>- Contactgegevens: tot maximaal 1 jaar na het laatste contact.</p>
            <p>- Factuurgegevens: 7 jaar (wettelijke bewaarplicht).</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">8. Jouw rechten</h2>
            <p>Je hebt het recht om:</p>
            <p>- Inzage te vragen in je gegevens</p>
            <p>- Je gegevens te laten corrigeren of verwijderen</p>
            <p>- Bezwaar te maken tegen het gebruik</p>
            <p>- Gegevens over te laten dragen aan een andere partij</p>
            <p>Een verzoek indienen? Stuur een e-mail naar <a href="mailto:info@basmichel.nl" className="text-gray-900 underline">info@basmichel.nl</a>.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">9. Wijzigingen in dit beleid</h2>
            <p>We behouden het recht voor om deze privacyverklaring te wijzigen. Controleer deze pagina regelmatig voor de meest actuele versie.</p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">10. Contact</h2>
            <p>Heb je vragen? Neem gerust contact met ons op via <a href="mailto:info@basmichel.nl" className="text-gray-900 underline">info@basmichel.nl</a>.</p>
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