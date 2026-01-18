import React from 'react';
import PublicShell from '@/components/shells/PublicShell';
import ClientPortalShell from '@/components/shells/ClientPortalShell';
import AdminPortalShell from '@/components/shells/AdminPortalShell';

const publicPages = ['Home', 'BookingPage', 'GalleryView', 'AdminLogin'];

const clientPages = [
  'ClientDashboard', 
  'ClientProjects', 
  'ClientProjectDetail',
  'ClientBooking', 
  'ClientInvoices',
  'ClientProfile'
];

const adminPages = [
  'AdminDashboard',
  'AdminProjects',
  'AdminClients',
  'AdminGalleries',
  'AdminBookings',
  'AdminInvoices',
  'AdminDocuments',
  'AdminTemplates',
  'AdminDiscounts',
  'AdminSettings'
];

export default function Layout({ children, currentPageName }) {
  // Public pages - no layout, no authentication
  if (publicPages.includes(currentPageName)) {
    return <PublicShell>{children}</PublicShell>;
  }

  // Client pages
  if (clientPages.includes(currentPageName)) {
    return (
      <ClientPortalShell currentPageName={currentPageName}>
        {children}
      </ClientPortalShell>
    );
  }

  // Admin pages
  if (adminPages.includes(currentPageName)) {
    return (
      <AdminPortalShell currentPageName={currentPageName}>
        {children}
      </AdminPortalShell>
    );
  }

  // Fallback to public shell for unknown pages
  return <PublicShell>{children}</PublicShell>;
}