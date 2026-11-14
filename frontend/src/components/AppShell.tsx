import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import Header from './Header';
import Footer from './Footer';

/**
 * Frame for every logged-in page: fixed header, the page, footer.
 * Each page fades and slides in when you navigate to it.
 */
const AppShell = ({ children }: { children: React.ReactNode }) => {
    const location = useLocation();
    return (
        <div className="page-bg flex flex-col">
            <Header />
            <motion.main
                key={location.pathname}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="flex-1"
            >
                {children}
            </motion.main>
            <Footer />
        </div>
    );
};

export default AppShell;
