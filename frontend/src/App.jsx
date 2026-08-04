import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useStore from './store/useStore';
import useSettingsStore from './store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { applyTheme } from './utils/theme';
import { API_ORIGIN } from './lib/api';
import Layout from './components/Layout';
import Login from './pages/Auth/Login';
import HotelLanding from './pages/Public/HotelLanding';

// Guest Panel
import GuestLogin from './pages/Guest/Login';
import GuestDashboard from './pages/Guest/Dashboard';

// Reception
import ReceptionBookingsArrivals from './pages/Reception/BookingsArrivals';
import ReceptionRoomsStatus from './pages/Reception/RoomsStatus';
import ReceptionBillingCashier from './pages/Reception/BillingCashier';
import ReceptionSettings from './pages/Reception/Settings';
import ReceptionStaffTasks from './pages/Reception/StaffTasks';

// Manager
import ManagerDashboard from './pages/Manager/Dashboard';
import ManagerStaff from './pages/Manager/Staff';
import ManagerBookings from './pages/Manager/Bookings';
import ManagerMaintenance from './pages/Manager/Maintenance';
import ManagerReports from './pages/Manager/Reports';
import ManagerChannelPerformance from './pages/Manager/ChannelPerformance';
import ManagerRates from './pages/Manager/Rates';

// Admin
import AdminDashboard from './pages/Admin/Dashboard';
import AdminUsers from './pages/Admin/Users';
import AdminRoles from './pages/Admin/Roles';
import AdminAuditLogs from './pages/Admin/AuditLogs';
import AdminSettings from './pages/Admin/Settings';
import AdminRoomTypes from './pages/Admin/RoomTypes';
import AdminIntegrations from './pages/Admin/Integrations';
import AdminPaymentGateways from './pages/Admin/PaymentGateways';
import AdminBackups from './pages/Admin/Backups';

// Housekeeping
import HousekeepingDashboard from './pages/Housekeeping/Dashboard';
import HousekeepingTasks from './pages/Housekeeping/Tasks';
import HousekeepingRooms from './pages/Housekeeping/RoomStatus';
import HousekeepingLostItems from './pages/Housekeeping/LostItems';

// Bellboy
import BellboyDashboard from './pages/Bellboy/Dashboard';
import BellboyTasks from './pages/Bellboy/Tasks';
import BellboyRequests from './pages/Bellboy/GuestRequests';
import BellboyLuggage from './pages/Bellboy/Luggage';

// Procurement
import ProcurementDashboard from './pages/Procurement/Dashboard';
import ProcurementInventory from './pages/Procurement/Inventory';
import ProcurementVendors from './pages/Procurement/Vendors';
import ProcurementOrders from './pages/Procurement/PurchaseOrders';

function ProtectedRoute({ children }) {
  const { token, user } = useStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  return children;
}

function ProtectedGuestRoute({ children }) {
  const { guest } = useStore();
  if (!guest) return <Navigate to="/guest/login" replace />;
  return children;
}

function App() {
  const { token, user, logout } = useStore();
  const { settings, fetchSettings } = useSettingsStore();
  const { i18n } = useTranslation();
  const homePath = token ? `/${(user?.role || 'reception').toLowerCase()}` : '/login';

  // Fetch settings globally
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Init theme
  useEffect(() => {
    const storedTheme = localStorage.getItem('themeMode') || 'light';
    if (storedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Handle global socket connection and forced logout
  useEffect(() => {
    if (!token) return;

    const socket = io(API_ORIGIN, {
      auth: { token, type: 'staff' }
    });

    socket.on('force-logout', () => {
      logout();
      window.location.href = '/login';
    });

    return () => {
      socket.disconnect();
    };
  }, [token, logout]);

  useEffect(() => {
    if (settings) {
      const isInternal = !!token;
      const themeColor = (isInternal && settings.internal_theme_color) ? settings.internal_theme_color : settings.theme_color;
      const appName = (isInternal && settings.internal_name) ? settings.internal_name : settings.name;
      const logoUrl = (isInternal && settings.internal_logo_url) ? settings.internal_logo_url : settings.logo_url;

      if (themeColor) applyTheme(themeColor);
      if (appName) document.title = appName;
      if (settings.app_language) i18n.changeLanguage(settings.app_language);
      if (logoUrl) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = `${API_ORIGIN}${logoUrl}`;
      }
    }
  }, [settings, token]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={token ? <Navigate to={homePath} replace /> : <HotelLanding />} />
        <Route path="/login" element={token ? <Navigate to={homePath} replace /> : <Login />} />
        
        {/* Guest Routes */}
        <Route path="/guest/login" element={<GuestLogin />} />
        <Route path="/guest/*" element={<ProtectedGuestRoute><GuestDashboard /></ProtectedGuestRoute>} />
        
        {/* Protected Staff Routes wrapped in Layout */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          
          {/* Reception Panel */}
          <Route path="/reception" element={<Navigate to="/reception/bookings" replace />} />
          <Route path="/reception/bookings" element={<ReceptionBookingsArrivals />} />
          <Route path="/reception/rooms" element={<ReceptionRoomsStatus />} />
          <Route path="/reception/billing" element={<ReceptionBillingCashier />} />
          <Route path="/reception/tasks" element={<ReceptionStaffTasks />} />
          <Route path="/reception/settings" element={<ReceptionSettings />} />
          
          {/* Manager Panel */}
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/staff" element={<ManagerStaff />} />
          <Route path="/manager/bookings" element={<ManagerBookings />} />
          <Route path="/manager/maintenance" element={<ManagerMaintenance />} />
          <Route path="/manager/reports" element={<ManagerReports />} />
          <Route path="/manager/channel-performance" element={<ManagerChannelPerformance />} />
          <Route path="/manager/rates" element={<ManagerRates />} />
          
          {/* Admin Panel */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/roles" element={<AdminRoles />} />
          <Route path="/admin/audit" element={<AdminAuditLogs />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/room-types" element={<AdminRoomTypes />} />
          <Route path="/admin/integrations" element={<AdminIntegrations />} />
          <Route path="/admin/payment-gateways" element={<AdminPaymentGateways />} />
          <Route path="/admin/backups" element={<AdminBackups />} />
          
          {/* Housekeeping Panel */}
          <Route path="/housekeeping" element={<HousekeepingDashboard />} />
          <Route path="/housekeeping/tasks" element={<HousekeepingTasks />} />
          <Route path="/housekeeping/rooms" element={<HousekeepingRooms />} />
          <Route path="/housekeeping/lost-items" element={<HousekeepingLostItems />} />
          
          {/* Bellboy Panel */}
          <Route path="/bellboy" element={<BellboyDashboard />} />
          <Route path="/bellboy/tasks" element={<BellboyTasks />} />
          <Route path="/bellboy/requests" element={<BellboyRequests />} />
          <Route path="/bellboy/luggage" element={<BellboyLuggage />} />
          
          {/* Procurement Panel */}
          <Route path="/procurement" element={<ProcurementDashboard />} />
          <Route path="/procurement/inventory" element={<ProcurementInventory />} />
          <Route path="/procurement/vendors" element={<ProcurementVendors />} />
          <Route path="/procurement/orders" element={<ProcurementOrders />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
