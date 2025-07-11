// lib/execution/getExecutionSteps.ts
import { ExecutionStep } from '@/types/execution';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { applyExpr, evalExpr } from './helpers/evalExpr';
import { pushStepFactory } from './helpers/step';
import { simulateFor, simulateIf, simulateWhile } from './simulators/controlFlow';

export function getExecutionSteps(code: string): ExecutionStep[] {
    const ast = parse(code, { sourceType: 'module', plugins: ['typescript'] });

    const steps: ExecutionStep[] = [];
    const vars: Record<string, unknown> = {};
    const pushStep = pushStepFactory(code, steps, vars);

    traverse(ast, {
        enter(path) {
            const node = path.node;

            if (t.isVariableDeclaration(node)) {
                node.declarations.forEach(d => {
                    if (t.isIdentifier(d.id)) vars[d.id.name] = evalExpr(d.init, vars);
                });
                pushStep(node.loc?.start.line);
            }

            if (t.isExpressionStatement(node)) {
                applyExpr(node.expression, vars);
                pushStep(node.loc?.start.line);
            }

            if (t.isForStatement(node)) simulateFor(node, vars, pushStep);
            if (t.isWhileStatement(node)) simulateWhile(node, vars, pushStep);
            if (t.isIfStatement(node)) simulateIf(node, vars, pushStep);
        },
    });

    return steps;
}
