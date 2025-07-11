'use client';

import CodeHighlighter from '@/components/CodeHighlighter';
import ExecutionContextView from '@/components/ExecutionContextView';
import StepControls from '@/components/StepControls';
import VariableInspector from '@/components/VariableInspector';
import { getExecutionSteps } from '@/lib/execution/getExecutionSteps';
import { useCodeStore } from '@/stores/useCodeStore';
import { ExecutionStep } from '@/types/execution';
import {
    AlertTriangle,
    Ban,
    BarChart,
    BookOpen,
    Boxes,
    Code2,
    ScrollText,
} from 'lucide-react';

import { useEffect, useMemo, useState } from 'react';

const ExecutePage = () => {
    const code = useCodeStore((s) => s.code);
    const language = useCodeStore((s) => s.language);

    const [stepIndex, setStepIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const steps: ExecutionStep[] = useMemo(() => {
        if (!code) return [];
        try {
            setError(null);
            return getExecutionSteps(code);
        } catch (err: any) {
            setError(err?.message || 'Parsing error');
            return [];
        }
    }, [code]);

    useEffect(() => {
        setStepIndex(0);
    }, [steps]);

    const currentStep = steps[stepIndex];

    if (!code) {
        return (
            <main className="p-6 text-center text-gray-600 flex flex-col items-center justify-center min-h-screen">
                <div className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="w-5 h-5" aria-hidden="true" />
                    <p className="text-base">No code found. Please return to the editor and submit your function.</p>
                </div>
            </main>
        );
    }

    if (error) {
        return (
            <main className="p-6 text-center text-red-500 flex flex-col items-center justify-center min-h-screen">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                    <Ban className="w-5 h-5" aria-hidden="true" />
                    <p className="text-base font-medium">Error during parsing:</p>
                </div>
                <pre className="mt-2 bg-red-100 p-4 rounded text-sm text-left text-red-800 max-w-xl overflow-auto w-full">
                    {error}
                </pre>
            </main>
        );
    }

    return (
        <main className="grid grid-cols-1 md:grid-cols-3 grid-rows-[auto,1fr] gap-4 p-4 max-w-7xl mx-auto min-h-screen bg-gray-50">
            {/* Code Area */}
            <section className="md:col-span-2 bg-white shadow p-4 rounded-xl overflow-auto">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-blue-600" aria-hidden="true" />
                    Code Execution
                </h2>
                <CodeHighlighter
                    code={code}
                    currentLine={currentStep?.line ?? 0}
                    activeBlock={
                        currentStep?.blockType && currentStep?.blockRange
                            ? {
                                type: currentStep.blockType,
                                range: [
                                    currentStep.blockRange.start,
                                    currentStep.blockRange.end,
                                ],
                            }
                            : undefined
                    }
                />
            </section>

            {/* Variable Inspector */}
            <section className="md:col-span-1 bg-white shadow p-4 rounded-xl">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-green-600" aria-hidden="true" />
                    Variables
                </h2>
                <VariableInspector variables={currentStep?.variables || {}} />
            </section>

            {/* Execution Context */}
            <section className="md:col-span-2 bg-white shadow p-4 rounded-xl">
                <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-purple-600" aria-hidden="true" />
                    Execution Context
                </h2>
                <ExecutionContextView step={currentStep} />
            </section>

            {/* Step Controls + Metadata */}
            <aside className="md:col-span-1 flex flex-col justify-between bg-white shadow p-4 rounded-xl">
                <StepControls
                    currentStep={stepIndex}
                    totalSteps={steps.length}
                    onStepChange={setStepIndex}
                />
                <div className="text-sm text-gray-500 text-center mt-4 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                        <ScrollText className="w-4 h-4 text-gray-500" aria-hidden="true" />
                        <p>
                            Language: <strong>{language}</strong>
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <BarChart className="w-4 h-4 text-gray-500" aria-hidden="true" />
                        <p>
                            Total steps: <strong>{steps.length}</strong>
                        </p>
                    </div>
                </div>
            </aside>
        </main>
    );
};

export default ExecutePage;
