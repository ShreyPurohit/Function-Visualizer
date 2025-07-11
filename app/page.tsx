import Body from "../components/HomeView";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-blue-50 text-gray-800">
      <Navbar />

      <section className="w-full bg-blue-600 flex flex-col items-center justify-center px-4 py-16 text-white text-center">
        <h1 className="uppercase bg-cyan-500 px-6 py-3 font-extrabold text-3xl sm:text-4xl md:text-5xl rounded-md shadow-md max-w-4xl mb-6">
          Visualize Functions <br />
          Understand Code
        </h1>
        <p className="text-lg md:text-xl font-medium max-w-2xl">
          Simplify anonymous functions by visualizing them interactively
        </p>
      </section>

      <Body />
    </main>
  );
}
