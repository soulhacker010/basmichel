import React from 'react';
import { Calendar, Clock, Lock } from 'lucide-react';

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-20">
            <span className="text-xl font-light text-gray-900 tracking-wide">Basmichel</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[#E8EDE5] flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-[#A8B5A0]" />
          </div>
          
          <h1 className="text-3xl font-light text-gray-900 mb-4">
            Online Boeken
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            Binnenkort kunt u hier eenvoudig online een fotosessie boeken.
          </p>

          <div className="bg-white rounded-xl border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
              <Lock className="w-5 h-5" />
              <span className="font-medium">Binnenkort beschikbaar</span>
            </div>
            <p className="text-gray-500">
              We werken hard aan het online boekingssysteem. Neem in de tussentijd contact 
              met ons op via de onderstaande gegevens om een afspraak te maken.
            </p>
          </div>

          <div className="space-y-4 text-left bg-white rounded-xl border border-gray-100 p-6">
            <h2 className="font-medium text-gray-900 mb-4">Contact opnemen</h2>
            <div className="space-y-3">
              <a 
                href="mailto:info@basmichel.nl" 
                className="flex items-center gap-3 text-gray-600 hover:text-[#5C6B52] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#E8EDE5] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#5C6B52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>info@basmichel.nl</span>
              </a>
              <a 
                href="https://basmichel.nl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-600 hover:text-[#5C6B52] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#E8EDE5] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#5C6B52]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <span>basmichel.nl</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Basmichel. Alle rechten voorbehouden.
        </div>
      </footer>
    </div>
  );
}