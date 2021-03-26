const grammar = require('./grammar.js')
const fs = require('fs');
const assert = require('assert/strict');

function compileStatements(statements, scope = [{}], indentation = "") {
    // Use reduce to deal with scope changes between each compile statement
    return statements
        .reduce(({ compiled, scope }, statement) => {
            let compiledStatement = compileStatement(statement, scope, indentation)
            return {
                compiled: [...compiled, compiledStatement.compiled],
                scope: compiledStatement.scope
            }
        }, { compiled: [], scope }).compiled.join("\n");
}

function compileStatement(statement, scope, indentation) {
    console.log(scope);
    if ("function" in statement) {
        const { name, parameters, type, body } = statement.function;
        const [scopeHead, ...scopeTail] = scope;
        const functionScope = [{ ...scopeHead, [name]: {type} }, ...scopeTail];
        const innerScope = [Object.fromEntries(parameters.map(p => [p.name, p.type])), ...scope]
        return {
            compiled:
                `${indentation}${type} ${name}(${parameters.map(compileParameter).join(", ")}) {\n`
                + `${compileStatements(body, innerScope, indentation + "  ")}\n`
                + `${indentation}}`,
            scope: functionScope
        };
    } else if ("if" in statement) {
        const { condition, body, elseBody } = statement.if;
        const { compiled, type } = compileExpression(condition, scope);
        // assert(type === "boolean");
        return {
            compiled:
                `${indentation}if(${compiled}) {\n`
                + `${compileStatements(body, scope, indentation + "  ")}\n`
                + `${indentation}}`,
            scope
        };
    } else if ("return" in statement) {
        return { compiled: `${indentation}return ${compileExpression(statement.return, scope).compiled};`, scope };
    } else if ("let" in statement) {
        const { name, value } = statement.let;
        const { type, compiled } = compileExpression(value, scope);
        const [scopeHead, ...scopeTail] = scope;
        const letScope = [{ ...scopeHead, [name]: {type} }, ...scopeTail];
        return { compiled: `${indentation}${type} ${name} = ${compiled};`, scope: letScope };
    } else {
        return { compiled: `${indentation}// UNK: ${statement}`, scope };
    }
}

function compileExpression(expression, scope) {
    if ("plus" in expression) {
        const left = compileExpression(expression.plus[0], scope);
        const right = compileExpression(expression.plus[1], scope);
        // assert(left.type === right.type);
        return { compiled: `${left.compiled} + ${right.compiled}`, type: left.type };
    } else if ("minus" in expression) {
        const left = compileExpression(expression.minus[0], scope);
        const right = compileExpression(expression.minus[1], scope);
        // assert(left.type === right.type);
        return { compiled: `${left.compiled} - ${right.compiled}`, type: left.type };
    } else if ("multiply" in expression) {
        const left = compileExpression(expression.multiply[0], scope);
        const right = compileExpression(expression.multiply[1], scope);
        // assert(left.type === right.type);
        return { compiled: `${left.compiled} * ${right.compiled}`, type: left.type };
    } else if ("divide" in expression) {
        const left = compileExpression(expression.divide[0], scope);
        const right = compileExpression(expression.divide[1], scope);
        // assert(left.type === right.type);
        return { compiled: `${left.compiled} / ${right.compiled}`, type: left.type };
    } else if ("id" in expression) {
        const type = scope.map(s => s[expression.id]).filter(s => s)[0].type
        return { compiled: `${expression.id}`, type };
    } else if ("float" in expression) {
        return { compiled: `${expression.float}`, type: "float" };
    } else if ("double" in expression) {
        return { compiled: `${expression.double}`, type: "double" };
    } else if ("integer" in expression) {
        return { compiled: `${expression.integer}`, type: "int" };
    } else if ("string" in expression) {
        return { compiled: `${expression.string}`, type: "char*" };
    } else if ("boolean" in expression) {
        return { compiled: `${expression.boolean}`, type: "int" };
    } else {
        return "";
    }
}

function compileParameter(parameter) {
    const { type, name } = parameter;
    return `${type} ${name}`
}

fs.readFile('example', 'utf8', (err, data) => {
    if (err) {
        console.error(err)
        return
    }
    const parsed = grammar.parse(data);
    const json = JSON.stringify(parsed, null, 2);
    console.log(json)
    fs.writeFile('example.ast.json', json, () => { })
    fs.writeFile('example.c', compileStatements(parsed), () => { })
})