import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomePage from './pages/WelcomePage';
import LanguagePage from './pages/LanguagePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ServiceSelectionPage from './pages/ServiceSelectionPage';
import ComplaintPage from './pages/ComplaintPage';
import UploadDocumentsPage from './pages/UploadDocumentsPage';
import PaymentPage from './pages/PaymentPage';
import StatusTrackingPage from './pages/StatusTrackingPage';
import ReceiptPage from './pages/ReceiptPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import RequestsManagementPage from './pages/RequestsManagementPage';
import ComplaintsManagementPage from './pages/ComplaintsManagementPage';
import UsersManagementPage from './pages/UsersManagementPage';
import ReportsPage from './pages/ReportsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/language" element={<LanguagePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowGuest>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute>
            <ServiceSelectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/complaints"
        element={
          <ProtectedRoute>
            <ComplaintPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload-documents"
        element={
          <ProtectedRoute>
            <UploadDocumentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/status-tracking"
        element={
          <ProtectedRoute>
            <StatusTrackingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/receipt"
        element={
          <ProtectedRoute>
            <ReceiptPage />
          </ProtectedRoute>
        }
      />

      <Route path="/admin" element={<AdminLoginPage />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/requests"
        element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <RequestsManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <ComplaintsManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <UsersManagementPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute roles={['ADMIN', 'SUPER_ADMIN']}>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
