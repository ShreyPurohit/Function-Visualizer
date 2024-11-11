import { ShieldQuestionIcon, LogOut, BadgePlus, SettingsIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import Image from "next/image"
import Link from "next/link"
import { auth, signIn, signOut } from '@/auth'
import { ModeToggle } from "./ui/themeToggle"

const Navbar = async () => {
    const session = await auth()

    return (
        <header className="px-5 py-3 shadow-sm font-work-sans">
            <nav className="flex justify-between items-center">
                <Link href={'/'}>
                    <Image src={'/logo.png'} alt="logo" width={40} height={10} className="h-auto w-auto rounded-xl" />
                </Link>
                <div className="flex items-center gap-5 text-black dark:text-white">
                    {session && session?.user ? (
                        <>
                            <Link href={'/tutorial'}>
                                <span className="max-sm:hidden">How It Works</span>
                                <ShieldQuestionIcon className="size-6 sm:hidden" />
                            </Link>
                            <Link href={'/function/visualize'}>
                                <span className="max-sm:hidden">Visualize</span>
                                <BadgePlus className="size-6 sm:hidden" />
                            </Link>
                            <form action={async () => {
                                "use server"
                                await signOut({ redirectTo: '/' })
                            }}>
                                <button type="submit">
                                    <span className="max-sm:hidden">Logout</span>
                                    <LogOut className="size-6 sm:hidden text-red-500" />
                                </button>
                            </form>
                            <Link href={`/user/${session?.id}`}>
                                <Avatar className="size-10 avatar">
                                    <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                                    <AvatarFallback>AV</AvatarFallback>
                                </Avatar>
                            </Link>
                        </>
                    ) : (
                        <>
                            <form action={async () => {
                                'use server'
                                await signIn('github')
                            }}>
                                <button type="submit">
                                    <span>Login</span>
                                </button>
                            </form>
                            <ModeToggle />
                        </>
                    )}
                </div>
            </nav>
        </header>
    )
}

export default Navbar