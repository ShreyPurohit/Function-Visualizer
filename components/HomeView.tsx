import MonacoEditor from "./MonacoEditor";

const Body = () => {
    return (
        <section className="px-6 py-10">
            <p className="font-semibold">Paste Your Function Here:</p>
            <MonacoEditor />
        </section>
    );
}

export default Body;