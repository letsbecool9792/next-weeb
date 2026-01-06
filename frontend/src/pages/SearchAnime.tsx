import { useState } from 'react'; 
import { Link } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { usePostHog } from 'posthog-js/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LoadingScreen from '../components/LoadingScreen';
import { API_URL } from '../config';

type SearchResultNode = {
	id: number;
	title: string;
	main_picture: { medium: string; large?: string };
};

type SearchDetail = SearchResultNode & {
	genres: { id: number; name: string }[];
	num_episodes: number;
	start_date: string;
};

const SearchAnime = ({ setIsLoggedIn }: { setIsLoggedIn: any }) => {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SearchDetail[]>([]);
	const [loading, setLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const posthog = usePostHog();

	const handleSearch = async () => {
	if (!query.trim()) return;
	setLoading(true);
	setHasSearched(true);
	try {
		// 1) fetch search results
		const res = await fetch(
		`${API_URL}/api/search-anime/?q=${encodeURIComponent(query)}&limit=6`,
		{ method: 'GET', credentials: 'include' }
		);
		if (!res.ok) throw new Error(`Search HTTP ${res.status}`);
		const raw = await res.json();

		const nodes: SearchResultNode[] = Array.isArray(raw.data)
		? raw.data.map((item: any) => item.node)
		: [];

		// 2) fetch details for each node in parallel
		const detailed: SearchDetail[] = (
		await Promise.all(
			nodes.map(async (node) => {
			const dRes = await fetch(
				`${API_URL}/api/anime/${node.id}/`,
				{ method: 'GET', credentials: 'include' }
			);
			if (!dRes.ok) throw new Error(`Detail HTTP ${dRes.status}`);
			const det = await dRes.json();
			// pick only the fields we need
			return {
				id: node.id,
				title: node.title,
				main_picture: node.main_picture,
				genres: det.genres ?? [],
				num_episodes: det.num_episodes,
				start_date: det.start_date,
			};
			})
		)
		).filter(Boolean);

		setResults(detailed);
		
		// Track anime search
		posthog?.capture('anime_searched', {
			query: query,
			results_count: detailed.length,
		});
	} catch (err) {
		console.error('Search + detail fetch failed:', err);
		setResults([]);
	} finally {
		setLoading(false);
	}
	};

	return (
	<div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 text-white">
		<Header setIsLoggedIn={setIsLoggedIn}/>
		
		<main className="max-w-6xl mx-auto px-6 py-8">
		<h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
			Discover Anime
		</h1>

		<div className="relative flex mb-10">
			<input
			type="text"
			value={query}
			onChange={(e) => setQuery(e.target.value)}
			placeholder="Search for an anime..."
			className="bg-purple-900/30 border border-purple-500/50 text-white px-4 py-3 rounded-lg w-full focus:ring-2 focus:ring-pink-500 focus:border-transparent backdrop-blur-sm"
			onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
			/>
			<button
			onClick={handleSearch}
			className="btn-primary ml-2"
			disabled={loading}
			>
			{loading ? (
				<Loader2 className="animate-spin mr-2 h-5 w-5" />
			) : (
				<Search className="mr-2 h-5 w-5" />
			)}
			{loading ? 'Searching...' : 'Search'}
			</button>
		</div>

		{loading && (
			<div className="bg-transparent">
				<LoadingScreen 
					message="Searching the anime universe" 
					subMessage="Finding the best matches for you..."
				/>
			</div>
		)}

		{!loading && !hasSearched && (
			<div className="text-center py-16 px-4">
			<div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
				<Search className="h-8 w-8 text-white" />
			</div>
			<h2 className="text-2xl font-semibold mb-3 text-purple-100">Ready to explore anime?</h2>
			<p className="text-purple-300 max-w-md mx-auto">
				Enter a title, character name, or genre to discover your next favorite anime series.
			</p>
			</div>
		)}

		{!loading && hasSearched && results.length === 0 && (
			<div className="text-center py-16 px-4">
			<div className="w-16 h-16 mx-auto mb-5 bg-purple-800/60 backdrop-blur-sm border border-purple-500/40 rounded-full flex items-center justify-center">
				<Search className="h-6 w-6 text-purple-300" />
			</div>
			<p className="text-xl text-purple-200 mb-2">No results found for "{query}"</p>
			<p className="text-purple-400 max-w-md mx-auto">
				Try a different search term or check your spelling
			</p>
			</div>
		)}

		<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
			{results.map((anime) => (
			<Link
				key={anime.id}
				to={`/anime/${anime.id}`}
				className="card relative group"
			>
				{/* <div className="number">{anime.id}</div> */}
				<div className="overflow-hidden rounded-lg mb-4">
				<img
					src={anime.main_picture.medium}
					alt={anime.title}
					className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
				/>
				</div>
				<h2 className="text-xl font-semibold mb-2 line-clamp-1">{anime.title}</h2>
				<div className="flex flex-wrap gap-2 mb-3">
				{anime.genres.slice(0, 3).map(genre => (
					<span key={genre.id} className="text-xs px-2 py-1 bg-purple-700/50 rounded-full border border-purple-500/30">
					{genre.name}
					</span>
				))}
				</div>
				<div className="flex justify-between text-sm text-purple-300">
				<span>{anime.num_episodes > 0 ? `${anime.num_episodes} episodes` : 'Unknown episodes'}</span>
				<span>{anime.start_date?.split('-')[0] || 'Unknown year'}</span>
				</div>
			</Link>
			))}
		</div>
		</main>
		
		<Footer />
	</div>
	);
};

export default SearchAnime;