import { ExecutionStep } from '@/types/execution';

export function mockParse(code: string): ExecutionStep[] {
    // Split code into lines
    const lines = code.split('\n');

    // A fake simulation for illustrative purposes
    const steps: ExecutionStep[] = [];

    let vars: Record<string, any> = {};

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        // Fake variable simulation
        if (trimmed.startsWith('let ')) {
            const [_, rest] = trimmed.split('let ');
            const [name, value] = rest.split('=').map(s => s.trim().replace(';', ''));
            vars = { ...vars, [name]: eval(value) }; // ❗In real parser: NEVER use eval
        } else if (trimmed.includes('=')) {
            const [name, value] = trimmed.split('=').map(s => s.trim().replace(';', ''));
            vars = { ...vars, [name]: eval(value) };
        }

        steps.push({
            line: index + 1,
            code: line,
            variables: { ...vars }
        });
    });

    return steps;
}
