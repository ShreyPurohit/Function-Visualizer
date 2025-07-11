import Link from "next/link";

const Navbar = () => {
    return (
        <header>
            <nav className="bg-white text-gray-900 px-4 sm:px-6 py-4 shadow-md" aria-label="Main navigation">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <Link href="/" className="text-xl font-bold hover:text-blue-600 transition-colors">
                        VisualizeIt
                    </Link>

                    <ul className="flex items-center gap-6 text-sm font-medium">
                        <li>
                            <Link href="/" className="hover:text-blue-500 transition-colors">
                                How It Works
                            </Link>
                        </li>
                        <li>
                            <Link href="/visualize" className="hover:text-blue-500 transition-colors">
                                Visualize
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
