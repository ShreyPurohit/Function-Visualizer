'use client';

import { BlockContext, ExecutionStep } from '@/types/execution';
import {
    Brain,
    ChevronRight,
    Lightbulb,
    Ruler,
    Type,
} from 'lucide-react';

interface Props {
    step?: ExecutionStep;
}

const blockLabels: Record<BlockContext, string> = {
    [BlockContext.FUNCTION]: 'Function Block',
    [BlockContext.FOR]: 'For Loop',
    [BlockContext.WHILE]: 'While Loop',
    [BlockContext.IF]: 'If Condition',
    [BlockContext.ELSE]: 'Else Condition',
};

const blockColors: Record<BlockContext, string> = {
    [BlockContext.FUNCTION]: 'bg-indigo-100 text-indigo-700',
    [BlockContext.FOR]: 'bg-blue-100 text-blue-700',
    [BlockContext.WHILE]: 'bg-green-100 text-green-700',
    [BlockContext.IF]: 'bg-yellow-100 text-yellow-700',
    [BlockContext.ELSE]: 'bg-orange-100 text-orange-700',
};

const ExecutionContextView: React.FC<Props> = ({ step }) => {
    if (!step) {
        return (
            <section
                aria-label="Execution Context"
                className="text-gray-400 italic text-sm"
            >
                No execution context available.
            </section>
        );
    }

    const { code, line, blockType, blockRange } = step;
    const label = blockType ? blockLabels[blockType] : null;
    const colorClass = blockType ? blockColors[blockType] : '';

    return (
        <section
            aria-label="Execution Context"
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-6 text-sm"
        >
            {/* Line Number */}
            <p className="flex items-center gap-2 leading-0">
                <ChevronRight className="w-4 h-4 text-blue-500" aria-hidden="true" />
                <strong className="text-gray-700">Current Line:</strong>
                <span className="font-mono text-blue-600">{line}</span>
            </p>

            {/* Code Block */}
            <article aria-label="Code Snippet">
                <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="w-4 h-4 text-yellow-500" aria-hidden="true" />
                    <strong className="text-gray-700">Code:</strong>
                </div>
                <pre className="bg-gray-100 text-gray-800 rounded-md p-3 overflow-x-auto leading-relaxed text-sm">
                    <code className="font-mono whitespace-pre-wrap break-words">{code}</code>
                </pre>
            </article>

            {/* Contextual Info */}
            <article aria-label="Block Context">
                <div className="flex items-center gap-2 mb-1">
                    <Brain className="w-4 h-4 text-purple-600" aria-hidden="true" />
                    <strong className="text-gray-700">Context:</strong>
                </div>

                {blockType && blockRange ? (
                    <dl className="space-y-3 mt-1">
                        {/* Block Type */}
                        <div className="flex items-center gap-2">
                            <dt>
                                <Type className="w-4 h-4 text-gray-500" aria-hidden="true" />
                            </dt>
                            <dd>
                                <span
                                    className={`text-xs px-2 py-1 rounded-md font-medium ${colorClass}`}
                                >
                                    {label}
                                </span>
                            </dd>
                        </div>

                        {/* Line Range */}
                        <div className="flex items-center gap-2 text-gray-600">
                            <dt>
                                <Ruler className="w-4 h-4 text-gray-400" aria-hidden="true" />
                            </dt>
                            <dd>
                                Line Range:{' '}
                                <span className="font-mono text-gray-800">
                                    {blockRange.start} – {blockRange.end}
                                </span>
                            </dd>
                        </div>
                    </dl>
                ) : (
                    <p className="text-gray-500 italic mt-1">
                        This line is not part of any specific block.
                    </p>
                )}
            </article>
        </section>
    );
};

export default ExecutionContextView;
