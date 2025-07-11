// lib/execution/helpers/evalExpr.ts
import * as t from '@babel/types';

/**
 * Evaluates expressions safely and returns result.
 */
export function evalExpr(expr: t.Expression | t.PrivateName | null | undefined, ctx: Record<string, unknown>): unknown {
    if (!expr) return undefined;

    if (t.isNumericLiteral(expr)) return expr.value;
    if (t.isStringLiteral(expr)) return expr.value;
    if (t.isBooleanLiteral(expr)) return expr.value;
    if (t.isIdentifier(expr)) return ctx[expr.name];

    if (t.isUnaryExpression(expr)) {
        const arg = evalExpr(expr.argument, ctx);
        return expr.operator === '-' ? -Number(arg) : +Number(arg);
    }

    if (t.isBinaryExpression(expr)) {
        const L = evalExpr(expr.left, ctx);
        const R = evalExpr(expr.right, ctx);
        switch (expr.operator) {
            case '+': return (L as number) + (R as number);
            case '-': return (L as number) - (R as number);
            case '*': return (L as number) * (R as number);
            case '/': return (L as number) / (R as number);
            case '%': return (L as number) % (R as number);
            case '<': return (L as number) < (R as number);
            case '<=': return (L as number) <= (R as number);
            case '>': return (L as number) > (R as number);
            case '>=': return (L as number) >= (R as number);
            case '===': return L === R;
            case '!==': return L !== R;
        }
    }

    if (t.isLogicalExpression(expr)) {
        const L = evalExpr(expr.left, ctx);
        const R = evalExpr(expr.right, ctx);
        return expr.operator === '&&' ? L && R : L || R;
    }

    return undefined;
}

/**
 * Handles assignment, update, and declaration expressions.
 */
export function applyExpr(
    expr: t.Expression | t.VariableDeclaration | null,
    ctx: Record<string, unknown>
): void {
    if (!expr) return;

    if (t.isAssignmentExpression(expr) && t.isIdentifier(expr.left)) {
        const name = expr.left.name;
        const value = evalExpr(expr.right, ctx);
        switch (expr.operator) {
            case '=': ctx[name] = value; break;
            case '+=': ctx[name] = (ctx[name] as number) + (value as number); break;
            case '-=': ctx[name] = (ctx[name] as number) - (value as number); break;
            case '*=': ctx[name] = (ctx[name] as number) * (value as number); break;
            case '/=': ctx[name] = (ctx[name] as number) / (value as number); break;
            case '%=': ctx[name] = (ctx[name] as number) % (value as number); break;
        }
    }

    else if (t.isUpdateExpression(expr) && t.isIdentifier(expr.argument)) {
        const name = expr.argument.name;
        ctx[name] = expr.operator === '++'
            ? (ctx[name] as number) + 1
            : (ctx[name] as number) - 1;
    }

    else if (t.isVariableDeclaration(expr)) {
        expr.declarations.forEach(d => {
            if (t.isIdentifier(d.id)) ctx[d.id.name] = evalExpr(d.init, ctx);
        });
    }
}
