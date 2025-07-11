'use client';

import { useCodeStore } from '@/stores/useCodeStore';
import Editor, { OnMount } from '@monaco-editor/react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

type IStandaloneCodeEditor = Parameters<OnMount>[0];

const MonacoEditor = () => {
    const editorRef = useRef<IStandaloneCodeEditor>(null);
    const setCode = useCodeStore((s) => s.setCode);
    const language = useCodeStore((s) => s.language);
    const setLanguage = useCodeStore((s) => s.setLanguage);
    const router = useRouter();

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;
    };

    const handleSubmit = () => {
        const value = editorRef.current?.getValue() ?? '';
        setCode(value);
        router.push('/execute');
    };

    return (
        <main className="p-4 md:p-6 lg:p-8 max-w-screen-xl mx-auto">
            <section className="flex flex-col md:flex-row gap-4">
                <article className="w-full md:w-2/3">
                    <Editor
                        height="300px"
                        defaultLanguage="javascript"
                        defaultValue="// code goes here"
                        language={language}
                        theme="light"
                        onMount={handleEditorDidMount}
                        options={{
                            fontSize: 16,
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            wordWrap: 'on',
                            wrappingIndent: 'same',
                        }}
                    />
                </article>

                <aside className="w-full md:w-1/3 flex flex-col justify-between gap-4 pt-2">
                    <div>
                        <label htmlFor="language" className="block mb-1 text-sm font-medium text-gray-700">
                            Choose Language
                        </label>
                        <select
                            id="language"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value as 'javascript' | 'typescript')}
                            className="border border-gray-300 px-3 py-2 rounded text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="typescript">TypeScript</option>
                        </select>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="bg-blue-600 hover:bg-blue-700 cursor-pointer text-white font-semibold py-2 px-4 rounded transition-colors w-full"
                    >
                        Submit
                    </button>
                </aside>
            </section>
        </main>
    );
};

export default MonacoEditor;
