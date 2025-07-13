import Link from 'next/link'

const Navbar = () => {
  return (
    <header>
      <nav
        className='bg-white px-4 py-4 text-gray-900 shadow-md sm:px-6'
        aria-label='Main navigation'
      >
        <div className='mx-auto flex max-w-7xl items-center justify-between'>
          <Link href='/' className='text-xl font-bold transition-colors hover:text-blue-600'>
            VisualizeIt
          </Link>

          <ul className='flex items-center gap-6 text-sm font-medium'>
            <li>
              <Link href='/' className='transition-colors hover:text-blue-500'>
                How It Works
              </Link>
            </li>
            <li>
              <Link href='/visualize' className='transition-colors hover:text-blue-500'>
                Visualize
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  )
}

export default Navbar
