import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Contact() {
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      const formData = new FormData(e.target);
      const data = {
        name: formData.get('name'),
        company: formData.get('company'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        message: formData.get('message'),
      };

      // Create notification for admin
      await base44.entities.Notification.create({
        type: 'nieuwe_factuur', // reusing existing enum type
        title: 'Nieuw contactformulier bericht',
        message: `${data.name} heeft een bericht gestuurd via het contactformulier`,
        is_read: false,
      });

      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: 'info@basmichel.nl',
        subject: 'Nieuw contactformulier bericht',
        body: `
Naam: ${data.name}
Bedrijf: ${data.company || 'Niet opgegeven'}
E-mail: ${data.email}
Telefoon: ${data.phone || 'Niet opgegeven'}

Bericht:
${data.message}
        `,
      });

      setSubmitted(true);
      toast.success('Bericht verzonden!');
    } catch (error) {
      toast.error('Er ging iets mis. Probeer het later opnieuw.');
      console.error('Contact form error:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-light text-gray-900" style={{ fontFamily: 'serif' }}>
            Bas Michel
          </a>
          <nav className="flex items-center gap-8">
            <a href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              HOME
            </a>
            <a href="/contact" className="text-sm text-gray-900 font-medium">
              CONTACT
            </a>
            <a href="/booking" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              BOEKEN
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Images */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-[400px] lg:h-[500px]">
        <div 
          className="bg-cover bg-center"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80)' }}
        />
        <div 
          className="bg-cover bg-center hidden lg:block"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80)' }}
        />
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <p className="text-sm text-gray-500 mb-3" style={{ fontFamily: 'serif', fontStyle: 'italic' }}>
            We staan voor je klaar
          </p>
          <h1 className="text-4xl lg:text-5xl font-light text-gray-900 mb-8" style={{ fontFamily: 'serif' }}>
            Stuur ons een bericht
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-light text-gray-900 mb-2">Bedankt!</h2>
                <p className="text-gray-600">
                  We hebben je bericht ontvangen en nemen zo snel mogelijk contact met je op.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-sm text-gray-700">
                    Naam <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    className="mt-2 bg-white border-gray-200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="company" className="text-sm text-gray-700">
                    Bedrijf <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company"
                    name="company"
                    className="mt-2 bg-white border-gray-200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-sm text-gray-700">
                    E-mail <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    className="mt-2 bg-white border-gray-200"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-sm text-gray-700">
                    Telefoonnummer
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="mt-2 bg-white border-gray-200"
                  />
                </div>
                <div>
                  <Label htmlFor="message" className="text-sm text-gray-700">
                    Bericht <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="mt-2 bg-white border-gray-200"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-[#5C6B52] hover:bg-[#4A5641] text-white py-6 text-base"
                  disabled={sending}
                >
                  {sending ? 'Verzenden...' : 'Verstuur'}
                  {!sending && <Send className="w-4 h-4 ml-2" />}
                </Button>
              </form>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 p-8">
              <h3 className="text-xl font-light text-gray-900 mb-6" style={{ fontFamily: 'serif' }}>
                Contact Informatie
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-[#5C6B52] mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">E-mail</p>
                    <a href="mailto:info@basmichel.nl" className="text-gray-900 hover:text-[#5C6B52] transition-colors">
                      info@basmichel.nl
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#5C6B52] mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Telefoon</p>
                    <a href="tel:+31612345678" className="text-gray-900 hover:text-[#5C6B52] transition-colors">
                      +31 6 12 34 56 78
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#5C6B52] mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Locatie</p>
                    <p className="text-gray-900">
                      Amsterdam, Nederland
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-lg border border-gray-100 p-8">
              <h3 className="text-xl font-light text-gray-900 mb-4" style={{ fontFamily: 'serif' }}>
                Openingstijden
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Maandag - Vrijdag</span>
                  <span className="text-gray-900">9:00 - 18:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zaterdag</span>
                  <span className="text-gray-900">10:00 - 16:00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Zondag</span>
                  <span className="text-gray-900">Gesloten</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}