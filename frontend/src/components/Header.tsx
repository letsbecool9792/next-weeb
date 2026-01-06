import { User } from 'lucide-react';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { API_URL } from '../config';

const Header = ({setIsLoggedIn} : {setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

    // Toggle profile dropdown
    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    const handleLogout = async () => {
        const res = await fetch(`${API_URL}/api/logout/`, {
          method: 'GET',
          credentials: 'include',
        });
        if (res.ok) {
          setIsLoggedIn(false);           // clear React state
          window.location.href = '/';  // send them to landing page
        } else {
          console.error('Logout failed');
        }
        
    };

    return (
    <nav className="px-4 sm:px-6 lg:px-8 py-4 bg-gray-900 text-white">
        <div className="flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center">
            <a href="/dashboard" className="text-decoration-none">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-400 cursor-pointer">
                NextWeeb
            </span>
            </a>
        </div>
        
        {/* Main Navigation Links - Desktop */}
        <div className="hidden md:flex space-x-8">
            <a href="/animelist" className="hover:text-purple-300 transition-colors">
            Anime List
            </a>
            <a href="/search" className="hover:text-purple-300 transition-colors">
            Search
            </a>
            <a href="/recommendations" className="hover:text-purple-300 transition-colors">
            Recommendations
            </a>
            <a href="/stats" className="hover:text-purple-300 transition-colors">
            Stats
            </a>
        </div>
        
        {/* Profile Button - Desktop */}
        <div className="hidden md:block relative">
            <button 
            onClick={toggleProfileDropdown}
            className="flex items-center space-x-2 hover:text-purple-300 transition-colors"
            >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                <User className="w-5 h-5" />
            </div>
            </button>
            
            {/* Profile Dropdown */}
            {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-10">
                <a href="/profile" className="block px-4 py-2 hover:bg-gray-700">
                Profile
                </a>
                <a onClick = {handleLogout} 
                className="block px-4 py-2 hover:bg-gray-700">
                Logout
                </a>
            </div>
            )}
        </div>
        
        {/* Mobile Menu Button */}
        <div className="md:hidden">
            <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none"
            >
            {isMenuOpen ? (
                <X className="w-6 h-6" />
            ) : (
                <Menu className="w-6 h-6" />
            )}

            </button>
        </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
        <div className="md:hidden mt-4 space-y-4 py-4">
            <a href="/animelist" className="block hover:text-purple-300 transition-colors">
            Anime List
            </a>
            <a href="/search" className="block hover:text-purple-300 transition-colors">
            Search
            </a>
            <a href="/recommendations" className="block hover:text-purple-300 transition-colors">
            Recommendations
            </a>
            <a href="/stats" className="block hover:text-purple-300 transition-colors">
            Stats
            </a>
            <hr className="border-gray-700" />
            <a href="/profile" className="block hover:text-purple-300 transition-colors">
            Profile
            </a>
            <a href="/" className="block hover:text-purple-300 transition-colors">
            Logout
            </a>
        </div>
        )}
    </nav>
    );
}

export default Header;