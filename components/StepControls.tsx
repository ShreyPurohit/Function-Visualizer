'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
    currentStep: number;
    totalSteps: number;
    onStepChange: (newStep: number) => void;
};

const StepControls = ({ currentStep, totalSteps, onStepChange }: Props) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const next = () => {
        if (currentStep < totalSteps - 1) {
            onStepChange(currentStep + 1);
        } else {
            setIsPlaying(false); // Stop auto-play at the end
        }
    };

    const prev = () => {
        if (currentStep > 0) {
            onStepChange(currentStep - 1);
        }
    };

    const togglePlay = () => setIsPlaying(prev => !prev);

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                onStepChange(Math.min(currentStep + 1, totalSteps - 1));
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, onStepChange, totalSteps]);

    const reset = () => {
        setIsPlaying(false);
        onStepChange(0);
    };

    return (
        <div className="flex gap-4 items-center justify-center mt-4">
            <button
                onClick={prev}
                disabled={currentStep === 0}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
                ⏮ Prev
            </button>
            <button
                onClick={togglePlay}
                className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
            >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
                onClick={next}
                disabled={currentStep === totalSteps - 1}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
            >
                ⏭ Next
            </button>
            <button
                onClick={reset}
                className="px-3 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
            >
                🔄 Reset
            </button>
            <span className="text-sm text-gray-500">
                Step {currentStep + 1} of {totalSteps}
            </span>
        </div>
    );
};

export default StepControls;
