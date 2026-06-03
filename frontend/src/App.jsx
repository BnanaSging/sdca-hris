import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeDirectory from './pages/EmployeeDirectory';
import LeaveList from './pages/LeaveList';
import ApplyLeave from './pages/ApplyLeave';
import AuditLogs from './pages/AuditLogs';
import Announcements from './pages/Announcements';
import Notifications from './pages/Notifications';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return currentUser ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;

  return (
    <div className={currentUser ? "app-container" : ""}>
      {currentUser && <Sidebar />}
      <div className={currentUser ? "content-wrapper" : ""}>
      {currentUser && <Navbar />}
      <main className={currentUser ? "main-content" : ""}>
        <Routes>
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/announcements" element={<PrivateRoute><Announcements /></PrivateRoute>} />
          <Route path="/employees" element={<PrivateRoute><EmployeeDirectory /></PrivateRoute>} />
          <Route path="/leave" element={<PrivateRoute><LeaveList /></PrivateRoute>} />
          <Route path="/apply-leave" element={<PrivateRoute><ApplyLeave /></PrivateRoute>} />
          <Route path="/audit" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        </Routes>
      </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <DarkModeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </DarkModeProvider>
    </Router>
  );
}

export default App;
