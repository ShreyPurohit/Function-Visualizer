import HomeView from '../components/HomeView'
import Navbar from '../components/Navbar'

export default function Home() {
  return (
    <main className='min-h-screen bg-blue-50 text-gray-800'>
      <Navbar />

      <section className='flex w-full flex-col items-center justify-center bg-blue-600 px-4 py-12 text-center text-white'>
        <h1 className='mb-6 max-w-4xl rounded-md bg-cyan-500 px-6 py-3 text-3xl font-extrabold uppercase shadow-md sm:text-4xl md:text-5xl'>
          Visualize Functions <br />
          Understand Code
        </h1>
        <p className='max-w-2xl text-lg font-medium md:text-xl'>
          Simplify anonymous functions by visualizing them interactively
        </p>
      </section>

      <HomeView />
    </main>
  )
}
