import Logo from './brand/Logo';

const Footer = () => (
    <footer className="relative mt-16 border-t border-white/5 px-4 py-12 sm:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent" />
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
                <div className="flex justify-center md:justify-start"><Logo size="sm" /></div>
                <p className="mt-2 text-sm text-purple-300/70">Your anime journey, supercharged. Built on MyAnimeList.</p>
            </div>
            <div className="flex gap-6 text-sm text-purple-200/70">
                <a href="https://github.com/letsbecool9792/next-weeb" className="transition hover:text-white">GitHub</a>
                <a href="https://suparno.me" className="transition hover:text-white">Contact</a>
                <a href="https://myanimelist.net" className="transition hover:text-white">MyAnimeList</a>
            </div>
        </div>
    </footer>
);

export default Footer;
