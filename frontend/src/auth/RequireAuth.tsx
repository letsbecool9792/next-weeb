import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Wraps every page that needs a login (see routes.tsx). Logged-out visitors
 * are sent to the login page before the page mounts, so no page fires API
 * requests that are bound to fail, and none needs its own login check.
 */
export const RequireAuth = () => {
    const { isLoggedIn } = useAuth();
    const location = useLocation();

    if (!isLoggedIn) {
        return <Navigate to="/get-started" replace state={{ from: location.pathname }} />;
    }
    return <Outlet />;
};
