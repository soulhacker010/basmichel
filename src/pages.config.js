import AdminDashboard from './pages/AdminDashboard';
import AdminClients from './pages/AdminClients';
import AdminProjects from './pages/AdminProjects';
import AdminGalleries from './pages/AdminGalleries';
import AdminBookings from './pages/AdminBookings';
import AdminInbox from './pages/AdminInbox';
import AdminPayments from './pages/AdminPayments';
import AdminDocuments from './pages/AdminDocuments';
import AdminTemplates from './pages/AdminTemplates';
import AdminDiscounts from './pages/AdminDiscounts';
import AdminSettings from './pages/AdminSettings';
import ClientGalleries from './pages/ClientGalleries';
import GalleryView from './pages/GalleryView';
import BookingPage from './pages/BookingPage';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminClients": AdminClients,
    "AdminProjects": AdminProjects,
    "AdminGalleries": AdminGalleries,
    "AdminBookings": AdminBookings,
    "AdminInbox": AdminInbox,
    "AdminPayments": AdminPayments,
    "AdminDocuments": AdminDocuments,
    "AdminTemplates": AdminTemplates,
    "AdminDiscounts": AdminDiscounts,
    "AdminSettings": AdminSettings,
    "ClientGalleries": ClientGalleries,
    "GalleryView": GalleryView,
    "BookingPage": BookingPage,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: __Layout,
};