import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import DispatchOffice from './pages/DispatchOffice';
import Scanning from './pages/Scanning';
import Vehicles from './pages/Vehicles';
import Transfers from './pages/Transfers';
import AdminUsers from './pages/AdminUsers';
import AdminGodowns from './pages/AdminGodowns';
import SyncLogPage from './pages/SyncLogPage';
import AuditLogPage from './pages/AuditLogPage';
import GodownScreen from './pages/GodownScreen';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              {/* Godown TV screens pair independently of normal user auth */}
              <Route path="/godown-screen/:godownCode" element={<GodownScreen />} />

              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/jobs" element={<ProtectedRoute perm="job:read"><Jobs /></ProtectedRoute>} />
                <Route path="/dispatch" element={<ProtectedRoute perm="dispatch:manage"><DispatchOffice /></ProtectedRoute>} />
                <Route path="/scan" element={<ProtectedRoute perm="qr:scan"><Scanning /></ProtectedRoute>} />
                <Route path="/vehicles" element={<ProtectedRoute perm="vehicle:manage"><Vehicles /></ProtectedRoute>} />
                <Route path="/transfers" element={<ProtectedRoute perm="transfer:manage"><Transfers /></ProtectedRoute>} />
                <Route path="/admin/users" element={<ProtectedRoute perm="user:manage"><AdminUsers /></ProtectedRoute>} />
                <Route path="/admin/godowns" element={<ProtectedRoute perm="godown:manage"><AdminGodowns /></ProtectedRoute>} />
                <Route path="/sync-log" element={<ProtectedRoute perm="sync:read"><SyncLogPage /></ProtectedRoute>} />
                <Route path="/audit-log" element={<ProtectedRoute perm="audit:read"><AuditLogPage /></ProtectedRoute>} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
