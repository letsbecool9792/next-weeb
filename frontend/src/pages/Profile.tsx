import { useEffect, useState } from 'react';
import Header from '../components/Header';

type Profile = {
  name: string;
  birthday: string;
  location: string;
  joined_at: string;
  picture: string;
};

const Profile = ({ setIsLoggedIn }: { setIsLoggedIn: any }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    // Fetch cached profile
    const loadProfile = async () => {
        const res = await fetch('http://localhost:8000/api/cached-profile/', {
            method: 'GET',
            credentials: 'include',
        });
        if (res.ok) {
            setProfile(await res.json());
        }
        setLoading(false);
    };

    // Sync then reload
    const handleSync = async () => {
        setSyncing(true);
        await fetch('http://localhost:8000/api/sync-profile/', {
            method: 'POST',
            credentials: 'include',
        });
        await loadProfile();
        setSyncing(false);
    };

    useEffect(() => {
    loadProfile();
    }, []);

    if (loading) return <p>Loading profile…</p>;

    return (
        <div className="p-4">
            <Header setIsLoggedIn={setIsLoggedIn} />
            <h1 className="text-2xl font-bold mb-4">My MAL Profile</h1>
            <button
            onClick={handleSync}
            disabled={syncing}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 mb-4"
            >
            {syncing ? 'Syncing…' : 'Sync Profile'}
            </button>
            {profile && (
            <div className="space-y-2">
                <img src={profile.picture} alt={profile.picture} className="h-32" />
                <p><strong>Name:</strong> {profile.name}</p>
                <p><strong>Birthday:</strong> {profile.birthday}</p>
                <p><strong>Location:</strong> {profile.location}</p>
                <p><strong>Joined:</strong> {new Date(profile.joined_at).toLocaleDateString()}</p>
            </div>
            )}
        </div>
    );
};

export default Profile;
