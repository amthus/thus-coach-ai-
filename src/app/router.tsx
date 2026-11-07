import { lazy } from 'react';
import { createBrowserRouter } from 'react-router';
import PublicLayout from '../layouts/PublicLayout';
import { GuestOnly, RequireAuth } from './guards';
import RouteError from '../pages/RouteError';

// Every page is code-split so visitors only download what they view.
const Home = lazy(() => import('../pages/public/Home'));
const Features = lazy(() => import('../pages/public/Features'));
const About = lazy(() => import('../pages/public/About'));
const Faq = lazy(() => import('../pages/public/Faq'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const Privacy = lazy(() => import('../pages/legal/Privacy'));
const Terms = lazy(() => import('../pages/legal/Terms'));
const LegalNotice = lazy(() => import('../pages/legal/LegalNotice'));
const Cookies = lazy(() => import('../pages/legal/Cookies'));
const NotFound = lazy(() => import('../pages/NotFound'));

const AppLayout = lazy(() => import('../layouts/AppLayout'));
const Dashboard = lazy(() => import('../pages/app/Dashboard'));
const Welcome = lazy(() => import('../pages/app/Welcome'));
const PlanPage = lazy(() => import('../pages/app/PlanPage'));
const CoachPage = lazy(() => import('../pages/app/CoachPage'));
const JournalPage = lazy(() => import('../pages/app/JournalPage'));
const PhysiologyPage = lazy(() => import('../pages/app/PhysiologyPage'));
const ToolsPage = lazy(() => import('../pages/app/ToolsPage'));
const ProfilePage = lazy(() => import('../pages/app/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/app/SettingsPage'));
const AdminPage = lazy(() => import('../pages/admin/AdminPage'));

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Home /> },
      { path: 'fonctionnalites', element: <Features /> },
      { path: 'a-propos', element: <About /> },
      { path: 'faq', element: <Faq /> },
      { path: 'connexion', element: <GuestOnly><Login /></GuestOnly> },
      { path: 'inscription', element: <GuestOnly><Register /></GuestOnly> },
      { path: 'mot-de-passe-oublie', element: <ForgotPassword /> },
      { path: 'reinitialiser-mot-de-passe', element: <ResetPassword /> },
      { path: 'confidentialite', element: <Privacy /> },
      { path: 'conditions-utilisation', element: <Terms /> },
      { path: 'mentions-legales', element: <LegalNotice /> },
      { path: 'cookies', element: <Cookies /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: 'app',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'bienvenue', element: <Welcome /> },
      { path: 'plan', element: <PlanPage /> },
      { path: 'coach', element: <CoachPage /> },
      { path: 'journal', element: <JournalPage /> },
      { path: 'physiologie', element: <PhysiologyPage /> },
      { path: 'outils', element: <ToolsPage /> },
      { path: 'profil', element: <ProfilePage /> },
      { path: 'parametres', element: <SettingsPage /> },
    ],
  },
  {
    path: 'admin',
    element: (
      <RequireAuth admin>
        <AppLayout />
      </RequireAuth>
    ),
    errorElement: <RouteError />,
    children: [{ index: true, element: <AdminPage /> }],
  },
]);
