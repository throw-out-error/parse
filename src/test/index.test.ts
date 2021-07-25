import * as parse from "..";

describe("parser", () => {
    it("should parse 'hello world'", () => {
        const parser = parse.seq([
            parse.str("hello"),
            parse.whitespace,
            parse.str("world")
        ]);
        expect(
            parser({
                text: "hello world",
                index: 0
            }).success
        ).toBeTruthy();

        expect(
            parser({
                text: "hello",
                index: 0
            }).success
        ).toBeFalsy();

        expect(
            parser({
                text: "world",
                index: 0
            }).success
        ).toBeFalsy();
    });
});
