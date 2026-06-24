import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoadingOverlay } from './components/ui';
import { AuthProvider } from './hooks/useAuth';
import './styles/index.css';

const ProtectedRoute = lazy(() => import('./components/ProtectedRoute').then((module) => ({ default: module.ProtectedRoute })));
const Layout = lazy(() => import('./components/Layout').then((module) => ({ default: module.Layout })));
const LoginPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/AuthPages').then((module) => ({ default: module.ForgotPasswordPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const DevicesPage = lazy(() => import('./pages/Devices').then((module) => ({ default: module.DevicesPage })));
const PairPage = lazy(() => import('./pages/PairPage').then((module) => ({ default: module.PairPage })));
const AccountPage = lazy(() => import('./pages/Account').then((module) => ({ default: module.AccountPage })));
const OverviewPage = lazy(() => import('./pages/DevicePages').then((module) => ({ default: module.OverviewPage })));
const FeedPage = lazy(() => import('./pages/DevicePages').then((module) => ({ default: module.FeedPage })));
const SchedulesPage = lazy(() => import('./pages/DevicePages').then((module) => ({ default: module.SchedulesPage })));
const MotorSettingsPage = lazy(() => import('./pages/DevicePages').then((module) => ({ default: module.MotorSettingsPage })));
const LogsPage = lazy(() => import('./pages/DevicePages').then((module) => ({ default: module.LogsPage })));
const DeviceSettingsPage = lazy(() => import('./pages/DevicePages').then((module) => ({ default: module.DeviceSettingsPage })));

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingOverlay />}>
          <Routes>
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/devices" element={<DevicesPage />} />
                <Route path="/devices/pair" element={<PairPage />} />
                <Route path="/devices/:deviceId/overview" element={<OverviewPage />} />
                <Route path="/devices/:deviceId/feed" element={<FeedPage />} />
                <Route path="/devices/:deviceId/schedules" element={<SchedulesPage />} />
                <Route path="/devices/:deviceId/motor-settings" element={<MotorSettingsPage />} />
                <Route path="/devices/:deviceId/logs" element={<LogsPage />} />
                <Route path="/devices/:deviceId/settings" element={<DeviceSettingsPage />} />
                <Route path="/account" element={<AccountPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
