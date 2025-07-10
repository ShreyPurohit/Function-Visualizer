'use client';

import { useCodeStore } from '@/stores/useCodeStore';
import Editor, { OnMount } from '@monaco-editor/react';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

type IStandaloneCodeEditor = Parameters<OnMount>[0];

const MonacoEditor = () => {
    const editorRef = useRef<IStandaloneCodeEditor>(null);
    const setCode = useCodeStore((state) => state.setCode);
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
        <div className="flex gap-3">
            <div className="w-3/4">
                <Editor
                    height="300px"
                    defaultLanguage="javascript"
                    defaultValue="// code goes here"
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
            </div>
            <div className="w-1/4 flex items-start pt-2">
                <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Submit
                </button>
            </div>
        </div>
    );
};

export default MonacoEditor;
