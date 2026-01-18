import AdminBookings from './pages/AdminBookings';
import AdminClients from './pages/AdminClients';
import AdminDashboard from './pages/AdminDashboard';
import AdminDiscounts from './pages/AdminDiscounts';
import AdminDocuments from './pages/AdminDocuments';
import AdminGalleries from './pages/AdminGalleries';
import AdminInbox from './pages/AdminInbox';
import AdminPayments from './pages/AdminPayments';
import AdminProjects from './pages/AdminProjects';
import AdminSettings from './pages/AdminSettings';
import AdminTemplates from './pages/AdminTemplates';
import BookingPage from './pages/BookingPage';
import ClientGalleries from './pages/ClientGalleries';
import GalleryView from './pages/GalleryView';
import Home from './pages/Home';
import ClientDashboard from './pages/ClientDashboard';
import ClientProjects from './pages/ClientProjects';
import ClientProjectDetail from './pages/ClientProjectDetail';
import ClientInvoices from './pages/ClientInvoices';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminBookings": AdminBookings,
    "AdminClients": AdminClients,
    "AdminDashboard": AdminDashboard,
    "AdminDiscounts": AdminDiscounts,
    "AdminDocuments": AdminDocuments,
    "AdminGalleries": AdminGalleries,
    "AdminInbox": AdminInbox,
    "AdminPayments": AdminPayments,
    "AdminProjects": AdminProjects,
    "AdminSettings": AdminSettings,
    "AdminTemplates": AdminTemplates,
    "BookingPage": BookingPage,
    "ClientGalleries": ClientGalleries,
    "GalleryView": GalleryView,
    "Home": Home,
    "ClientDashboard": ClientDashboard,
    "ClientProjects": ClientProjects,
    "ClientProjectDetail": ClientProjectDetail,
    "ClientInvoices": ClientInvoices,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: __Layout,
};