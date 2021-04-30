const fs = require('fs');
const peg = require('pegjs')

fs.writeFileSync('grammar.js', peg.generate(fs.readFileSync('grammar.pegjs', 'utf-8'), {output: 'source', format: 'commonjs'}));
const grammar = require('./grammar.js')

// const grammar = peg.generate(fs.readFileSync('grammar.pegjs', 'utf-8'));

const compiler = require('./compiler');

fs.readFile('example', 'utf8', (err, data) => {
    if (err) {
        console.error(err)
        return
    }
    const parsed = grammar.parse(data);
    const json = JSON.stringify(parsed, null, 2);
    console.log(json)
    fs.writeFile('example.ast.json', json, () => { })
    fs.writeFile('example.c', compiler.compile(parsed), () => { })
})