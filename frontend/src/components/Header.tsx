import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, User } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

const NAV_ITEMS = [
    { to: '/animelist', label: 'Anime List' },
    { to: '/search', label: 'Search' },
    { to: '/recommendations', label: 'Recommendations' },
    { to: '/stats', label: 'Stats' },
];

// NavLink passes isActive, so the current page is highlighted
const navClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors ${isActive ? 'text-purple-300' : 'hover:text-purple-300'}`;

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const closeMenus = () => {
        setIsMenuOpen(false);
        setIsProfileDropdownOpen(false);
    };

    const handleLogout = async () => {
        closeMenus();
        // Revoke the refresh token on the server, then clear local tokens
        await signOut();
        navigate('/', { replace: true });
    };

    return (
    <nav className="px-4 sm:px-6 lg:px-8 py-4 bg-gray-900 text-white">
        <div className="flex justify-between items-center">
        {/* Logo */}
        <Link to="/dashboard" onClick={closeMenus}>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-400">
                NextWeeb
            </span>
        </Link>

        {/* Main Navigation Links - Desktop */}
        <div className="hidden md:flex space-x-8">
            {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} className={navClass}>
                    {item.label}
                </NavLink>
            ))}
        </div>

        {/* Profile Button - Desktop */}
        <div className="hidden md:block relative">
            <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                aria-label="Account menu"
                className="flex items-center hover:text-purple-300 transition-colors"
            >
                {user?.picture ? (
                    <img src={user.picture} alt="" className="w-8 h-8 rounded-full object-cover border border-purple-400" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                        <User className="w-5 h-5" />
                    </div>
                )}
            </button>

            {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
                <Link to="/profile" onClick={closeMenus} className="block px-4 py-2 hover:bg-gray-700">
                    Profile
                </Link>
                <button onClick={handleLogout} className="block w-full text-left px-4 py-2 hover:bg-gray-700">
                    Logout
                </button>
            </div>
            )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
                className="text-white focus:outline-none"
            >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
        </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
        <div className="md:hidden mt-4 space-y-4 py-4">
            {NAV_ITEMS.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={closeMenus} className={(s) => `block ${navClass(s)}`}>
                    {item.label}
                </NavLink>
            ))}
            <hr className="border-gray-700" />
            <NavLink to="/profile" onClick={closeMenus} className={(s) => `block ${navClass(s)}`}>
                Profile
            </NavLink>
            <button onClick={handleLogout} className="block hover:text-purple-300 transition-colors">
                Logout
            </button>
        </div>
        )}
    </nav>
    );
}

export default Header;
