import { useEffect, useState } from 'react';
import { RefreshCw, Calendar, MapPin, Clock, User } from 'lucide-react';
import Header from '../components/Header';
import { API_URL } from '../config';

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
		const res = await fetch(`${API_URL}/api/cached-profile/`, {
			method: 'GET',
			credentials: 'include',
		});
		if (res.ok) {
			setProfile(await res.json());
		}
		setLoading(false);
	};

	// Sync then reload
	const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

	const handleSync = async () => {
		const minDuration = 500;     // ← tweak to taste
		setSyncing(true);
		const start = Date.now();

		const res = await fetch(`${API_URL}/api/sync-profile/`, {
			method: 'GET',
			credentials: 'include',
		});
		if (res.ok) {
			await loadProfile();
		}

		const elapsed = Date.now() - start;
		if (elapsed < minDuration) {
			await delay(minDuration - elapsed);
		}
		setSyncing(false);
	};

	useEffect(() => {
		loadProfile();
	}, []);

	// Format date: MMM DD, YYYY
	const formatDate = (dateString: string) => {
		if (!dateString) return "Not set";

		try {
			const date = new Date(dateString);
			const options: Intl.DateTimeFormatOptions = { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric' 
			};
			return date.toLocaleDateString('en-US', options);
		} catch (e) {
			return "Invalid date";
		}
	};

	if (loading) {
		return (
			<div className="overlay-center  bg-gray-900">
			<div className="overlay-box">
				<p className="text-xl">Loading profile...</p>
			</div>
			</div>
		);
	}

	return (
	<div className="min-h-screen bg-gray-900 text-white">
		<Header setIsLoggedIn={setIsLoggedIn} />
		
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

		{profile && (
			<div className="bg-purple-800/30 backdrop-blur-sm border border-purple-500/80 rounded-xl p-6 transition-all">
			<div className="grid gap-6">
				<div className="flex justify-center mb-2">
				<img 
					src={profile.picture || "/api/placeholder/128/128"} 
					alt={profile.name || "Profile"} 
					className="w-32 h-32 rounded-full border-2 border-purple-500 object-cover" 
				/>
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
					<p className="text-xl font-medium">{formatDate(profile.birthday)}</p>
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
					<p className="text-xl font-medium">{formatDate(profile.joined_at)}</p>
					</div>
				</div>
				</div>
			</div>
			</div>
		)}
		</div>
	</div>
	);
};

export default Profile;