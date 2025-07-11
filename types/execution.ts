// types/execution.ts

export enum BlockContext {
    FUNCTION = 'function',
    FOR = 'for',
    WHILE = 'while',
    IF = 'if',
    ELSE = 'else',
}

export type ExecutionStep = {
    line: number;
    code: string;
    variables: Record<string, any>;
    blockType?: BlockContext;
    blockRange?: { start: number; end: number };
};
