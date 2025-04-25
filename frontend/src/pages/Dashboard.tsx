import { useEffect, useState } from 'react';

import Header from '../components/Header';

type AnimeEntry = {
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

const Dashboard = ({isLoggedIn, setIsLoggedIn} : {isLoggedIn: boolean, setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>}) => {
    const [animeList, setAnimeList] = useState<AnimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    // const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // Session check
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('http://localhost:8000/api/session-status/', {
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
        const res = await fetch('http://localhost:8000/api/cached-animelist/', {
            method: 'GET',
            credentials: 'include',
        });
        if (res.ok) {
            const data: AnimeEntry[] = await res.json();
            setAnimeList(data);
        }
        setLoading(false);
    };

    const handleSync = async () => {
        setSyncing(true);
        const res = await fetch('http://localhost:8000/api/sync-animelist/', {
            method: 'POST',
            credentials: 'include',
        });
        if (res.ok) {
            await loadAnime();
        }
        setSyncing(false);
    };

    // Load list after confirming session
    // Auto-sync then load cache once we know we're logged in
    useEffect(() => {
        if (authChecked && isLoggedIn) {
            (async () => {
                setSyncing(true);
                    // hit the sync endpoint to populate the DB
                    await fetch('http://localhost:8000/api/sync-animelist/', {
                    method: 'GET',
                    credentials: 'include',
                });
                // now load from cache
                await loadAnime();
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

    if (!authChecked) return <p>Checking authentication...</p>;
    if (loading) return <p>Loading your anime list…</p>;
    if (!animeList.length) return <p>No anime found. Try “Sync” first.</p>;

    return (
        <div className="p-4">
            <Header setIsLoggedIn={setIsLoggedIn}/>
            <h1 className="text-2xl font-bold mb-4">Your Anime List</h1>
            <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
            {syncing ? 'Syncing...' : 'Sync'}
            </button>
            <ul className="space-y-4">
            {animeList.map((a) => (
                <li key={a.title} className="border p-4 rounded">
                <h2 className="text-xl">{a.title}</h2>
                <img src={a.image_url} alt={a.title} className="h-24 w-auto" />
                <p>Status: {a.status}</p>
                <p>Score: {a.score}</p>
                <p>Episodes Watched: {a.episodes_watched}</p>
                <p>Rewatching: {a.is_rewatching ? 'Yes' : 'No'}</p>
                <p>Started: {a.start_date}</p>
                <p>Finished: {a.finish_date}</p>
                <p>Last Updated: {new Date(a.last_updated).toLocaleString()}</p>
                </li>
            ))}
            </ul>
        </div>
    );
};

export default Dashboard;
