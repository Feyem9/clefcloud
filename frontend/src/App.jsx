import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PremiumRoute from './components/PremiumRoute';
import AdminRoute from './components/AdminRoute';
import { useTheme } from './contexts/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import AdminResetPassword from './pages/AdminResetPassword';
import Library from './pages/Library';
import Upload from './pages/Upload';
import Messe from './pages/Messe';
import Contact from './pages/Contact';
import Profile from './pages/Profile';
import Premium from './pages/Premium';
import PaymentSuccess from './pages/PaymentSuccess';
import TestBench from './pages/TestBench';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { isDarkMode } = useTheme();

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? 'dark' : 'light'}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin-reset-password" element={<AdminResetPassword />} />

          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />

          <Route
            path="/upload"
            element={
              <AdminRoute>
                <Upload />
              </AdminRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/messe"
            element={
              <ProtectedRoute>
                <Messe />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/contact" element={<Contact />} />
          <Route path="/premium" element={<Premium />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/test-bench" element={<TestBench />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;
