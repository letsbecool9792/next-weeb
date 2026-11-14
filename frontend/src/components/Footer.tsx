import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const Footer = () => (
    <footer className="relative mt-16 border-t border-white/5 px-4 py-12 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
                <Link to="/" className="inline-flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
                        <Sparkles className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-lg font-bold text-gradient">NextWeeb</span>
                </Link>
                <p className="mt-2 text-sm text-purple-300/70">Your anime journey, supercharged. Built on MyAnimeList.</p>
            </div>
            <div className="flex gap-6 text-sm text-purple-200/70">
                <a href="https://github.com/letsbecool9792/next-weeb" className="transition hover:text-white">GitHub</a>
                <a href="https://letsbecool.vercel.app" className="transition hover:text-white">Contact</a>
                <a href="https://myanimelist.net" className="transition hover:text-white">MyAnimeList</a>
            </div>
        </div>
    </footer>
);

export default Footer;
