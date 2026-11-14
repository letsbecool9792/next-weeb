import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X, User, Search, LogOut } from 'lucide-react';
import { useAuth } from '../auth/useAuth';
import SearchBox from './SearchBox';
import Logo from './brand/Logo';

const NAV_ITEMS = [
    { to: '/dashboard', label: 'Home' },
    { to: '/animelist', label: 'My List' },
    { to: '/recommendations', label: 'Discover' },
    { to: '/stats', label: 'Stats' },
];

/**
 * Fixed top bar. Transparent over the page's banner, then frosted once the
 * page scrolls. The active page gets a pill that glides between links.
 */
const Header = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [accountOpen, setAccountOpen] = useState(false);
    const [mobileSearch, setMobileSearch] = useState(false);
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 24);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close any open menu when the page changes
    useEffect(() => {
        setMenuOpen(false);
        setAccountOpen(false);
        setMobileSearch(false);
    }, [location.pathname]);

    const handleLogout = async () => {
        // Revoke the refresh token on the server, then clear local tokens
        await signOut();
        navigate('/', { replace: true });
    };

    const solid = scrolled || menuOpen || mobileSearch;

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
                solid ? 'border-b border-white/5 bg-ink/85 shadow-lg shadow-black/30 backdrop-blur-xl' : 'bg-transparent'
            }`}
        >
            <div className="flex h-16 items-center gap-4 px-4 sm:px-8">
                <Logo to="/dashboard" />

                <nav className="ml-4 hidden items-center gap-1 md:flex">
                    {NAV_ITEMS.map((item) => (
                        <NavLink key={item.to} to={item.to} className="relative rounded-full px-4 py-1.5 text-sm font-medium">
                            {({ isActive }) => (
                                <>
                                    {isActive && (
                                        <motion.span
                                            layoutId="nav-pill"
                                            className="absolute inset-0 rounded-full bg-white/10 ring-1 ring-white/10"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                    <span className={`relative transition ${isActive ? 'text-white' : 'text-purple-200/70 hover:text-white'}`}>
                                        {item.label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex-1" />

                <div className="hidden w-64 md:block lg:w-80">
                    <SearchBox />
                </div>

                <button
                    onClick={() => setMobileSearch((v) => !v)}
                    aria-label="Search"
                    className="rounded-full p-2 text-purple-100 transition hover:bg-white/10 md:hidden"
                >
                    <Search className="h-5 w-5" />
                </button>

                {/* Account */}
                <div className="relative hidden md:block">
                    <button
                        onClick={() => setAccountOpen((v) => !v)}
                        aria-label="Account menu"
                        className="block rounded-full ring-2 ring-transparent transition hover:ring-pink-400/60"
                    >
                        {user?.picture ? (
                            <img src={user.picture} alt="" className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
                                <User className="h-5 w-5" />
                            </span>
                        )}
                    </button>
                    <AnimatePresence>
                        {accountOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-0 mt-3 w-56 origin-top-right overflow-hidden rounded-2xl border border-white/10 bg-ink-soft/95 py-2 shadow-2xl shadow-black/60 backdrop-blur-xl"
                            >
                                {user?.name && <p className="truncate px-4 pb-2 pt-1 text-sm font-semibold">{user.name}</p>}
                                <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm transition hover:bg-white/10">
                                    <User className="h-4 w-4" /> Profile
                                </Link>
                                <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-rose-300 transition hover:bg-white/10">
                                    <LogOut className="h-4 w-4" /> Log out
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                    className="rounded-full p-2 transition hover:bg-white/10 md:hidden"
                >
                    {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            <AnimatePresence>
                {mobileSearch && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 md:hidden"
                    >
                        <SearchBox autoFocus onDone={() => setMobileSearch(false)} />
                    </motion.div>
                )}
                {menuOpen && (
                    <motion.nav
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden px-4 md:hidden"
                    >
                        <div className="space-y-1 pb-4">
                            {[...NAV_ITEMS, { to: '/search', label: 'Search' }, { to: '/profile', label: 'Profile' }].map((item, i) => (
                                <motion.div key={item.to} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                                    <NavLink
                                        to={item.to}
                                        className={({ isActive }) => `block rounded-xl px-4 py-3 font-medium transition ${isActive ? 'bg-white/10 text-white' : 'text-purple-200/80 hover:bg-white/5'}`}
                                    >
                                        {item.label}
                                    </NavLink>
                                </motion.div>
                            ))}
                            <button onClick={handleLogout} className="block w-full rounded-xl px-4 py-3 text-left font-medium text-rose-300 hover:bg-white/5">
                                Log out
                            </button>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;
