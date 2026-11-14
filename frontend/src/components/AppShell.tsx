import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import Header from './Header';
import Footer from './Footer';

/**
 * Layout route for every logged-in page (see routes.tsx): header, the page,
 * footer. It stays mounted while you move between pages, so the header never
 * blinks and only the content area swaps. While a page's code downloads
 * (pages load lazily) the content area stays empty instead of the whole screen.
 */
const AppShell = () => {
    const location = useLocation();
    return (
        <div className="page-bg flex flex-col">
            <Header />
            <motion.main
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="min-h-screen flex-1"
            >
                <Suspense fallback={null}>
                    <Outlet />
                </Suspense>
            </motion.main>
            <Footer />
        </div>
    );
};

export default AppShell;
