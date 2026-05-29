import { Navigate, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import OTPVerifyPage from './pages/auth/OTPVerifyPage'
import DashboardPage from './pages/DashboardPage'
import GroupsPage from './pages/groups/GroupsPage'
import GroupDetailsPage from './pages/groups/GroupDetailsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/otp" element={<OTPVerifyPage />} />

      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/:id" element={<GroupDetailsPage />} />

      {/* Fallback: évite un rendu vide si aucune route ne matche */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  )
}



