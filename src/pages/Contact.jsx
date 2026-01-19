import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Send, CheckCircle } from 'lucide-react';
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

      // Create inbox message
      await base44.entities.InboxMessage.create({
        subject: `Contact van ${data.name}`,
        message: data.message,
        sender_name: data.name,
        sender_email: data.email,
        is_read: false,
      });

      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: 'basmichelsite@gmail.com',
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
          <a href="/">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/41d5ec5ec_BasMichel_K152.png" 
              alt="Bas Michel" 
              className="h-20"
            />
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
              <div className="bg-white border border-green-200 rounded-lg p-12 text-center shadow-lg">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-light text-gray-900 mb-3" style={{ fontFamily: 'serif' }}>
                  Bericht verzonden!
                </h2>
                <p className="text-gray-600 text-lg">
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
                    <a href="mailto:basmichelsite@gmail.com" className="text-gray-900 hover:text-[#5C6B52] transition-colors">
                      basmichelsite@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}