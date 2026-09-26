import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './layouts/DashboardLayout';

import Overview from './pages/dashboard/Overview';
import SkillsList from './pages/dashboard/SkillsList';
import SkillDetail from './pages/dashboard/SkillDetail';
import Evidence from './pages/dashboard/Evidence';
import Trajectory from './pages/dashboard/Trajectory';
import Development from './pages/dashboard/Development';
import Career from './pages/dashboard/Career';
import Settings from './pages/dashboard/Settings';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F2F1FA] text-[#17152F] font-sans">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              } 
            >
              <Route index element={<Overview />} />
              <Route path="skills" element={<SkillsList />} />
              <Route path="skills/:skillId" element={<SkillDetail />} />
              <Route path="evidence" element={<Evidence />} />
              <Route path="trajectory" element={<Trajectory />} />
              <Route path="development" element={<Development />} />
              <Route path="career" element={<Career />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
