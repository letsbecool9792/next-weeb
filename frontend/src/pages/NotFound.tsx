import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Footer from '../components/Footer';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-fuchsia-950 text-white flex flex-col">
            
            <div className="flex-1 flex items-center justify-center px-4 pt-16">
                <div className="text-center max-w-2xl">
                    {/* 404 Number */}
                    <div className="mb-8">
                        <h1 className="text-9xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                            404
                        </h1>
                        <div className="flex justify-center gap-4 mt-4">
                            <div className="w-16 h-1 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"></div>
                            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></div>
                        </div>
                    </div>

                    {/* Message */}
                    <h2 className="text-3xl font-bold mb-4">Page Not Found</h2>
                    <p className="text-lg opacity-80 mb-8">
                        Oops! Looks like this page doesn't exist in our database. 
                        The page you're looking for has wandered into another dimension.
                    </p>

                    {/* Anime-themed message */}
                    <div className="card mb-8 inline-block">
                        <p className="text-sm opacity-70">
                            "404: Anime Not Found - Maybe it's on a filler arc?" 
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button 
                            onClick={() => navigate(-1)}
                            className="btn-secondary gap-2"
                        >
                            <ArrowLeft size={20} />
                            Go Back
                        </button>
                        
                        <button 
                            onClick={() => navigate('/')}
                            className="btn-primary gap-2"
                        >
                            <Home size={20} />
                            Home Page
                        </button>
                    </div>

                    {/* Decorative Elements */}
                    <div className="mt-12 flex justify-center gap-8 opacity-50">
                        <div className="w-24 h-24 rounded-full bg-purple-500/20 blur-2xl"></div>
                        <div className="w-24 h-24 rounded-full bg-pink-500/20 blur-2xl"></div>
                        <div className="w-24 h-24 rounded-full bg-blue-500/20 blur-2xl"></div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default NotFound;
