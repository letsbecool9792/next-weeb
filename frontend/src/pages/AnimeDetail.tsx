import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Star, Clock, Calendar, BarChart2, Heart, Award, Film, Users, Check, Sun, Code, NotebookPen, CalendarPlus2, CalendarCheck } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import Poster from '../components/Poster';
import { formatDate, humanize, LOAD_ERROR } from '../utils/format';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';

// MAL leaves fields out for some shows (no picture, no statistics yet, an
// unaired show with no score...). Everything optional is marked with ?.
type Detail = {
    id: number;
    title: string;
    main_picture?: { medium: string; large?: string };
    alternative_titles?: {
        synonyms?: string[];
        en?: string;
        ja?: string;
    };
    start_date?: string;
    end_date?: string;
    synopsis?: string;
    mean?: number;
    rank?: number;
    num_list_users?: number;
    media_type?: string;
    status?: string;
    genres?: { id: number; name: string }[];
    my_list_status?: {
        status?: string;
        score?: number;
        num_episodes_watched?: number;
        start_date?: string;
        finish_date?: string;
    };
    num_episodes?: number;
    start_season?: { year: number; season: string };
    source?: string;
    average_episode_duration?: number;
    rating?: string;
    studios?: { id: number; name: string }[];
    statistics?: {
        status?: Record<string, string>;
    };
};

const AnimeDetail = () => {
    const { anime_id } = useParams<{ anime_id: string }>();
    const [detail, setDetail] = useState<Detail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<'not_found' | 'failed' | null>(null);
    const posthog = usePostHog();

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await authFetch(`${API_URL}/api/anime/${anime_id}/`);
            if (res.status === 404) {
                setError('not_found');
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: Detail = await res.json();
            setDetail(data);

            // Track anime detail view
            posthog?.capture('anime_detail_viewed', {
                anime_id: data.id,
                anime_title: data.title,
                anime_score: data.mean,
            });
        } catch {
            setError('failed');
        } finally {
            setLoading(false);
        }
    }, [anime_id, posthog]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return (
        <div className="bg-gray-900">
            <LoadingScreen message="Loading Details..." />
        </div>
    );

    if (error === 'failed') return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-fuchsia-950 text-white">
            <Header />
            <ErrorState message={LOAD_ERROR} onRetry={load} />
        </div>
    );

    if (!detail) return (
    <div className="overlay-center  bg-gray-900">
        <div className="overlay-box">
        <p className="text-xl font-semibold">Anime not found.</p>
        {/* This button used to do nothing */}
        <Link to="/animelist" className="btn-primary mt-4">Return to List</Link>
        </div>
    </div>
    );

    const minutesPerEpisode = detail.average_episode_duration ? Math.round(detail.average_episode_duration / 60) : null;

    return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-fuchsia-950 text-white">
        <Header />

        {/* Hero Section with Backdrop */}
        <div className="relative h-80 w-full overflow-hidden">
        <div 
            className="absolute inset-0 bg-cover bg-center blur-sm opacity-30" 
            style={detail.main_picture ? { backgroundImage: `url(${detail.main_picture.large ?? detail.main_picture.medium})` } : undefined}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/80 to-gray-900/90"></div>
        <div className="container mx-auto px-4 h-full flex items-end">
            <div className="relative pb-6 flex flex-col md:flex-row items-end gap-6">
            <Poster
                src={detail.main_picture?.large ?? detail.main_picture?.medium}
                title={detail.title}
                className="w-40 rounded-lg shadow-lg border-2 border-purple-500/50 relative z-10 h-56 object-cover"
            />
            <div className="relative z-10">
                <h1 className="text-4xl font-bold">{detail.title}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                {(detail.genres ?? []).map(g => (
                    <span key={g.id} className="bg-purple-800/80 px-3 py-1 rounded-full text-xs">
                    {g.name}
                    </span>
                ))}
                </div>
            </div>
            </div>
        </div>
        </div>

        <div className="container mx-auto px-4 py-8">
        {/* Quick Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="card flex items-center">
                <div className="icon">
                    <Star size={20} />
                </div>
                <div className="ml-4">
                    <p className="text-sm opacity-80">Rating</p>
                    <p className="text-xl font-bold">{detail.mean || "N/A"}</p>
                </div>
            </div>
            
            <div className="card flex items-center">
                <div className="icon">
                    <BarChart2 size={20} />
                </div>
                <div className="ml-4">
                    <p className="text-sm opacity-80">Rank</p>
                    <p className="text-xl font-bold">#{detail.rank || "N/A"}</p>
                </div>
            </div>
            
            <div className="card flex items-center">
                <div className="icon">
                    <Users size={20} />
                </div>
                <div className="ml-4">
                    <p className="text-sm opacity-80">Popularity</p>
                    <p className="text-xl font-bold">{detail.num_list_users?.toLocaleString() ?? 'N/A'}</p>
                </div>
            </div>
            
            <div className="card flex items-center">
                <div className="icon">
                    <Film size={20} />
                </div>
                <div className="ml-4">
                    <p className="text-sm opacity-80">Episodes</p>
                    <p className="text-xl font-bold">{detail.num_episodes || "?"}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
            {/* Synopsis */}
            <div className="card">
                <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Synopsis</h2>
                <p className="leading-relaxed whitespace-pre-line">{detail.synopsis || 'No synopsis yet.'}</p>
            </div>

            {/* Alternative Titles */}
            <div className="card">
                <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Alternative Titles</h2>
                <div className="space-y-2">
                <div className="flex">
                    <span className="w-24 opacity-70">English:</span>
                    <span>{detail.alternative_titles?.en || "N/A"}</span>
                </div>
                <div className="flex">
                    <span className="w-24 opacity-70">Japanese:</span>
                    <span>{detail.alternative_titles?.ja || "N/A"}</span>
                </div>
                {(detail.alternative_titles?.synonyms?.length ?? 0) > 0 && (
                    <div className="flex">
                    <span className="w-24 opacity-70">Synonyms:</span>
                    <span>{detail.alternative_titles?.synonyms?.join(', ')}</span>
                    </div>
                )}
                </div>
            </div>
            
            {/* Community Stats */}
            <div className="card">
                <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Community Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Object.entries(detail.statistics?.status ?? {}).map(([key, val]) => (
                    <div key={key} className="bg-purple-900/40 p-3 rounded-lg text-center">
                    <p className="font-medium text-sm opacity-80">{humanize(key)}</p>
                    <p className="text-xl font-bold">{parseInt(val).toLocaleString()}</p>
                    </div>
                ))}
                </div>
            </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
            {/* Information */}
            <div className="card capitalize">
                <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Information</h2>
                <div className="space-y-3">
                <div className="flex items-center">
                    <div className="w-8 opacity-70"><Calendar size={16} /></div>
                    <div>
                    <p className="text-sm opacity-70">Aired</p>
                    <p>{formatDate(detail.start_date)} to {formatDate(detail.end_date)}</p>
                    </div>
                </div>
                
                <div className="flex items-center">
                    <div className="w-8 opacity-70"><Clock size={16} /></div>
                    <div>
                    <p className="text-sm opacity-70">Duration</p>
                    <p>{minutesPerEpisode ? `${minutesPerEpisode}m per ep` : 'Unknown'}</p>
                    </div>
                </div>
                
                <div className="flex items-center">
                    <div className="w-8 opacity-70"><Award size={16} /></div>
                    <div>
                    <p className="text-sm opacity-70">Type & Status</p>
                    <p>{detail.media_type?.toUpperCase() ?? '?'} · {humanize(detail.status)}</p>
                    </div>
                </div>
                
                <div className="flex items-center">
                    <div className="w-8 opacity-70"><Film size={16} /></div>
                    <div>
                    <p className="text-sm opacity-70">Studios</p>
                    <p>{(detail.studios ?? []).map(s => s.name).join(', ') || "Unknown"}</p>
                    </div>
                </div>
                
                <div className="flex items-center">
                    <div className="w-8 opacity-70"><Sun size={16}/></div>
                    <div>
                    <p className="text-sm opacity-70">Season</p>
                    <p>{detail.start_season ? `${detail.start_season.season} ${detail.start_season.year}` : 'Unknown'}</p>
                    </div>
                </div>
                
                <div className="flex items-center">
                    <div className="w-8 opacity-70"><Code size={16} /></div>
                    <div>
                    <p className="text-sm opacity-70">Source</p>
                    <p>{humanize(detail.source) || 'Unknown'}</p>
                    </div>
                </div>
                
                <div className="flex items-center">
                    <div className="w-8 opacity-70"><NotebookPen size={16} /></div>
                    <div>
                    <p className="text-sm opacity-70">Rating</p>
                    <p>{detail.rating?.toUpperCase() || "Unknown"}</p>
                    </div>
                </div>
                </div>
            </div>

            {/* User Status */}
            <div className="card capitalize">
                <h2 className="text-2xl font-semibold mb-4 bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Your List Status</h2>
                
                <div className="space-y-3">
                <div className="flex items-center">
                    <div className="w-8 opacity-70"><Heart size={16} /></div>
                    <div>
                    <p className="text-sm opacity-70">Status</p>
                    <p className="font-medium">{humanize(detail.my_list_status?.status) || "Not in list"}</p>
                    </div>
                </div>
                
                <div className="flex items-center">
                    <div className="w-8 opacity-70"><Star size={16} /></div>
                    <div>
                    <p className="text-sm opacity-70">Your Score</p>
                    <p>{detail.my_list_status?.score || "Not rated"}</p>
                    </div>
                </div>
                
                <div className="flex items-center">
                    <div className="w-8 opacity-70"><Check size={16} /></div>
                    <div>
                    <p className="text-sm opacity-70">Episodes Watched</p>
                    <p>{detail.my_list_status?.num_episodes_watched || 0} / {detail.num_episodes || "?"}</p>
                    </div>
                </div>
                
                {detail.my_list_status?.start_date && (
                    <div className="flex items-center">
                    <div className="w-8 opacity-70"><CalendarPlus2 size={16} /></div>
                    <div>
                        <p className="text-sm opacity-70">Started</p>
                        <p>{formatDate(detail.my_list_status.start_date)}</p>
                    </div>
                    </div>
                )}
                
                {detail.my_list_status?.finish_date && (
                    <div className="flex items-center">
                    <div className="w-8 opacity-70"><CalendarCheck size={16} /></div>
                    <div>
                        <p className="text-sm opacity-70">Finished</p>
                        <p>{formatDate(detail.my_list_status.finish_date)}</p>
                    </div>
                    </div>
                )}
                </div>
                
            </div>
            </div>
        </div>
        </div>

        <Footer />
    </div>
    );
};

export default AnimeDetail;