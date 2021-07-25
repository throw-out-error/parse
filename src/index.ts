export type Context = Readonly<{
    text: string; // the full input string
    index: number; // our current position in it
}>;

export type Parser<T> = (ctx: Context) => Result<T>;
export type Result<T> = Success<T> | Failure;

export type Success<T> = Readonly<{
    success: true;
    value: T;
    ctx: Context;
}>;

export type Failure = Readonly<{
    success: false;
    expected: string;
    ctx: Context;
}>;

export const success = <T>(ctx: Context, value: T): Success<T> => ({
    success: true,
    value,
    ctx
});

export const failure = (ctx: Context, expected: string): Failure => ({
    success: false,
    expected,
    ctx
});

export const str =
    (match: string): Parser<string> =>
    (ctx) => {
        const endIdx = ctx.index + match.length;
        if (ctx.text.substring(ctx.index, endIdx) === match)
            return success({ ...ctx, index: endIdx }, match);
        else return failure(ctx, match);
    };

export const regex =
    (re: RegExp, expected: string): Parser<string> =>
    (ctx) => {
        re.lastIndex = ctx.index;
        const res = re.exec(ctx.text);
        if (res && res.index === ctx.index)
            return success(
                { ...ctx, index: ctx.index + res[0].length },
                res[0]
            );
        else return failure(ctx, expected);
    };

export const seq =
    <T>(parsers: Parser<T>[]): Parser<T[]> =>
    (ctx) => {
        const values: T[] = [];
        let nextCtx = ctx;
        for (const parser of parsers) {
            const res = parser(nextCtx);
            if (!res.success) return res;
            values.push(res.value);
            nextCtx = res.ctx;
        }
        return success(nextCtx, values);
    };
export const any =
    <T>(parsers: Parser<T>[]): Parser<T> =>
    (ctx) => {
        let furthestRes: Result<T> | null = null;
        for (const parser of parsers) {
            const res = parser(ctx);
            if (res.success) return res;
            if (!furthestRes || furthestRes.ctx.index < res.ctx.index)
                furthestRes = res;
        }
        if (!furthestRes) throw new Error("No reult found");
        return furthestRes;
    };
export const optional = <T>(parser: Parser<T>): Parser<T | null> =>
    any([parser, (ctx) => success(ctx, null)]);

export const many =
    <T>(parser: Parser<T>): Parser<T[]> =>
    (ctx) => {
        const values: T[] = [];
        let nextCtx = ctx;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const res = parser(nextCtx);
            if (!res.success) break;
            values.push(res.value);
            nextCtx = res.ctx;
        }
        return success(nextCtx, values);
    };
export const map =
    <A, B>(parser: Parser<A>, fn: (val: A) => B): Parser<B> =>
    (ctx) => {
        const res = parser(ctx);
        return res.success ? success(res.ctx, fn(res.value)) : res;
    };
export const ident = regex(/[a-zA-Z][a-zA-Z0-9]*/g, "identifier");
export const whitespace = regex(/\s/, "whitespace");
export const space = str(" ");
