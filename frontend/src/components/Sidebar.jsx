import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Wallet, Settings, LogOut, BellRing, Package, Building2, ClipboardCheck, DoorOpen, ShoppingCart, FileText, Shield, Activity, Truck, Warehouse, UserCheck, Bell, Bed, Image, Banknote, Globe2, Plug, Percent, CreditCard, DatabaseBackup } from 'lucide-react';
import useStore from '../store/useStore';
import useSettingsStore from '../store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { API_ORIGIN } from '../lib/api';

export default function Sidebar() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useStore();
  const role = user?.role || 'Reception';
  const { settings } = useSettingsStore();
  const isInternal = !!user;
  const hotelName = (isInternal && settings?.internal_name) ? settings.internal_name : (settings?.name || 'Hotel ERP');
  const logoPath = (isInternal && settings?.internal_logo_url) ? settings.internal_logo_url : settings?.logo_url;
  const logoSrc = logoPath ? `${API_ORIGIN}${logoPath}` : null;

  const getNavItems = () => {
    switch (role) {
      case 'Reception':
        return [
          { name: 'Bookings & Arrivals', path: '/reception/bookings', icon: CalendarDays },
          { name: 'Rooms & Status', path: '/reception/rooms', icon: Bed },
          { name: 'Billing & Cashier', path: '/reception/billing', icon: Wallet },
          { name: 'Staff Tasks', path: '/reception/tasks', icon: ClipboardCheck },
          { name: 'Settings', path: '/reception/settings', icon: Settings },
        ];
      case 'Manager':
        return [
          { name: 'Dashboard', path: '/manager', icon: LayoutDashboard },
          { name: 'Staff', path: '/manager/staff', icon: Users },
          { name: 'Bookings', path: '/manager/bookings', icon: CalendarDays },
          { name: 'Channel Performance', path: '/manager/channel-performance', icon: Globe2 },
          { name: 'Maintenance', path: '/manager/maintenance', icon: Building2 },
          { name: 'Rates', path: '/manager/rates', icon: Percent },
          { name: 'Reports', path: '/manager/reports', icon: FileText },
        ];
      case 'Admin':
        return [
          { name: t('sidebar.dashboard'), path: '/admin', icon: LayoutDashboard },
          { name: t('sidebar.users'), path: '/admin/users', icon: Users },
          { name: t('sidebar.roles'), path: '/admin/roles', icon: Shield },
          { name: t('sidebar.rooms'), path: '/admin/room-types', icon: Image },
          { name: t('sidebar.integrations'), path: '/admin/integrations', icon: Plug },
          { name: 'Payment Gateways', path: '/admin/payment-gateways', icon: CreditCard },
          { name: 'Backups', path: '/admin/backups', icon: DatabaseBackup },
          { name: 'Audit Logs', path: '/admin/audit', icon: Activity },
          { name: t('sidebar.settings'), path: '/admin/settings', icon: Settings },
        ];
      case 'Housekeeping':
      case 'HousekeepingSupervisor':
        return [
          { name: 'Dashboard', path: '/housekeeping', icon: LayoutDashboard },
          { name: 'Tasks', path: '/housekeeping/tasks', icon: ClipboardCheck },
          { name: 'Room Status', path: '/housekeeping/rooms', icon: DoorOpen },
          { name: 'Lost & Found', path: '/housekeeping/lost-items', icon: Package },
        ];
      case 'Bellboy':
        return [
          { name: 'Dashboard', path: '/bellboy', icon: LayoutDashboard },
          { name: 'My Tasks', path: '/bellboy/tasks', icon: ClipboardCheck },
          { name: 'Guest Requests', path: '/bellboy/requests', icon: Bell },
          { name: 'Luggage', path: '/bellboy/luggage', icon: Truck },
        ];
      case 'Procurement':
        return [
          { name: 'Dashboard', path: '/procurement', icon: LayoutDashboard },
          { name: 'Inventory', path: '/procurement/inventory', icon: Warehouse },
          { name: 'Vendors', path: '/procurement/vendors', icon: UserCheck },
          { name: 'Purchase Orders', path: '/procurement/orders', icon: ShoppingCart },
        ];
      default:
        return [{ name: 'Dashboard', path: `/${role.toLowerCase()}`, icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 shadow-2xl z-20">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 bg-slate-950/50 border-b border-slate-800">
        <div className="flex items-center gap-2 text-brand-500 font-bold text-xl tracking-tight min-w-0">
          {logoSrc ? (
            <img src={logoSrc} alt={hotelName} className="w-8 h-8 rounded-lg object-cover shrink-0" />
          ) : (
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-slate-900 shrink-0">
              {hotelName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="truncate">{hotelName}</span>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-6 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{role}</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group font-medium ${
                isActive 
                  ? 'bg-brand-500/10 text-brand-400' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-white'}`} />
              {item.name}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 bg-slate-950/30 border-t border-slate-800 space-y-3">
        <div className="px-3">
          <p className="text-sm font-medium text-white truncate">{user?.name || 'Staff'}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>{t('sidebar.logout')}</span>
        </button>
      </div>
    </aside>
  );
}
