'use client';

import { ExecutionStep } from '@/types/execution';
import { m } from 'framer-motion';

type Props = {
    steps: ExecutionStep[];
    currentStep: number;
};

export const ExecutionVisualizer = ({ steps, currentStep }: Props) => {
    return (
        <div className="w-full p-4 flex flex-col gap-6">
            {/* Code Display */}
            <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm shadow-inner">
                {steps.map((step, index) => (
                    <m.pre
                        key={index}
                        initial={false}
                        animate={{
                            backgroundColor:
                                index === currentStep ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0)',
                            scale: index === currentStep ? 1.02 : 1,
                        }}
                        transition={{ duration: 0.25 }}
                        className="px-2 py-1 rounded"
                    >
                        <span className="text-gray-400 pr-2">{step.line.toString().padStart(2, '0')} |</span>
                        {step.code}
                    </m.pre>
                ))}
            </div>

            {/* Variables Display */}
            <div className="bg-white border rounded-lg p-4 shadow text-sm">
                <p className="font-semibold mb-2">🧠 Variables:</p>
                {Object.entries(steps[currentStep]?.variables || {}).length > 0 ? (
                    <ul className="list-disc pl-6">
                        {Object.entries(steps[currentStep]?.variables || {}).map(([key, value]) => (
                            <li key={key}>
                                <span className="font-mono font-medium text-blue-600">{key}</span>{' '}
                                = <span className="text-gray-700">{JSON.stringify(value)}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-400 italic">No variables yet.</p>
                )}
            </div>
        </div>
    );
};

export default ExecutionVisualizer;
