import Body from "../components/HomeView";
import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <main className="bg-blue-200 h-screen">
      <header>
        <Navbar />
        <div className="w-full bg-blue-500 text-text flex justify-center items-center flex-col p-6">
          <h1 className="uppercase bg-cyan-400 px-6 py-2 font-extrabold text-gray-800 text-5xl max-w-5xl text-center my-5 rounded-md">
            Visualize Functions <br />
            Understand Code
          </h1>
          <p className="font-medium text-2xl text-white text-center break-words max-w-3xl">
            Simplify Anonymous Functions By Visualizing
          </p>
        </div>
      </header>
      <Body />
    </main>
  );
}
