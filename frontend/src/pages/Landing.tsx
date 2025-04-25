import { useState } from 'react';
import { ArrowRight, ChevronRight, BarChart2, Filter, List, Zap, Award } from 'lucide-react';

import Card from '../components/Card';
import Footer from '../components/Footer';
import HowItWorksCard from '../components/HowItWorksCard';

const Landing = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const features = [
        {
            icon: <Zap className="text-white" />,
            title: "Smart Recommendations",
            description:
            "Get personalized anime recommendations based on your watching history, favorite genres, and studio preferences.",
        },
        {
            icon: <BarChart2 className="text-white" />,
            title: "Taste Analyzer",
            description: "Breaks down your MAL profile: genres, themes, studios, moods, and viewing patterns to understand your preferences."
        },
        {
            icon: <List className="text-white" />,
            title: "Custom Lists & Sorting",
            description: "Build your own anime lists. Filter by score, studio, year, genre, and more to organize your collection."
        },
        {
            icon: <Award className="text-white" />,
            title: "Studio & Genre Explorers",
            description: "See top shows by your favorite studios. Discover niche genres you never knew you'd love."
        },
        {
            icon: <Filter className="text-white" />,
            title: "Watchlist Boosting",
            description: "Adds better suggestions to your Plan to Watch that fit your taste profile and viewing patterns."
        },
        {
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>,
            title: "Clean UI, No Ads",
            description: "No bullshit. Just you, your weeb data, and the shows you love. A clean interface focused on anime."
        }
    ];

    const steps = [
        {
          number: 1,
          title: "Sign In",
          description: "Log in with your MyAnimeList account to sync your anime list.",
        },
        {
          number: 2,
          title: "Analyze",
          description: "We scan your list, genres, and studios to understand your taste.",
        },
        {
          number: 3,
          title: "Recommend",
          description: "Boom. You get bangers tailored just for your style.",
        },
        {
          number: 4,
          title: "Discover More",
          description: "No data selling. No spam. Just better anime suggestions.",
        },
    ];

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
            <a href = '/get-started' className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-5 py-2 rounded-full font-medium flex items-center">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
            </a>
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
                <a href = '/get-started' className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-5 py-2 rounded-full font-medium flex items-center justify-center">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
                </a>
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
                <a href='/get-started' className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-6 py-3 rounded-full font-medium flex items-center justify-center">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
                </a>
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
                    <ChevronRight className="text-pink-400 mr-2 flex-shrink-0" />
                    <p>Tired of cookie-cutter recs that act like everyone’s got <span className="font-bold text-pink-300">the same taste</span>?</p>
                </li>
                <li className="flex items-start">
                    <ChevronRight className="text-pink-400 mr-2 flex-shrink-0" />
                    <p>Sick of scrolling through <span className="font-bold text-pink-300">anime hell</span> just to find one show that doesn’t suck?</p>
                </li>
                <li className="flex items-start">
                    <ChevronRight className="text-pink-400 mr-2 flex-shrink-0" />
                    <p>Wasting hours watching <span className="font-bold text-pink-300">mid</span>? Nah, that ain’t it.</p>
                </li>
                </ul>
            </div>
            
            <div className="bg-purple-800 bg-opacity-30 backdrop-blur-sm border border-purple-500 border-opacity-30 p-8 rounded-xl">
                <h3 className="text-2xl font-bold mb-4">Our Solution</h3>
                <ul className="space-y-4">
                <li className="flex items-start">
                    <ChevronRight className="text-pink-400 mr-2 flex-shrink-0" />
                    <p>NextWeeb uses your MAL history to recommend shows you'll <span className="font-bold text-pink-300">actually</span> want to watch.</p>
                </li>
                <li className="flex items-start">
                    <ChevronRight className="text-pink-400 mr-2 flex-shrink-0" />
                    <p>Explore genres, studios, and themes tailored to <span className="font-bold text-pink-300">you</span>.</p>
                </li>
                <li className="flex items-start">
                    <ChevronRight className="text-pink-400 mr-2 flex-shrink-0" />
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
                    {features.map((card, index) => (
                        <Card
                            key={index}
                            icon={card.icon}
                            title={card.title}
                            description={card.description}
                        />
                    ))}
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
                {steps.map((step) => (
                    <HowItWorksCard
                        key={step.number}
                        number={step.number}
                        title={step.title}
                        description={step.description}
                    />
                ))}
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
        <Footer />
    </div>
    );
};

export default Landing;