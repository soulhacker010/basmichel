import React from 'react';
import PublicShell from '@/components/shells/PublicShell';
import ClientPortalShell from '@/components/shells/ClientPortalShell';
import AdminPortalShell from '@/components/shells/AdminPortalShell';
import EditorPortalShell from '@/components/shells/EditorPortalShell';

const publicPages = ['Home', 'BookingPage', 'GalleryView', 'AdminLogin', 'Contact'];

const clientPages = [
  'ClientDashboard', 
  'ClientProjects', 
  'ClientProjectDetail',
  'ClientProjectDetail2',
  'ClientBooking', 
  'ClientGalleries',
  'ClientInvoices',
  'ClientProfile'
];

const editorPages = [
  'EditorDashboard',
  'EditorProjects',
  'EditorUpcoming',
  'EditorInProgress',
  'EditorFinished',
  'EditorRevisions',
  'EditorNotifications',
  'EditorSettings'
];

const adminPages = [
  'AdminDashboard',
  'AdminInbox',
  'AdminProjects',
  'AdminProjectDetail',
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
  // Public pages - no layout, no authentication required
  if (publicPages.includes(currentPageName)) {
    return <PublicShell>{children}</PublicShell>;
  }

  // Client portal pages - require authentication + client role
  if (clientPages.includes(currentPageName)) {
    return (
      <ClientPortalShell currentPageName={currentPageName}>
        {children}
      </ClientPortalShell>
    );
  }

  // Editor portal pages - require authentication + editor role
  if (editorPages.includes(currentPageName)) {
    return (
      <EditorPortalShell currentPageName={currentPageName}>
        {children}
      </EditorPortalShell>
    );
  }

  // Admin portal pages - require authentication + admin role
  if (adminPages.includes(currentPageName)) {
    return (
      <AdminPortalShell currentPageName={currentPageName}>
        {children}
      </AdminPortalShell>
    );
  }

  // Fallback - unknown pages default to public shell
  return <PublicShell>{children}</PublicShell>;
}