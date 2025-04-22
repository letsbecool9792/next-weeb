import { useState } from 'react';
import { ArrowRight, ChevronRight, BarChart2, Filter, List, Zap, Award } from 'lucide-react';

const Landing = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-900 text-white">
        {/* Navigation */}
        <nav className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-400">
                NextWeeb
            </span>
            </div>
            <div className="hidden md:flex space-x-8">
            <a href="#features" className="hover:text-purple-300 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-purple-300 transition-colors">How It Works</a>
            <a href="#about" className="hover:text-purple-300 transition-colors">About</a>
            </div>
            <div className="hidden md:block">
            <button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-5 py-2 rounded-full font-medium flex items-center">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
            </button>
            </div>
            <div className="md:hidden">
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-white focus:outline-none"
            >
                {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                )}
            </button>
            </div>
        </div>
        {/* Mobile menu */}
        {isMenuOpen && (
            <div className="md:hidden mt-4 bg-purple-800 rounded-lg p-4">
            <div className="flex flex-col space-y-4">
                <a href="#features" className="hover:text-purple-300 transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-purple-300 transition-colors">How It Works</a>
                <a href="#about" className="hover:text-purple-300 transition-colors">About</a>
                <button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-5 py-2 rounded-full font-medium flex items-center justify-center">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
                </button>
            </div>
            </div>
        )}
        </nav>

        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-32 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-300">
                NextWeeb
                </span>
            </h1>
            <p className="text-xl md:text-2xl mt-2 text-purple-200 font-medium">
                Your Anime Journey, Supercharged.
            </p>
            <p className="mt-6 text-lg text-purple-100 max-w-lg">
                Discover anime that actually fits your taste. Powered by MyAnimeList + smart-ass AI.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-6 py-3 rounded-full font-medium flex items-center justify-center">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
                </button>
            </div>
            </div>
            <div className="md:w-1/2 relative">
            <div className="bg-purple-700 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6 relative z-10">
                <img src="/api/placeholder/500/300" alt="NextWeeb App Preview" className="rounded-lg shadow-lg" />
                <div className="absolute -bottom-4 -right-4 bg-purple-600 px-4 py-2 rounded-lg shadow-lg">
                <span className="font-medium">Your next favorite anime awaits</span>
                </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-full h-full bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl -z-10 opacity-30 blur-md"></div>
            </div>
        </div>
        </section>

        {/* Problem & Solution */}
        {/* Problem & Solution */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 bg-purple-900 bg-opacity-50">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">The Problem with Anime Recommendations</h2>
            <div className="mt-4 max-w-3xl mx-auto">
                <p className="text-lg text-purple-200">
                    Tired of basic anime recs that don't get your vibe? Want to explore your anime taste more deeply?
                </p>
            </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-purple-800 bg-opacity-30 backdrop-blur-sm border border-purple-500 border-opacity-30 p-8 rounded-xl">
                <h3 className="text-2xl font-bold mb-4">The Problem</h3>
                <ul className="space-y-4">
                <li className="flex items-start">
                    <ChevronRight className="text-pink-400 mt-1 mr-2 flex-shrink-0" />
                    <p>Tired of cookie-cutter recs that act like everyone’s got <span className="font-bold text-pink-300">the same taste</span>?</p>
                </li>
                <li className="flex items-start">
                    <ChevronRight className="text-pink-400 mt-1 mr-2 flex-shrink-0" />
                    <p>Sick of scrolling through <span className="font-bold text-pink-300">anime hell</span> just to find one show that doesn’t suck?</p>
                </li>
                <li className="flex items-start">
                    <ChevronRight className="text-pink-400 mt-1 mr-2 flex-shrink-0" />
                    <p>Wasting hours watching <span className="font-bold text-pink-300">mid</span>? Nah, that ain’t it.</p>
                </li>
                </ul>
            </div>
            
            <div className="bg-purple-800 bg-opacity-30 backdrop-blur-sm border border-purple-500 border-opacity-30 p-8 rounded-xl">
                <h3 className="text-2xl font-bold mb-4">Our Solution</h3>
                <ul className="space-y-4">
                <li className="flex items-start">
                    <ChevronRight className="text-pink-400 mt-1 mr-2 flex-shrink-0" />
                    <p>NextWeeb uses your MAL history to recommend shows you'll <span className="font-bold text-pink-300">actually</span> want to watch.</p>
                </li>
                <li className="flex items-start">
                    <ChevronRight className="text-pink-400 mt-1 mr-2 flex-shrink-0" />
                    <p>Explore genres, studios, and themes tailored to <span className="font-bold text-pink-300">you</span>.</p>
                </li>
                <li className="flex items-start">
                    <ChevronRight className="text-pink-400 mt-1 mr-2 flex-shrink-0" />
                    <p>Be an <span className="font-bold text-pink-300">anime stat god</span> — sort, filter, dominate.</p>
                </li>
                </ul>
            </div>
            </div>
        </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Core Features</h2>
            <p className="mt-4 text-lg text-purple-200 max-w-3xl mx-auto">
                Everything you need to supercharge your anime discovery experience.
            </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6 hover:bg-opacity-30 transition-all">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Zap className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Smart Recommendations</h3>
                <p className="text-purple-200">
                Get personalized anime recommendations based on your watching history, favorite genres, and studio preferences.
                </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6 hover:bg-opacity-30 transition-all">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <BarChart2 className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Taste Analyzer</h3>
                <p className="text-purple-200">
                Breaks down your MAL profile: genres, themes, studios, moods, and viewing patterns to understand your preferences.
                </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6 hover:bg-opacity-30 transition-all">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <List className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Custom Lists & Sorting</h3>
                <p className="text-purple-200">
                Build your own anime lists. Filter by score, studio, year, genre, and more to organize your collection.
                </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6 hover:bg-opacity-30 transition-all">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Award className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Studio & Genre Explorers</h3>
                <p className="text-purple-200">
                See top shows by your favorite studios. Discover niche genres you never knew you'd love.
                </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6 hover:bg-opacity-30 transition-all">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Filter className="text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">Watchlist Boosting</h3>
                <p className="text-purple-200">
                Adds better suggestions to your Plan to Watch that fit your taste profile and viewing patterns.
                </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6 hover:bg-opacity-30 transition-all">
                <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Clean UI, No Ads</h3>
                <p className="text-purple-200">
                No bullshit. Just you, your weeb data, and the shows you love. A clean interface focused on anime.
                </p>
            </div>
            </div>
        </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 py-20 bg-purple-900 bg-opacity-50">
        <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">How It Works</h2>
            <p className="mt-4 text-lg text-purple-200 max-w-3xl mx-auto">
                Get started in minutes, not hours.
            </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
            <div className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6 relative">
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-pink-500 to-purple-500 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                1
                </div>
                <h3 className="text-xl font-bold mb-3 mt-2">Connect MAL</h3>
                <p className="text-purple-200">
                Connect your MyAnimeList account with a simple auth.
                </p>
            </div>

            <div className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6 relative">
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-pink-500 to-purple-500 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                2
                </div>
                <h3 className="text-xl font-bold mb-3 mt-2">Data Analysis</h3>
                <p className="text-purple-200">
                We fetch your watched list & analyze your taste profile.
                </p>
            </div>

            <div className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6 relative">
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-pink-500 to-purple-500 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                3
                </div>
                <h3 className="text-xl font-bold mb-3 mt-2">Get Insights</h3>
                <p className="text-purple-200">
                Get personalized suggestions, insights, and statistics.
                </p>
            </div>

            <div className="bg-purple-800 bg-opacity-20 backdrop-blur-sm border border-purple-500 border-opacity-30 rounded-xl p-6 relative">
                <div className="absolute -top-4 -left-4 bg-gradient-to-r from-pink-500 to-purple-500 w-8 h-8 rounded-full flex items-center justify-center font-bold">
                4
                </div>
                <h3 className="text-xl font-bold mb-3 mt-2">Discover More</h3>
                <p className="text-purple-200">
                No data selling. No spam. Just better anime suggestions.
                </p>
            </div>
            </div>
        </div>
        </section>

        {/* About */}
        <section id="about" className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-7xl mx-auto">
            <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold">About the Creator</h2>
            <p className="mt-8 text-lg text-purple-200 max-w-3xl mx-auto">
                Built by a weeb, for weebs. I'm a developer who loves anime and tech, and I created NextWeeb to solve the problem of finding anime that truly matches your unique taste.
            </p>
            <div className="mt-8">
                <button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-6 py-3 rounded-full font-medium flex items-center mx-auto">
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5" />
                </button>
            </div>
            </div>
        </div>
        </section>

        {/* Footer */}
        <footer className="px-4 sm:px-6 lg:px-8 py-12 bg-purple-900 bg-opacity-70">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-400">
                NextWeeb
                </span>
                <p className="mt-2 text-purple-300">Your Anime Journey, Supercharged.</p>
            </div>
            <div className="flex space-x-6">
                <a href="#" className="text-purple-300 hover:text-white transition-colors">
                GitHub
                </a>
                <a href="#" className="text-purple-300 hover:text-white transition-colors">
                Privacy Policy
                </a>
                <a href="#" className="text-purple-300 hover:text-white transition-colors">
                Contact
                </a>
            </div>
            </div>
        </div>
        </footer>
    </div>
    );
};

export default Landing;