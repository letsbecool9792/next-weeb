import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Home } from 'lucide-react';
import PosterWall from '../components/ui/PosterWall';
import { useAuth } from '../auth/useAuth';

const NotFound = () => {
    const navigate = useNavigate();
    const { isLoggedIn } = useAuth();

    return (
        <div className="page-bg relative flex items-center justify-center overflow-hidden px-4">
            <PosterWall className="opacity-15" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgb(11_6_20/0.7)_0%,rgb(11_6_20)_70%)]" />

            <div className="relative z-10 max-w-xl text-center">
                <motion.h1
                    initial={{ opacity: 0, scale: 0.5, rotate: -8 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 160, damping: 12 }}
                    className="text-[9rem] font-bold leading-none text-gradient-animated sm:text-[12rem]"
                >
                    404
                </motion.h1>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="mt-2 text-3xl font-bold">This episode doesn't exist</h2>
                    <p className="mt-4 text-lg text-purple-200/80">
                        Looks like this page wandered into another dimension. Maybe it's on a filler arc?
                    </p>
                    <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                        <button onClick={() => navigate(-1)} className="btn-secondary px-6 py-3">
                            <ArrowLeft className="h-4 w-4" /> Go back
                        </button>
                        <Link to={isLoggedIn ? '/dashboard' : '/'} className="btn-primary px-6 py-3">
                            <Home className="h-4 w-4" /> {isLoggedIn ? 'Home' : 'Main page'}
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFound;
