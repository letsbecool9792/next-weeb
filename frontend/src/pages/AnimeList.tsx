import { useEffect, useState } from 'react';
import { Funnel, ChevronsUp, ChevronDown, LayoutGrid, AlignJustify, Eye, Calendar, Star, Clock, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import { API_URL } from '../config';

type AnimeEntry = {
    mal_id: number;
    title: string;
    image_url: string;
    status: string;
    score: number;
    episodes_watched: number;
    is_rewatching: boolean;
    start_date: string;
    finish_date: string;
    last_updated: string;
};

const AnimeList = ({isLoggedIn, setIsLoggedIn} : {isLoggedIn: boolean, setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>}) => {
    const [animeList, setAnimeList] = useState<AnimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('title');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Session check
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API_URL}/api/session-status/`, {
                method: 'GET',
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.is_authenticated) {
                    setIsLoggedIn(true);
                }
            }
            } catch {
                // silent fail
            } finally {
                setAuthChecked(true);
            }
        })();
    }, []);
      
    // Anime list loader
    const loadAnime = async () => {
        const res = await fetch(`${API_URL}/api/cached-animelist/`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.ok) {
            const data: AnimeEntry[] = await res.json();
            setAnimeList(data);
        }
        setLoading(false);
    };

    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleSync = async () => {
        const minDuration = 500;     // ← tweak to taste
        setSyncing(true);
        const start = Date.now();
      
        const res = await fetch(`${API_URL}/api/sync-animelist/`, {
            method: 'GET',
            credentials: 'include',
        });
        if (res.ok) {
          await loadAnime();
        }
      
        const elapsed = Date.now() - start;
        if (elapsed < minDuration) {
            await delay(minDuration - elapsed);
        }
        setSyncing(false);
    };
    
    // Load list after confirming session
    // Auto-sync then load cache once we know we're logged in
    useEffect(() => {
        if (authChecked && isLoggedIn) {
            (async () => {
            setSyncing(true);
        
            // 1) Fetch cached data directly:
            const cacheRes = await fetch(`${API_URL}/api/cached-animelist/`, {
                method: 'GET',
                credentials: 'include',
            });
            const cacheData: AnimeEntry[] = cacheRes.ok ? await cacheRes.json() : [];
        
            // 2) If cache was empty, sync from MAL:
            if (cacheData.length === 0) {
                await fetch(`${API_URL}/api/sync-animelist/`, {
                method: 'GET',
                credentials: 'include',
                });
                // 3) Re-fetch cache after sync:
                const updatedRes = await fetch(`${API_URL}/api/cached-animelist/`, {
                method: 'GET',
                credentials: 'include',
                });
                const updatedData: AnimeEntry[] = updatedRes.ok ? await updatedRes.json() : [];
                setAnimeList(updatedData);
            } else {
                // If cache wasn’t empty, just use it
                setAnimeList(cacheData);
            }
        
            setLoading(false);
            setSyncing(false);
            })();
        }
    }, [authChecked, isLoggedIn]);
      
  
    // If not logged in and auth checked, bounce to /
    useEffect(() => {
        if (authChecked && !isLoggedIn) {
            window.location.href = '/';
        }
    }, [authChecked, isLoggedIn]);

    // Get filtered and sorted anime list
    const getFilteredAndSortedList = () => {
        let filtered = [...animeList];
        
        // Apply status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(anime => anime.status.toLowerCase() === filterStatus);
        }

        // Apply sorting
        return filtered.sort((a, b) => {
            if (sortBy === 'score') return b.score - a.score;
            if (sortBy === 'recently_updated') return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
            if (sortBy === 'episodes') return b.episodes_watched - a.episodes_watched;
            return a.title.localeCompare(b.title); // Default: sort by title
        });
    };

    // Status badge color
    const getStatusColor = (status: string): string => {
        switch(status.toLowerCase()) {
            case 'watching': return 'bg-green-500';
            case 'completed': return 'bg-blue-500';
            case 'on_hold': return 'bg-yellow-500';
            case 'dropped': return 'bg-red-500';
            case 'plan_to_watch': return 'bg-purple-500';
            default: return 'bg-gray-500';
        }
    };

    // Loading and error states
    if (!authChecked) {
        return (
            <div className="bg-gray-900">
                <LoadingScreen message="Checking authentication..." />
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-gray-900">
                <LoadingScreen message="Loading your anime collection…" 
                                subMessage="Hold tight while we prepare your otaku journey!" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900  bg-opacity-10 text-white">
            <Header setIsLoggedIn={setIsLoggedIn}/>
            
            <div className="container mx-auto px-4 py-8">
                {/* Hero Section */}
                <div className="relative overflow-hidden bg-purple-800/40 backdrop-blur-md border border-purple-500/50 rounded-2xl p-6 mb-8">
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute left-10 top-10 w-32 h-32 bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-full blur-2xl"></div>
                    
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center z-10">
                        <div>
                            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-400 mb-2">
                                Your Anime Collection
                            </h1>
                            <p className="text-purple-200 mb-4">
                                {animeList.length} titles in your collection
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 mt-4 md:mt-0">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className="btn-secondary">
                                <Funnel className="h-4.5 w-4.5 mr-1" />
                                Filters
                            </button>
                            
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="btn-primary">
                                {syncing ? (
                                    <>
                                        <RefreshCw className="h-4.5 w-4.5 mr-1 animate-spin" />
                                        Syncing...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="h-4.5 w-4.5 mr-1" />
                                        Sync Library
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Filters Panel */}
                {isFilterOpen && (
                    <div className="bg-purple-800/60 backdrop-blur-md border border-purple-500/50 rounded-xl p-4 mb-6 animate-fadeIn">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative">
                                    <label htmlFor="filter" className="block text-sm font-medium text-purple-300 mb-1">Filter by status</label>
                                    <div className="relative">
                                        <select 
                                            id="filter"
                                            value={filterStatus}
                                            onChange={(e) => setFilterStatus(e.target.value)}
                                            className="bg-purple-900/80 border border-purple-500/50 text-white rounded-lg py-2 pl-3 pr-10 w-full appearance-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                        >
                                            <option value="all">All Anime</option>
                                            <option value="watching">Watching</option>
                                            <option value="completed">Completed</option>
                                            <option value="on_hold">On Hold</option>
                                            <option value="dropped">Dropped</option>
                                            <option value="plan_to_watch">Plan to Watch</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                            <ChevronDown className ={"w-5.5 h-5.5 text-purple-300"}/>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <label htmlFor="sort" className="block text-sm font-medium text-purple-300 mb-1">Sort by</label>
                                    <div className="relative">
                                        <select 
                                            id="sort"
                                            value={sortBy}
                                            onChange={(e) => setSortBy(e.target.value)}
                                            className="bg-purple-900/80 border border-purple-500/50 text-white rounded-lg py-2 pl-3 pr-10 w-full appearance-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                        >
                                            <option value="title">Title</option>
                                            <option value="score">Score</option>
                                            <option value="episodes">Episodes Watched</option>
                                            <option value="recently_updated">Recently Updated</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                            <ChevronDown className ={"w-5.5 h-5.5 text-purple-300"}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-end space-x-2">
                                <button 
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-pink-500 text-white' : 'bg-purple-900/80 text-purple-300'}`}
                                >
                                    <LayoutGrid strokeWidth = {2.3}className="h-4.5 w-4.5" />
                                </button>
                                <button 
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-pink-500 text-white' : 'bg-purple-900/80 text-purple-300'}`}
                                >
                                    <AlignJustify strokeWidth = {3} className="h-4.5 w-4.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!animeList.length ? (
                    <div className="text-center py-16 bg-purple-800/40 backdrop-blur-sm border border-purple-500/50 rounded-xl">
                        <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                            🔍
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Your collection is empty</h2>
                        <p className="text-purple-300 mb-6">Sync your library or add some anime to get started</p>
                        <button
                            onClick={handleSync}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-3 rounded-full shadow-lg shadow-purple-500/30"
                        >
                            Sync Now
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {getFilteredAndSortedList().map((anime) => (
                            <Link
                                key={anime.mal_id}
                                to={`/anime/${anime.mal_id}`} 
                                className="block"
                            >
                                <div key={anime.title} className="relative bg-purple-800/80 hover:bg-purple-800/30 backdrop-blur-sm border border-purple-500/80 rounded-xl overflow-hidden group transition-all hover:scale-105 duration-200">
                                    <div className="relative">
                                        <div className="aspect-w-3 aspect-h-4">
                                            <img 
                                                src={anime.image_url} 
                                                alt={anime.title} 
                                                className="w-full h-64 object-cover"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-purple-900 via-transparent to-transparent"></div>
                                        
                                        <div className={`absolute top-3 right-3 ${getStatusColor(anime.status)} text-white rounded-full px-3 py-1 text-xs font-medium`}>
                                            {anime.status.replace(/_/g, ' ')}
                                        </div>
                                        
                                        {anime.is_rewatching && (
                                            <div className="absolute top-3 left-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full px-3 py-1 text-xs font-medium">
                                                Rewatching
                                            </div>
                                        )}
                                        
                                        <div className="absolute bottom-3 right-3 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                            {anime.score}
                                        </div>
                                    </div>
                                    
                                    <div className="p-4">
                                        <h3 className="text-lg font-bold line-clamp-2 mb-2 text-white h-14">{anime.title}</h3>
                                        
                                        <div className="grid grid-cols-2 gap-2 text-sm text-purple-200">
                                            <div className="flex items-center">
                                                <Eye className="h-4 w-4 mr-1 text-pink-400" />
                                                {anime.episodes_watched} episodes
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1 text-pink-400" />
                                                {anime.start_date || 'N/A'}
                                            </div>
                                        </div>
                                        
                                        <div className="mt-3 pt-3 border-t border-purple-700/50 text-xs text-purple-300 flex justify-between items-center">
                                            <span>Updated: {new Date(anime.last_updated).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {getFilteredAndSortedList().map((anime) => (
                            <div key={anime.title} className="relative bg-purple-800/80 hover:bg-purple-800/30 backdrop-blur-sm border border-purple-500/80 rounded-xl overflow-hidden group transition-all hover:translate-x-1 duration-200">
                                <div className="flex">
                                    <div className="w-32 sm:w-48">
                                        <img 
                                            src={anime.image_url} 
                                            alt={anime.title} 
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 p-4">
                                        <div className="flex justify-between">
                                            <h3 className="text-lg sm:text-xl font-bold mb-2 text-white">{anime.title}</h3>
                                            <div className="flex space-x-2">
                                                <div className={`${getStatusColor(anime.status)} text-white rounded-full px-3 py-1 text-xs font-medium h-fit`}>
                                                    {anime.status.replace(/_/g, ' ')}
                                                </div>
                                                {anime.is_rewatching && (
                                                    <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-full px-3 py-1 text-xs font-medium h-fit">
                                                        Rewatching
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 text-sm text-purple-200">
                                            <div className="flex items-center">
                                                <Star className="h-4 w-4 mr-1 text-pink-400" />
                                                Score: {anime.score}
                                            </div>
                                            <div className="flex items-center">
                                                <Eye className="h-4 w-4 mr-1 text-pink-400" />
                                                {anime.episodes_watched} episodes
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1 text-pink-400" />
                                                Started: {anime.start_date || 'N/A'}
                                            </div>
                                            <div className="flex items-center">
                                                <Clock className="h-4 w-4 mr-1 text-pink-400" />
                                                Updated: {new Date(anime.last_updated).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
            </div>
            
            {/* Empty State */}
            {animeList.length === 0 && !loading && (
                <div className="container mx-auto px-4 pb-12">
                    <div className="text-center py-16 bg-purple-800/40 backdrop-blur-sm border border-purple-500/50 rounded-xl">
                        <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                            🎬
                        </div>
                        <h2 className="text-2xl font-bold mb-2">No anime in your collection</h2>
                        <p className="text-purple-300 mb-6">Let's start building your anime journey</p>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-3 rounded-full shadow-lg shadow-purple-500/30 disabled:opacity-50"
                        >
                            {syncing ? 'Syncing...' : 'Sync with MyAnimeList'}
                        </button>
                    </div>
                </div>
            )}
            
            {/* Back to Top Button (appears when scrolling) */}
            <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="icon bottom-6 right-8 fixed hover:from-pink-600 hover:to-purple-600"
                id="back-to-top"
            >
                <ChevronsUp strokeWidth = {2.5} className="h-6 w-6 " />
            </button>
            
            <Footer />
        </div>
    );
};

export default AnimeList;