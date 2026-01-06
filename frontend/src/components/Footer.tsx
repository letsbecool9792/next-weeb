const Footer = () => {
  return (
    <footer className="px-4 sm:px-6 lg:px-8 py-12 bg-purple-900 bg-opacity-70">
        <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-6 md:mb-0">
                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-400">
                    NextWeeb
                    </span>
                    <p className="mt-2 text-purple-300">Your Anime Journey, Supercharged.</p>
                </div>
                <div className="flex space-x-6">
                    <a href="https://github.com/letsbecool9792/next-weeb" className="text-purple-300 hover:text-white transition-colors">
                    GitHub
                    </a>
                    <a href="https://letsbecool.vercel.app" className="text-purple-300 hover:text-white transition-colors">
                    Contact
                    </a>
                </div>
            </div>
        </div>
    </footer>
  );
};

export default Footer;

