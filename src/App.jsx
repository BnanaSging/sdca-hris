import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { useEffect } from 'react';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
import OrgStructure from './pages/OrgStructure';
import Reports from './pages/Reports';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  return currentUser ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  
  if (!currentUser) return <Navigate to="/login" />;

  const position = userData?.position?.toLowerCase() || '';
  const EXEC_POSITIONS = [
    'president', 'vp', 'vpaa',
    'vice president',
    'vice president for academic affairs (vpaa)',
    'vice president for academic affairs',
    'vice president for administration',
    'vice president for finance',
  ];
  const isAdmin = userData?.role?.toLowerCase() === 'admin' ||
    userData?.position?.toLowerCase() === 'admin' ||
    userData?.role?.toLowerCase() === 'superadmin' ||
    userData?.department?.toLowerCase() === 'hr' ||
    userData?.department?.toLowerCase() === 'human resources' ||
    EXEC_POSITIONS.includes(position);

  return isAdmin ? children : <Navigate to="/" />;
};

const DirectoryRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  
  if (!currentUser) return <Navigate to="/login" />;

  const position = userData?.position?.toLowerCase() || '';
  const role = userData?.role?.toLowerCase() || '';
  const HIGHER_POSITIONS = [
    'president', 'vp', 'vpaa',
    'vice president',
    'vice president for academic affairs (vpaa)',
    'vice president for academic affairs',
    'vice president for administration',
    'vice president for finance',
    'dean',
    'associate dean',
    'program chair / department head'
  ];
  
  const isAllowed = role === 'admin' || role === 'superadmin' || 
    userData?.department?.toLowerCase() === 'hr' || 
    userData?.department?.toLowerCase() === 'human resources' ||
    HIGHER_POSITIONS.includes(position);

  return isAllowed ? children : <Navigate to="/" />;
};

const PageActionTracker = () => {
  const location = useLocation();
  const { currentUser, userData } = useAuth();

  useEffect(() => {
    if (currentUser && location.pathname !== '/login' && location.pathname !== '/register') {
      const logAccess = async () => {
        try {
          const path = location.pathname.substring(1);
          const pageName = location.pathname === '/' ? 'Dashboard' : path.charAt(0).toUpperCase() + path.slice(1);
          await addDoc(collection(db, 'audit_logs'), {
            action: 'Page Accessed',
            performedBy: userData?.name || currentUser.email || 'Unknown User',
            timestamp: new Date().toISOString(),
            details: `Accessed the ${pageName} page.`
          });
        } catch (e) {
          console.error("Failed to log page access:", e);
        }
      };
      logAccess();
    }
  }, [location.pathname, currentUser, userData]);

  return null;
};

function AppRoutes() {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;

  return (
    <div className={currentUser ? "app-container" : ""}>
      {currentUser && <Sidebar />}
      <div className={currentUser ? "content-wrapper" : ""}>
      {currentUser && <Navbar />}
      <PageActionTracker />
      <main className={currentUser ? "main-content" : ""}>
        <Routes>
          <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/announcements" element={<PrivateRoute><Announcements /></PrivateRoute>} />
          <Route path="/employees" element={<DirectoryRoute><EmployeeDirectory /></DirectoryRoute>} />
          <Route path="/org-structure" element={<AdminRoute><OrgStructure /></AdminRoute>} />
          <Route path="/leave" element={<PrivateRoute><LeaveList /></PrivateRoute>} />
          <Route path="/apply-leave" element={<PrivateRoute><ApplyLeave /></PrivateRoute>} />
          <Route path="/reports" element={<AdminRoute><Reports /></AdminRoute>} />
          <Route path="/audit" element={<AdminRoute><AuditLogs /></AdminRoute>} />
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
