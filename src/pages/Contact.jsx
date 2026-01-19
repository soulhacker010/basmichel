import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Mail, Send, CheckCircle, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function Contact() {
  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const auth = await base44.auth.isAuthenticated();
        setIsAuthenticated(auth);
        if (auth) {
          const userData = await base44.auth.me();
          setUser(userData);
        }
      } catch (e) {
        // Not authenticated
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = () => {
    base44.auth.redirectToLogin();
  };

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
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    background-color: #f4f6f8;
    margin: 0;
    padding: 0;
  }
  .email-container {
    max-width: 600px;
    margin: 40px auto;
    background-color: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    overflow: hidden;
  }
  .header {
    background: linear-gradient(135deg, #5C6B52 0%, #4A5641 100%);
    color: #ffffff;
    padding: 32px 30px;
    text-align: center;
  }
  .header h2 {
    margin: 0;
    font-size: 24px;
    font-weight: 300;
    letter-spacing: -0.5px;
  }
  .content {
    padding: 32px 40px;
    line-height: 1.6;
    color: #333333;
  }
  .intro {
    color: #666666;
    margin-bottom: 24px;
    font-size: 15px;
  }
  .data-section {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 20px;
  }
  .data-item {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e9ecef;
  }
  .data-item:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
  .data-item strong {
    color: #5C6B52;
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }
  .data-item p {
    margin: 0;
    color: #212529;
    font-size: 15px;
  }
  .message-box {
    background-color: #ffffff;
    border: 2px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    margin-top: 20px;
  }
  .message-box strong {
    color: #5C6B52;
    display: block;
    margin-bottom: 12px;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
  }
  .message-box p {
    margin: 0;
    color: #212529;
    font-size: 15px;
    line-height: 1.7;
    white-space: pre-wrap;
  }
  .footer {
    background-color: #f8f9fa;
    color: #6c757d;
    text-align: center;
    padding: 20px;
    font-size: 13px;
    border-top: 1px solid #e9ecef;
  }
  .cta-link {
    display: inline-block;
    margin-top: 16px;
    padding: 12px 24px;
    background-color: #5C6B52;
    color: #ffffff !important;
    text-decoration: none;
    border-radius: 6px;
    font-weight: 500;
    font-size: 14px;
  }
</style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h2>📬 Nieuw Contactformulier Bericht</h2>
    </div>
    <div class="content">
      <p class="intro">Er is een nieuw bericht ontvangen via het contactformulier op basmichel.nl:</p>
      
      <div class="data-section">
        <div class="data-item">
          <strong>Naam</strong>
          <p>${data.name}</p>
        </div>
        
        <div class="data-item">
          <strong>Bedrijf</strong>
          <p>${data.company || 'Niet opgegeven'}</p>
        </div>
        
        <div class="data-item">
          <strong>E-mail</strong>
          <p><a href="mailto:${data.email}" style="color: #5C6B52; text-decoration: none;">${data.email}</a></p>
        </div>
        
        <div class="data-item">
          <strong>Telefoon</strong>
          <p>${data.phone || 'Niet opgegeven'}</p>
        </div>
      </div>

      <div class="message-box">
        <strong>Bericht</strong>
        <p>${data.message}</p>
      </div>
    </div>
    <div class="footer">
      Dit is een automatisch gegenereerd bericht van Bas Michel Photography
    </div>
  </div>
</body>
</html>
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
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 backdrop-blur-md' : 'bg-white/95 backdrop-blur-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <a href="/">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d131f67e4f7236fb13603/41d5ec5ec_BasMichel_K152.png" 
                alt="Bas Michel" 
                className="h-20"
              />
            </a>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-12">
              <a href="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </a>
              <a href="/#diensten" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Diensten
              </a>
              <a href="/#portfolio" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                Portfolio
              </a>
              <Link to={createPageUrl('Contact')} className="text-sm text-gray-900 font-medium transition-colors">
                Contact
              </Link>
              {isAuthenticated ? (
                <Link to={createPageUrl(user?.role === 'admin' ? 'AdminDashboard' : 'ClientDashboard')}>
                  <Button className="rounded px-6 h-9 text-sm bg-black hover:bg-gray-900 text-white transition-colors">
                    Mijn Account
                  </Button>
                </Link>
              ) : (
                <Button 
                  onClick={handleLogin} 
                  className="rounded px-6 h-9 text-sm bg-black hover:bg-gray-900 text-white transition-colors"
                >
                  Inloggen voor Makelaars
                </Button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-600 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-6 space-y-4">
            <a href="/" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Home
            </a>
            <a href="/#diensten" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Diensten
            </a>
            <a href="/#portfolio" className="block text-gray-600 py-2" onClick={() => setMenuOpen(false)}>
              Portfolio
            </a>
            <Link to={createPageUrl('Contact')} className="block text-gray-900 font-medium py-2" onClick={() => setMenuOpen(false)}>
              Contact
            </Link>
          </div>
        )}
      </nav>

      {/* Spacer for fixed nav */}
      <div className="h-20" />

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