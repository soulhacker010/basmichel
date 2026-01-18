import AdminDashboard from './pages/AdminDashboard';
import AdminClients from './pages/AdminClients';
import AdminProjects from './pages/AdminProjects';
import AdminGalleries from './pages/AdminGalleries';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AdminClients": AdminClients,
    "AdminProjects": AdminProjects,
    "AdminGalleries": AdminGalleries,
}

export const pagesConfig = {
    mainPage: "AdminDashboard",
    Pages: PAGES,
    Layout: __Layout,
};