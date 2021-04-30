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
    try {
        const actual_ast = grammar.parse(fs.readFileSync(`tests/${name}.src`, 'utf-8'));

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
        console.error(error.location);
        throw error;
    }
}