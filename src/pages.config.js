/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
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
import AdminProjectDetail from './pages/AdminProjectDetail';
import AdminProjects from './pages/AdminProjects';
import AdminSettings from './pages/AdminSettings';
import AdminTemplates from './pages/AdminTemplates';
import BookingPage from './pages/BookingPage';
import ClientBooking from './pages/ClientBooking';
import ClientBookings from './pages/ClientBookings';
import ClientDashboard from './pages/ClientDashboard';
import ClientGalleries from './pages/ClientGalleries';
import ClientInvoices from './pages/ClientInvoices';
import ClientProfile from './pages/ClientProfile';
import ClientProjectDetail from './pages/ClientProjectDetail';
import ClientProjectDetail2 from './pages/ClientProjectDetail2';
import ClientProjects from './pages/ClientProjects';
import Contact from './pages/Contact';
import EditorDashboard from './pages/EditorDashboard';
import EditorFinished from './pages/EditorFinished';
import EditorInProgress from './pages/EditorInProgress';
import EditorNotifications from './pages/EditorNotifications';
import EditorProjects from './pages/EditorProjects';
import EditorRevisions from './pages/EditorRevisions';
import EditorSettings from './pages/EditorSettings';
import EditorUpcoming from './pages/EditorUpcoming';
import GalleryView from './pages/GalleryView';
import ProjectGalleryView from './pages/ProjectGalleryView';
import ComingSoon from './pages/ComingSoon';
import Home from './pages/Home';
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
    "AdminProjectDetail": AdminProjectDetail,
    "AdminProjects": AdminProjects,
    "AdminSettings": AdminSettings,
    "AdminTemplates": AdminTemplates,
    "BookingPage": BookingPage,
    "ClientBooking": ClientBooking,
    "ClientBookings": ClientBookings,
    "ClientDashboard": ClientDashboard,
    "ClientGalleries": ClientGalleries,
    "ClientInvoices": ClientInvoices,
    "ClientProfile": ClientProfile,
    "ClientProjectDetail": ClientProjectDetail,
    "ClientProjectDetail2": ClientProjectDetail2,
    "ClientProjects": ClientProjects,
    "Contact": Contact,
    "EditorDashboard": EditorDashboard,
    "EditorFinished": EditorFinished,
    "EditorInProgress": EditorInProgress,
    "EditorNotifications": EditorNotifications,
    "EditorProjects": EditorProjects,
    "EditorRevisions": EditorRevisions,
    "EditorSettings": EditorSettings,
    "EditorUpcoming": EditorUpcoming,
    "GalleryView": GalleryView,
    "ProjectGalleryView": ProjectGalleryView,
    "ComingSoon": ComingSoon,
    "Home": Home,
}

export const pagesConfig = {
    mainPage: "ComingSoon",
    Pages: PAGES,
    Layout: __Layout,
};