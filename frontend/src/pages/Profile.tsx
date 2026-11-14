import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Calendar, MapPin, Clock, User } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import ErrorState from '../components/ErrorState';
import { formatDate, LOAD_ERROR } from '../utils/format';
import { API_URL } from '../config';
import { authFetch } from '../utils/fetch';

type Profile = {
	name: string | null;
	birthday: string | null;
	location: string | null;
	joined_at: string | null;
	picture: string | null;
};

const Profile = () => {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [syncing, setSyncing] = useState(false);

	const [error, setError] = useState('');
	const [syncMessage, setSyncMessage] = useState('');

	// Fetch cached profile
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

	if (loading) {
		return (
			<div className="bg-gray-900">
				<LoadingScreen message="Loading profile..." />
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-900 text-white">
				<Header />
				<ErrorState message={error} onRetry={loadProfile} />
			</div>
		);
	}

	// First letter of the name, for the avatar when there is no picture
	const initial = (profile?.name || '?').charAt(0).toUpperCase();

	return (
	<div className="min-h-screen bg-gray-900 text-white">
		<Header />
		
		<div className="max-w-4xl mx-auto p-6">
		<div className="flex items-center justify-between mb-8">
			<h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
			My MAL Profile
			</h1>
			
			<button
			onClick={handleSync}
			disabled={syncing}
			className="btn-primary gap-2"
			>
			<RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
			{syncing ? 'Syncing...' : 'Sync Profile'}
			</button>
		</div>
		{syncMessage && <p className="text-yellow-200 mb-4 text-right">{syncMessage}</p>}

		{profile && (
			<div className="bg-purple-800/30 backdrop-blur-sm border border-purple-500/80 rounded-xl p-6 transition-all">
			<div className="grid gap-6">
				<div className="flex justify-center mb-2">
				{profile.picture ? (
					<img src={profile.picture} alt={profile.name || 'Profile'} className="" />
				) : (
					// The old fallback pointed at an image path that does not exist
					<div className="w-32 h-32 rounded-full border-2 border-purple-500 bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-5xl font-bold">
						{initial}
					</div>
				)}
				</div>
				
				<div className="grid gap-6">
				<div className="flex items-center">
					<div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
					<User className="w-6 h-6 text-white" />
					</div>
					<div>
					<p className="text-gray-400 text-sm">Name</p>
					<p className="text-xl font-medium">{profile.name || "Not set"}</p>
					</div>
				</div>
				
				<div className="flex items-center">
					<div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
					<Calendar className="w-6 h-6 text-white" />
					</div>
					<div>
					<p className="text-gray-400 text-sm">Birthday</p>
					<p className="text-xl font-medium">{formatDate(profile.birthday, 'Not set')}</p>
					</div>
				</div>
				
				<div className="flex items-center">
					<div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
					<MapPin className="w-6 h-6 text-white" />
					</div>
					<div>
					<p className="text-gray-400 text-sm">Location</p>
					<p className="text-xl font-medium">{profile.location || "Not set"}</p>
					</div>
				</div>
				
				<div className="flex items-center">
					<div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mr-4">
					<Clock className="w-6 h-6 text-white" />
					</div>
					<div>
					<p className="text-gray-400 text-sm">Joined</p>
					<p className="text-xl font-medium">{formatDate(profile.joined_at, 'Not set')}</p>
					</div>
				</div>
				</div>
			</div>
			</div>
		)}
		</div>
		<Footer />
	</div>
	);
};

export default Profile;