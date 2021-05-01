const fs = require('fs');
const peg = require('pegjs')

const grammar = peg.generate(fs.readFileSync('grammar.pegjs', 'utf-8'));
const compiler = require('./compiler');

fs.readFile('playground.src', 'utf8', (err, source) => {
    const reset_terminal_style = '\x1b[0m';
    const bold_terminal_style = '\x1b[1m';
    const red_terminal_style = '\x1b[31m';

    function bold_red(text) {
        return `${bold_terminal_style}${red_terminal_style}${text}${reset_terminal_style}`;
    }

    const source_lines = source.split('\n');
    if (err) {
        console.error(err);
        return;
    }
    try {
        const parsed = grammar.parse(source);
        fs.writeFile('playground.ast.json', JSON.stringify(parsed, null, 2), () => { });
        fs.writeFile('playground.c', compiler.compile(parsed), () => { });
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
});