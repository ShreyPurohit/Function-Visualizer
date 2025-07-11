// lib/execution/helpers/step.ts
import { ExecutionStep } from '@/types/execution';

/**
 * Returns a function that pushes deduplicated execution steps
 */
export const pushStepFactory = (
    code: string,
    steps: ExecutionStep[],
    vars: Record<string, unknown>
) => {
    return (line: number | undefined, meta?: Partial<ExecutionStep>) => {
        if (!line) return;
        const last = steps.at(-1);
        const snapshot = JSON.stringify(vars);

        if (!last || last.line !== line || JSON.stringify(last.variables) !== snapshot) {
            steps.push({
                line,
                code: code.split('\n')[line - 1] || '',
                variables: JSON.parse(snapshot),
                ...meta,
            });
        }
    };
};

/**
 * Creates a deep clone of the current variable state.
 * Can be extended in the future for structured types.
 */
export function cloneVars(vars: Record<string, unknown>): Record<string, unknown> {
    return JSON.parse(JSON.stringify(vars));
}
