import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import useStore from '../store/useStore';

export default function Layout() {
  const { pathname } = useLocation();
  const { user } = useStore();
  const role = user?.role || 'Reception';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on path change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const responsiveRoles = ['Admin', 'Housekeeping', 'HousekeepingSupervisor', 'Usta', 'Bellboy'];
  const isResponsive = responsiveRoles.includes(role);

  // Role based access control
  const pathPrefix = pathname.split('/')[1];
  
  const rolePaths = {
    'Admin': ['admin'],
    'Manager': ['manager'],
    'Reception': ['reception'],
    'Housekeeping': ['housekeeping'],
    'HousekeepingSupervisor': ['housekeeping'],
    'Bellboy': ['bellboy'],
    'Procurement': ['procurement'],
    'Usta': ['usta'],
    'Oshpaz': ['oshpaz'],
  };

  const allowedPaths = rolePaths[role] || [];
  
  if (role !== 'Admin' && pathPrefix && !allowedPaths.includes(pathPrefix)) {
    const fallbackPath = allowedPaths[0] || 'login';
    return <Navigate to={`/${fallbackPath}`} replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      
      {isResponsive && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className={`h-full ${isResponsive ? `fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}` : 'z-20'}`}>
        <Sidebar onMobileClose={() => setSidebarOpen(false)} isResponsive={isResponsive} />
      </div>

      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <Header 
          isResponsive={isResponsive}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className={`p-4 lg:p-8 dark:bg-slate-950 transition-colors duration-300 ${isResponsive ? 'sm:p-6' : 'p-6'}`}>
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
