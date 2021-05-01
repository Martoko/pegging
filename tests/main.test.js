const fs = require('fs');
const util = require('util');
const peg = require('pegjs')
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const compiler = require('../compiler');
const grammar = peg.generate(fs.readFileSync('grammar.pegjs', 'utf-8'));

describe('grammar', () => {
    testFile('hello-world');
    testFile('fibonacci');
    testFile('niladic-call');
    // testFile('basic-example');
});

function testFile(name) {
    const source = fs.readFileSync(`tests/${name}.src`, 'utf-8');

    try {
        const actual_ast = grammar.parse(source);

        test(`parse ${name}`, async () => {
            const expected_ast = JSON.parse(await readFile(`tests/${name}.ast.json`, 'utf-8'));
            expect(actual_ast).toEqual(expected_ast);
        });

        test(`compile ${name}`, async () => {
            const actual_c_code = compiler.compile(actual_ast);
            const expected_c_code = await readFile(`tests/${name}.c`, 'utf-8');
            expect(actual_c_code).toEqual(expected_c_code);
        });
    } catch (error) {
        if (error.location) {
            const context = 20;
            const before = source.slice(Math.max(0, error.location.start.offset - context), error.location.start.offset);
            const middle = source.slice(error.location.start.offset, error.location.end.offset);
            const after = source.slice(error.location.end.offset, error.location.end.offset + context);

            var humanLocation = error.location.start.offset == error.location.end.offset
                ? `${error.location.start.line}:${error.location.start.column}`
                : `${error.location.start.line}:${error.location.start.column}-${error.location.end.line}:${error.location.end.column}`;
            console.error(before + ">>" + middle + "<<" + after + "\n" + humanLocation);
        }
        throw error;
    }
}