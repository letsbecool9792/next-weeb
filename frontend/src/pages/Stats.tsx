import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, Award, Clock, Film, Star, BarChart2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';

type AnimeEntry = {
    title: string;
    score: number;
    genres: string[];
    studios: string[];
    num_episodes: number;
    average_episode_duration: number; // in seconds
    media_type: string;
};

const Stats = ({ setIsLoggedIn }: { setIsLoggedIn: any }) => {
    const [animeList, setAnimeList] = useState<AnimeEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            const res = await fetch('http://localhost:8000/api/stats-data/', {
                method: 'GET',
                credentials: 'include',
            });
            if (res.ok) {
                const data = await res.json();
                setAnimeList(data);
            }
            setLoading(false);
        })();
    }, []);

    if (loading) return (
        <div className="bg-gradient-to-b from-gray-900 to-fuchsia-950">
            <LoadingScreen message="Crunching your stats..." />
        </div>
    );

    // ---------- Breakdown Functions ----------
    const countBy = (key: keyof AnimeEntry, flatten = false) => {
        const map = new Map<string, number>();
        animeList.forEach((anime) => {
            const values = flatten ? (anime[key] as string[]) : [anime[key] as string];
            values.forEach((v) => {
                if (!v) return;
                map.set(v, (map.get(v) || 0) + 1);
            });
        });
        return Array.from(map.entries())
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    };

    const genreData = countBy('genres', true).slice(0, 10);
    const studioData = countBy('studios', true).slice(0, 10);
    
    // Score distribution
    const scoreMap = new Map<number, number>();
    animeList.forEach(anime => {
        if (anime.score > 0) {
            scoreMap.set(anime.score, (scoreMap.get(anime.score) || 0) + 1);
        }
    });
    const scoreData = Array.from(scoreMap.entries())
        .map(([score, count]) => ({ name: score.toString(), count }))
        .sort((a, b) => parseInt(a.name) - parseInt(b.name));

    // Total time calculation
    const totalTimeMinutes = animeList.reduce((total, anime) => {
        const eps = anime.num_episodes || 0;
        const dur = anime.average_episode_duration || 0;
        return total + (eps * dur) / 60;
    }, 0);
    const totalHours = Math.round(totalTimeMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    // Top rated anime (10s)
    const topRated = animeList
        .filter(a => a.score === 10)
        .slice(0, 5);

    // Media type breakdown
    const mediaTypeMap = new Map<string, number>();
    animeList.forEach(anime => {
        const type = anime.media_type || 'unknown';
        mediaTypeMap.set(type, (mediaTypeMap.get(type) || 0) + 1);
    });
    const mediaTypeData = Array.from(mediaTypeMap.entries())
        .map(([name, value]) => ({ name: name.toUpperCase(), value }));

    // Color palettes
    const GENRE_COLORS = ['#c084fc', '#a855f7', '#9333ea', '#7e22ce', '#6b21a8'];
    const STUDIO_COLORS = ['#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'];
    const SCORE_COLORS = ['#f472b6', '#ec4899', '#db2777', '#be185d', '#9f1239'];
    const PIE_COLORS = ['#c084fc', '#f472b6', '#7dd3fc', '#fbbf24', '#34d399'];

    // Calculate average score
    const avgScore = animeList.length > 0 
        ? (animeList.reduce((sum, a) => sum + (a.score || 0), 0) / animeList.filter(a => a.score > 0).length).toFixed(2)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-fuchsia-950 text-white">
            <Header setIsLoggedIn={setIsLoggedIn} />

            <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                    Your Anime Stats
                </h1>

                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80 mb-1">Total Completed</p>
                                <p className="text-3xl font-bold">{animeList.length}</p>
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
                                <p className="text-xs opacity-60">{totalHours} hours</p>
                            </div>
                            <div className="icon">
                                <Clock size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm opacity-80 mb-1">Average Score</p>
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
                                <p className="text-sm opacity-80 mb-1">Perfect 10s</p>
                                <p className="text-3xl font-bold">{topRated.length}</p>
                            </div>
                            <div className="icon">
                                <Award size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Favorite Genres */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="text-purple-400" size={24} />
                            <h2 className="text-2xl font-semibold">Top Genres</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={genreData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#ccc" 
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis stroke="#ccc" />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1f2937', 
                                        border: '1px solid #a855f7',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {genreData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={GENRE_COLORS[index % GENRE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Top Studios */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart2 className="text-blue-400" size={24} />
                            <h2 className="text-2xl font-semibold">Top Studios</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={studioData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis 
                                    dataKey="name" 
                                    stroke="#ccc" 
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                />
                                <YAxis stroke="#ccc" />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1f2937', 
                                        border: '1px solid #0ea5e9',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {studioData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={STUDIO_COLORS[index % STUDIO_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Rating Distribution */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <Star className="text-pink-400" size={24} />
                            <h2 className="text-2xl font-semibold">Rating Distribution</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={scoreData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                                <XAxis dataKey="name" stroke="#ccc" label={{ value: 'Score', position: 'insideBottom', offset: -5 }} />
                                <YAxis stroke="#ccc" />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1f2937', 
                                        border: '1px solid #ec4899',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                                    {scoreData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={SCORE_COLORS[index % SCORE_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Media Type Distribution */}
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <Film className="text-yellow-400" size={24} />
                            <h2 className="text-2xl font-semibold">Media Types</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={mediaTypeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {mediaTypeData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: '#1f2937', 
                                        border: '1px solid #a855f7',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Rated Anime Section */}
                {topRated.length > 0 && (
                    <div className="card">
                        <div className="flex items-center gap-2 mb-4">
                            <Award className="text-yellow-400" size={24} />
                            <h2 className="text-2xl font-semibold">Your Perfect 10s</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {topRated.map((anime, idx) => (
                                <div key={idx} className="bg-purple-900/50 border border-purple-500/30 rounded-lg p-4 hover:border-purple-500/60 transition-all">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                            10
                                        </div>
                                        <p className="font-medium flex-1">{anime.title}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Stats;