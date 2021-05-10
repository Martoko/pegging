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
    testFile('fibonacci-extra-whitespace');
    // testFile('basic-example');
});

function testFile(name) {
    const reset_terminal_style = '\x1b[0m';
    const bold_terminal_style = '\x1b[1m';
    const red_terminal_style = '\x1b[31m';

    function bold_red(text) {
        return `${bold_terminal_style}${red_terminal_style}${text}${reset_terminal_style}`;
    }

    const source = fs.readFileSync(`tests/${name}.src`, 'utf-8');
    const source_lines = source.split('\n');

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
            const context = 3;
            const start_line = Math.max(1, error.location.start.line - context);
            const end_line = Math.min(source_lines.length + 1, error.location.end.line + context + 1);

            let error_message = '';
            const digit_count = Math.max(start_line.toString().length, end_line.toString().length);
            for (let line_number = start_line; line_number < end_line; line_number += 1) {
                const source_line = source_lines[line_number - 1];

                const line_has_error = line_number >= error.location.start.line && line_number <= error.location.end.line;

                error_message += `${line_has_error ? bold_red('>') : ' '} ${line_number.toString().padStart(digit_count, ' ')} | ${source_line}\n`;
                if (line_has_error) {
                    let underline = '';
                    for (let column = 1; column < source_line.length + 1; column += 1) {
                        let column_has_error =
                            (line_number > error.location.start.line || column >= error.location.start.column) && (line_number < error.location.end.line || column < error.location.end.column);
                        underline += column_has_error ? bold_red('^') : ' ';
                    }
                    error_message += `  ${''.toString().padStart(digit_count, ' ')} | ${underline} \n`;
                }
            }

            // var humanLocation = error.location.start.offset == error.location.end.offset
            //     ? `${error.location.start.line}:${error.location.start.column}`
            //     : `${error.location.start.line}:${error.location.start.column}-${error.location.end.line}:${error.location.end.column}`;

            error.message += "\n\n" + error_message;
        }
        throw error;
    }
}