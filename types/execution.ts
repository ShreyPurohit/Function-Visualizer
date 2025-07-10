export type ExecutionStep = {
    line: number;
    code: string;
    variables: Record<string, any>;
};
