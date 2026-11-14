import { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import ErrorState from '../components/ErrorState';
import Reveal from '../components/ui/Reveal';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';
import { formatDate, LOAD_ERROR } from '../utils/format';
import type { Profile as ProfileData } from '../types';

const Profile = () => {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState('');
    const [syncMessage, setSyncMessage] = useState('');

    const loadProfile = useCallback(async () => {
        setError('');
        try {
            const res = await authFetch(`${API_URL}/api/cached-profile/`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            setProfile(await res.json());
        } catch {
            setError(LOAD_ERROR);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        setSyncMessage('');
        try {
            const res = await authFetch(`${API_URL}/api/sync-profile/`, { method: 'POST' });
            if (res.ok) {
                await loadProfile();
                setSyncMessage('Profile synced.');
            } else {
                setSyncMessage(res.status === 429
                    ? 'You synced a lot just now. Wait a minute and try again.'
                    : 'Sync failed. MyAnimeList may be down; try again shortly.');
            }
        } catch {
            setSyncMessage('Sync failed. Check your connection and try again.');
        } finally {
            setSyncing(false);
        }
    };

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    // First letter of the name, for the avatar when there is no picture
    const initial = (profile?.name || '?').charAt(0).toUpperCase();

    const details = [
        { icon: Calendar, label: 'Birthday', value: formatDate(profile?.birthday, 'Not set') },
        { icon: MapPin, label: 'Location', value: profile?.location || 'Not set' },
        { icon: Clock, label: 'Joined MyAnimeList', value: formatDate(profile?.joined_at, 'Not set') },
    ];

    return (
        <>
            {/* Banner: the profile picture, blurred and enlarged, behind everything */}
            <section className="relative h-72 overflow-hidden">
                {profile?.picture ? (
                    <motion.img
                        src={profile.picture}
                        alt=""
                        initial={{ scale: 1.6, opacity: 0 }}
                        animate={{ scale: 1.4, opacity: 0.5 }}
                        transition={{ duration: 1.4 }}
                        className="h-full w-full object-cover blur-2xl"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-pink-600/50 via-purple-800/60 to-ink" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
            </section>

            <div className="relative z-10 mx-auto -mt-32 max-w-4xl px-4 sm:px-8">
                {loading ? (
                    <div className="flex flex-col items-center gap-4">
                        <div className="skeleton h-36 w-36 rounded-full" />
                        <div className="skeleton h-8 w-48" />
                    </div>
                ) : error ? (
                    <ErrorState message={error} onRetry={loadProfile} />
                ) : (
                    <>
                        <div className="flex flex-col items-center text-center">
                            <motion.div
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                                className="rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-purple-600 p-1 shadow-2xl shadow-pink-500/30"
                            >
                                {profile?.picture ? (
                                    <img src={profile.picture} alt={profile.name || 'Profile'} className="h-36 w-36 rounded-full border-4 border-ink object-cover" />
                                ) : (
                                    <div className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-ink bg-ink-soft text-6xl font-bold">
                                        {initial}
                                    </div>
                                )}
                            </motion.div>
                            <motion.h1
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                                className="mt-5 text-4xl font-bold tracking-tight"
                            >
                                {profile?.name || 'Your profile'}
                            </motion.h1>
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.25 }}
                                className="mt-5 flex flex-wrap justify-center gap-3"
                            >
                                <button onClick={handleSync} disabled={syncing} className="btn-primary">
                                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                                    {syncing ? 'Syncing...' : 'Sync profile'}
                                </button>
                                {profile?.name && (
                                    <a
                                        href={`https://myanimelist.net/profile/${encodeURIComponent(profile.name)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-secondary"
                                    >
                                        <ExternalLink className="h-4 w-4" /> MAL profile
                                    </a>
                                )}
                            </motion.div>
                            {syncMessage && <p className="mt-3 text-sm text-amber-200">{syncMessage}</p>}
                        </div>

                        <div className="mt-10 grid gap-4 sm:grid-cols-3">
                            {details.map((d, i) => (
                                <Reveal key={d.label} delay={0.2 + i * 0.08}>
                                    <motion.div whileHover={{ y: -4 }} className="card h-full text-center">
                                        <div className="icon mx-auto mb-3 h-11 w-11"><d.icon className="h-5 w-5" /></div>
                                        <p className="text-xs uppercase tracking-widest text-purple-300/70">{d.label}</p>
                                        <p className="mt-1 text-lg font-semibold">{d.value}</p>
                                    </motion.div>
                                </Reveal>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </>
    );
};

export default Profile;
