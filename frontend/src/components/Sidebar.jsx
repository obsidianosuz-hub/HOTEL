import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarDays, Wallet, Settings, LogOut, BellRing, Package, Building2, ClipboardCheck, DoorOpen, ShoppingCart, FileText, Shield, Activity, Truck, Warehouse, UserCheck, Bell, Bed, Image, Banknote, Globe2, Plug, Percent, CreditCard, DatabaseBackup, Wrench, ChefHat } from 'lucide-react';
import useStore from '../store/useStore';
import useSettingsStore from '../store/useSettingsStore';
import { useTranslation } from 'react-i18next';
import { API_ORIGIN } from '../lib/api';

export default function Sidebar({ onMobileClose, isResponsive }) {
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
          { name: t('sidebar.bookingsArrivals'), path: '/reception/bookings', icon: CalendarDays },
          { name: t('sidebar.roomsStatus'), path: '/reception/rooms', icon: Bed },
          { name: t('sidebar.billing'), path: '/reception/billing', icon: Wallet },
          { name: t('sidebar.staffTasks'), path: '/reception/tasks', icon: ClipboardCheck },
          { name: 'Lost & Found', path: '/reception/lost-items', icon: Package },
          { name: t('sidebar.settings'), path: '/reception/settings', icon: Settings },
        ];
      case 'Manager':
        return [
          { name: t('sidebar.dashboard'), path: '/manager', icon: LayoutDashboard },
          { name: t('sidebar.staff'), path: '/manager/staff', icon: Users },
          { name: t('sidebar.bookings'), path: '/manager/bookings', icon: CalendarDays },
          { name: t('sidebar.channels'), path: '/manager/channels', icon: Globe2 },
          { name: t('sidebar.maintenance'), path: '/manager/maintenance', icon: Building2 },
          { name: t('sidebar.rates'), path: '/manager/rates', icon: Percent },
          { name: t('sidebar.finances'), path: '/manager/finances', icon: Banknote },
          { name: t('sidebar.reports'), path: '/manager/reports', icon: FileText },
          { name: t('sidebar.mySettings'), path: '/manager/settings', icon: Settings },
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
          { name: t('sidebar.dashboard'), path: '/housekeeping', icon: LayoutDashboard },
          { name: t('sidebar.staffTasks'), path: '/housekeeping/tasks', icon: ClipboardCheck },
          { name: t('sidebar.roomsStatus'), path: '/housekeeping/rooms', icon: Bed },
          { name: 'Lost & Found', path: '/housekeeping/lost-items', icon: Package },
          { name: "Ta'minot", path: '/housekeeping/supplies', icon: ShoppingCart },
          { name: t('sidebar.settings'), path: '/housekeeping/settings', icon: Settings },
        ];
      case 'Bellboy':
        return [
          { name: t('sidebar.dashboard'), path: '/bellboy', icon: LayoutDashboard },
          { name: t('sidebar.myTasks'), path: '/bellboy/tasks', icon: ClipboardCheck },
          { name: t('sidebar.guestRequests'), path: '/bellboy/requests', icon: Bell },
          { name: t('sidebar.luggage'), path: '/bellboy/luggage', icon: Truck },
          { name: t('sidebar.mySettings'), path: '/bellboy/settings', icon: Settings },
        ];
      case 'Procurement':
        return [
          { name: t('sidebar.dashboard'), path: '/procurement', icon: LayoutDashboard },
          { name: 'Talabnomalar', path: '/procurement/supply-requests', icon: Package },
          { name: t('sidebar.inventory'), path: '/procurement/inventory', icon: Warehouse },
          { name: t('sidebar.vendors'), path: '/procurement/vendors', icon: UserCheck },
          { name: t('sidebar.purchaseOrders'), path: '/procurement/orders', icon: ShoppingCart },
          { name: t('sidebar.mySettings'), path: '/procurement/settings', icon: Settings },
        ];
      case 'Usta':
        return [
          { name: t('sidebar.dashboard'), path: '/usta', icon: LayoutDashboard },
          { name: t('sidebar.myTasks'), path: '/usta/tasks', icon: Wrench },
          { name: "Ta'minot", path: '/usta/supplies', icon: ShoppingCart },
          { name: t('sidebar.mySettings'), path: '/usta/settings', icon: Settings },
        ];
      case 'Oshpaz':
        return [
          { name: t('sidebar.dashboard'), path: '/oshpaz', icon: LayoutDashboard },
          { name: t('sidebar.orders'), path: '/oshpaz/orders', icon: ChefHat },
          { name: "Menyu Boshqaruvi", path: '/oshpaz/menu', icon: ClipboardCheck },
          { name: "Ta'minot", path: '/oshpaz/supplies', icon: ShoppingCart },
          { name: t('sidebar.mySettings'), path: '/oshpaz/settings', icon: Settings },
        ];
      default:
    }
  };

  const permissions = user?.permissions || [];
  const baseItems = getNavItems();
  
  const addDynamicItems = (items) => {
    // Prevent duplicates
    const hasItem = (path) => items.some(i => i.path === path);
    const roleBase = role.toLowerCase().trim();
    
    // Map of modules to their sidebar representation
    const dynamicMap = {
      'staff': { name: 'Xodimlar (Staff)', path: `/${roleBase}/staff`, icon: Users },
      'bookings': { name: 'Bookings', path: `/${roleBase}/bookings`, icon: CalendarDays },
      'reports': { name: 'Reports', path: `/${roleBase}/reports`, icon: FileText },
      'kitchen-orders': { name: 'Oshxona (Kitchen)', path: `/${roleBase}/kitchen-orders`, icon: ChefHat },
      'maintenance': { name: 'Ta\'mirlash (Maintenance)', path: `/${roleBase}/maintenance`, icon: Wrench },
      'inventory': { name: 'Omborxona (Inventory)', path: `/${roleBase}/inventory`, icon: Warehouse },
      'tasks': { name: 'Vazifalar (Tasks)', path: `/${roleBase}/tasks`, icon: ClipboardCheck },
      'payments': { name: 'To\'lovlar (Payments)', path: `/${roleBase}/payments`, icon: Wallet },
    };

    permissions.forEach(perm => {
      if (perm.can_view && dynamicMap[perm.module]) {
        // Skip adding "Oshxona (Kitchen)" for Oshpaz because they already have "Buyurtmalar" (Orders)
        if (roleBase === 'oshpaz' && perm.module === 'kitchen-orders') {
          return;
        }
        
        // Skip adding "To'lovlar (Payments)" for Reception because they already have "Hisob-kassa (Billing)"
        if (roleBase.includes('reception') && perm.module === 'payments') {
          return;
        }
        
        // Skip adding "Ta'mirlash (Maintenance)" for Housekeeping
        if (roleBase.includes('housekeeping') && perm.module === 'maintenance') {
          return;
        }
        
        const newItem = dynamicMap[perm.module];
        // If the panel doesn't already have this exact path, add it
        if (!hasItem(newItem.path)) {
          items.push(newItem);
        }
      }
    });

    return items;
  };

  const navItems = addDynamicItems(baseItems);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-full bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 shadow-2xl z-20">
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
              onClick={() => {
                if (isResponsive && onMobileClose) {
                  onMobileClose();
                }
              }}
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
