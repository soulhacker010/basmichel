import AdminBookings from './pages/AdminBookings';
import AdminClients from './pages/AdminClients';
import AdminDashboard from './pages/AdminDashboard';
import AdminDiscounts from './pages/AdminDiscounts';
import AdminDocuments from './pages/AdminDocuments';
import AdminGalleries from './pages/AdminGalleries';
import AdminInbox from './pages/AdminInbox';
import AdminInvoices from './pages/AdminInvoices';
import AdminLogin from './pages/AdminLogin';
import AdminPayments from './pages/AdminPayments';
import AdminProjects from './pages/AdminProjects';
import AdminSettings from './pages/AdminSettings';
import AdminTemplates from './pages/AdminTemplates';
import BookingPage from './pages/BookingPage';
import ClientBooking from './pages/ClientBooking';
import ClientDashboard from './pages/ClientDashboard';
import ClientGalleries from './pages/ClientGalleries';
import ClientInvoices from './pages/ClientInvoices';
import ClientProfile from './pages/ClientProfile';
import ClientProjectDetail from './pages/ClientProjectDetail';
import ClientProjects from './pages/ClientProjects';
import Contact from './pages/Contact';
import GalleryView from './pages/GalleryView';
import Home from './pages/Home';
import AdminProjectDetail from './pages/AdminProjectDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminBookings": AdminBookings,
    "AdminClients": AdminClients,
    "AdminDashboard": AdminDashboard,
    "AdminDiscounts": AdminDiscounts,
    "AdminDocuments": AdminDocuments,
    "AdminGalleries": AdminGalleries,
    "AdminInbox": AdminInbox,
    "AdminInvoices": AdminInvoices,
    "AdminLogin": AdminLogin,
    "AdminPayments": AdminPayments,
    "AdminProjects": AdminProjects,
    "AdminSettings": AdminSettings,
    "AdminTemplates": AdminTemplates,
    "BookingPage": BookingPage,
    "ClientBooking": ClientBooking,
    "ClientDashboard": ClientDashboard,
    "ClientGalleries": ClientGalleries,
    "ClientInvoices": ClientInvoices,
    "ClientProfile": ClientProfile,
    "ClientProjectDetail": ClientProjectDetail,
    "ClientProjects": ClientProjects,
    "Contact": Contact,
    "GalleryView": GalleryView,
    "Home": Home,
    "AdminProjectDetail": AdminProjectDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};