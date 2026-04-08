import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import AllBookings from './pages/AllBookings';
import ManageBookings from './pages/ManageBookings';
import BookingHistory from './pages/BookingHistory';
import UserBookingHistory from './pages/UserBookingHistory';
import Members from './pages/Members';
import AddMember from './pages/AddMember';
import AddResource from './pages/AddResource';
import Profile from './pages/Profile';
import DamageReports from './pages/DamageReports';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import GuestRoute from './components/GuestRoute';
import { AuthProvider } from './hooks/useAuth';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
          <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

          <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/resources"    element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/bookings/all"          element={<ProtectedRoute><AllBookings /></ProtectedRoute>} />
          <Route path="/bookings/history-user" element={<ProtectedRoute><UserBookingHistory /></ProtectedRoute>} />
          <Route path="/members"      element={<AdminRoute><Members /></AdminRoute>} />
          <Route path="/profile"      element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/bookings/manage"  element={<AdminRoute><ManageBookings /></AdminRoute>} />
          <Route path="/bookings/history" element={<AdminRoute><BookingHistory /></AdminRoute>} />
          <Route path="/damage-reports"   element={<ProtectedRoute><DamageReports /></ProtectedRoute>} />
          <Route path="/members/add"     element={<AdminRoute><AddMember /></AdminRoute>} />
          <Route path="/resources/add"   element={<AdminRoute><AddResource /></AdminRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
