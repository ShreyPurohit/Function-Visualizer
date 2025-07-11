// lib/execution/simulators/controlFlow.ts
import { BlockContext, ExecutionStep } from '@/types/execution';
import * as t from '@babel/types';
import { applyExpr, evalExpr } from '../helpers/evalExpr';

type PushStepFn = (line?: number, meta?: Partial<ExecutionStep>) => void;

export function simulateFor(
    node: t.ForStatement,
    vars: Record<string, unknown>,
    pushStep: PushStepFn
) {
    const start = node.loc?.start.line ?? 0;
    const end = node.loc?.end.line ?? start;

    const meta = {
        blockType: BlockContext.FOR,
        blockRange: { start, end },
    };

    applyExpr(node.init as any, vars);
    pushStep(start, meta);

    let guard = 0;
    while (evalExpr(node.test, vars) && guard++ < 200) {
        execBlock(node.body, vars, pushStep, meta);
        applyExpr(node.update as any, vars);
        pushStep(node.update?.loc?.start.line ?? start, meta);
    }
}

export function simulateWhile(
    node: t.WhileStatement,
    vars: Record<string, unknown>,
    pushStep: PushStepFn
) {
    const start = node.loc?.start.line ?? 0;
    const end = node.loc?.end.line ?? start;

    const meta = {
        blockType: BlockContext.WHILE,
        blockRange: { start, end },
    };

    let guard = 0;
    while (evalExpr(node.test, vars) && guard++ < 200) {
        execBlock(node.body, vars, pushStep, meta);
        pushStep(start, meta);
    }
}

export function simulateIf(
    node: t.IfStatement,
    vars: Record<string, unknown>,
    pushStep: PushStepFn
) {
    const start = node.loc?.start.line ?? 0;
    const end = node.loc?.end.line ?? start;

    const blockType = node.alternate ? BlockContext.ELSE : BlockContext.IF;

    const meta = {
        blockType,
        blockRange: { start, end },
    };

    const condition = evalExpr(node.test, vars);
    const selected = condition ? node.consequent : node.alternate;

    if (selected) {
        execBlock(selected, vars, pushStep, meta);
    }

    pushStep(start, meta);
}

function execBlock(
    block: t.Statement | null | undefined,
    vars: Record<string, unknown>,
    pushStep: PushStepFn,
    meta?: Partial<ExecutionStep>
) {
    if (!block) return;

    if (t.isBlockStatement(block)) {
        block.body.forEach(stmt => {
            if (t.isVariableDeclaration(stmt)) {
                stmt.declarations.forEach(d => {
                    if (t.isIdentifier(d.id)) {
                        vars[d.id.name] = evalExpr(d.init, vars);
                    }
                });
            } else if (t.isExpressionStatement(stmt)) {
                applyExpr(stmt.expression, vars);
            }
            pushStep(stmt.loc?.start.line, meta);
        });
    } else {
        if (t.isVariableDeclaration(block)) {
            block.declarations.forEach(d => {
                if (t.isIdentifier(d.id)) {
                    vars[d.id.name] = evalExpr(d.init, vars);
                }
            });
        } else if (t.isExpressionStatement(block)) {
            applyExpr(block.expression, vars);
        }
        pushStep(block.loc?.start.line, meta);
    }
}
