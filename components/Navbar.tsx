import Link from "next/link";

const Navbar = () => {
    return (
        <nav className="px-5 py-3 shadow">
            <div className="flex items-center justify-between">
                <Link href={'/'}>Home</Link>
                <div className="flex items-center gap-5 text-black">
                    <Link href={'/'}>How it works</Link>
                    <Link href={'/'}>Visualize</Link>
                </div>
            </div>
        </nav>
    )
}

export default Navbar;