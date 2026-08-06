import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import useStore from '../store/useStore';

export default function Layout() {
  const { pathname } = useLocation();
  const { user } = useStore();
  const role = user?.role || 'Reception';

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
      <Sidebar />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <Header />
        <main className="p-6 lg:p-8 dark:bg-slate-950 transition-colors duration-300">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
