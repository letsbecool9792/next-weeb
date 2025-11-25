import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, TrendingUp, BarChart2, Clock, Film, Star, ArrowRight, Play, Search } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import { API_URL } from '../config';

type Profile = {
    name: string;
    picture: string;
};

type AnimeEntry = {
    mal_id: number;
    title: string;
    image_url: string;
    status: string;
    score: number;
    episodes_watched: number;
    last_updated: string;
};

type StatsData = {
    title: string;
    score: number;
    genres: string[];
    num_episodes: number;
    average_episode_duration: number;
};

const Dashboard = ({ setIsLoggedIn }: { setIsLoggedIn: any }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [animeList, setAnimeList] = useState<AnimeEntry[]>([]);
    const [statsData, setStatsData] = useState<StatsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    const loadData = async () => {
        setLoading(true);
        
        // Fetch profile
        const profileRes = await fetch(`${API_URL}/api/cached-profile/`, {
            method: 'GET',
            credentials: 'include',
        });
        if (profileRes.ok) {
            setProfile(await profileRes.json());
        }

        // Fetch anime list
        const animeRes = await fetch(`${API_URL}/api/cached-animelist/`, {
            method: 'GET',
            credentials: 'include',
        });
        if (animeRes.ok) {
            setAnimeList(await animeRes.json());
        }

        // Fetch stats data
        const statsRes = await fetch(`${API_URL}/api/stats-data/`, {
            method: 'GET',
            credentials: 'include',
        });
        if (statsRes.ok) {
            setStatsData(await statsRes.json());
        }

        setLoading(false);
    };

    const handleSync = async () => {
        setSyncing(true);
        
        // Sync profile
        await fetch(`${API_URL}/api/sync-profile/`, {
            method: 'GET',
            credentials: 'include',
        });

        // Sync anime list
        await fetch(`${API_URL}/api/sync-animelist/`, {
            method: 'GET',
            credentials: 'include',
        });

        // Reload all data
        await loadData();
        setSyncing(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="bg-gradient-to-b from-gray-900 to-fuchsia-950">
                <LoadingScreen message="Loading your dashboard..." />
            </div>
        );
    }

    // Get currently watching anime
    const watchingAnime = animeList
        .filter(anime => anime.status === 'watching')
        .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
        .slice(0, 6);

    // Calculate quick stats
    const totalCompleted = statsData.length;
    const totalTimeMinutes = statsData.reduce((total, anime) => {
        const eps = anime.num_episodes || 0;
        const dur = anime.average_episode_duration || 0;
        return total + (eps * dur) / 60;
    }, 0);
    const totalDays = Math.floor(totalTimeMinutes / 60 / 24);

    const avgScore = statsData.length > 0 
        ? (statsData.reduce((sum, a) => sum + (a.score || 0), 0) / statsData.filter(a => a.score > 0).length).toFixed(1)
        : 0;

    // Top genres
    const genreMap = new Map<string, number>();
    statsData.forEach(anime => {
        anime.genres?.forEach(genre => {
            genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
        });
    });
    const topGenres = Array.from(genreMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name]) => name);

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-fuchsia-950 text-white">
            <Header setIsLoggedIn={setIsLoggedIn} />

            <div className="container mx-auto px-4 py-8">
                {/* Welcome Section */}
                <div className="card mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            {profile?.picture && (
                                <img
                                    src={profile.picture}
                                    alt={profile.name}
                                    className="w-20 h-20 rounded-full border-2 border-purple-500"
                                />
                            )}
                            <div>
                                <h1 className="text-3xl font-bold">
                                    Welcome back, <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                                        {profile?.name || 'User'}
                                    </span>!
                                </h1>
                                <p className="text-purple-300 mt-1">Ready to continue your anime journey?</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="btn-primary gap-2"
                        >
                            <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                    </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80 mb-1">Completed</p>
                                <p className="text-3xl font-bold">{totalCompleted}</p>
                            </div>
                            <div className="icon">
                                <Film size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80 mb-1">Time Watched</p>
                                <p className="text-3xl font-bold">{totalDays}d</p>
                            </div>
                            <div className="icon">
                                <Clock size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80 mb-1">Avg Score</p>
                                <p className="text-3xl font-bold">{avgScore}</p>
                            </div>
                            <div className="icon">
                                <Star size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80 mb-1">Watching</p>
                                <p className="text-3xl font-bold">{watchingAnime.length}</p>
                            </div>
                            <div className="icon">
                                <Play size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Continue Watching Section */}
                {watchingAnime.length > 0 && (
                    <div className="card mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold flex items-center gap-2">
                                <Play className="text-pink-400" size={28} />
                                Continue Watching
                            </h2>
                            <Link to="/animelist" className="text-purple-400 hover:text-purple-300 flex items-center gap-1">
                                View All
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                        
                        <div className="overflow-x-auto pb-4">
                            <div className="flex gap-4" style={{ width: 'max-content' }}>
                                {watchingAnime.map((anime) => (
                                    <Link
                                        key={anime.mal_id}
                                        to={`/anime/${anime.mal_id}`}
                                        className="flex-shrink-0 w-40 group"
                                    >
                                        <div className="relative overflow-hidden rounded-lg border-2 border-purple-500/30 group-hover:border-purple-500 transition-all">
                                            <img
                                                src={anime.image_url}
                                                alt={anime.title}
                                                className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="absolute bottom-2 left-2 right-2">
                                                    <p className="text-xs text-purple-300">
                                                        Ep {anime.episodes_watched}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                                            {anime.title}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Preview & Quick Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Top Genres */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="text-purple-400" size={24} />
                            <h2 className="text-xl font-semibold">Your Top Genres</h2>
                        </div>
                        <div className="space-y-3">
                            {topGenres.map((genre, idx) => (
                                <div key={genre} className="flex items-center gap-3">
                                    <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                        {idx + 1}
                                    </div>
                                    <span className="text-lg">{genre}</span>
                                </div>
                            ))}
                        </div>
                        <Link
                            to="/stats"
                            className="btn-primary gap-2 mt-6 w-full"
                        >
                            <BarChart2 size={20} />
                            View Full Stats
                        </Link>
                    </div>

                    {/* Quick Links */}
                    <div className="card">
                        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <Link
                                to="/recommendations"
                                className="btn-secondary w-full justify-start gap-3 text-left"
                            >
                                <TrendingUp size={20} />
                                <div>
                                    <p className="font-semibold">Get Recommendations</p>
                                    <p className="text-sm opacity-70">AI-powered picks just for you</p>
                                </div>
                            </Link>

                            <Link
                                to="/animelist"
                                className="btn-secondary w-full justify-start gap-3 text-left"
                            >
                                <Film size={20} />
                                <div>
                                    <p className="font-semibold">My Anime List</p>
                                    <p className="text-sm opacity-70">View and manage your collection</p>
                                </div>
                            </Link>
                            
                            <Link
                                to="/search"
                                className="btn-secondary w-full justify-start gap-3 text-left"
                            >
                                <Search size={20} />
                                <div>
                                    <p className="font-semibold">Search Anime</p>
                                    <p className="text-sm opacity-70">Discover new shows to watch</p>
                                </div>
                            </Link>

                            <Link
                                to="/profile"
                                className="btn-secondary w-full justify-start gap-3 text-left"
                            >
                                <Star size={20} />
                                <div>
                                    <p className="font-semibold">My Profile</p>
                                    <p className="text-sm opacity-70">View your MAL profile info</p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Recently Updated */}
                {animeList.length > 0 && (
                    <div className="card">
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Clock className="text-blue-400" size={28} />
                            Recently Updated
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                            {animeList
                                .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
                                .slice(0, 6)
                                .map((anime) => (
                                    <Link
                                        key={anime.mal_id}
                                        to={`/anime/${anime.mal_id}`}
                                        className="group"
                                    >
                                        <div className="relative overflow-hidden rounded-lg border-2 border-purple-500/30 group-hover:border-purple-500 transition-all">
                                            <img
                                                src={anime.image_url}
                                                alt={anime.title}
                                                className="w-full h-44 object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            {anime.score > 0 && (
                                                <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                                    <Star size={12} />
                                                    {anime.score}
                                                </div>
                                            )}
                                        </div>
                                        <p className="mt-2 text-sm font-medium line-clamp-2 group-hover:text-purple-400 transition-colors">
                                            {anime.title}
                                        </p>
                                    </Link>
                                ))}
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Dashboard;
