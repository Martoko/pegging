function compileStatements(statements, scope = [{}], indentation = "") {
    // Use reduce to deal with scope changes between each compile statement
    return statements
        .reduce(({ compiled, scope }, statement) => {
            let compiledStatement = compileStatement(statement, scope, indentation)
            return {
                compiled: [...compiled, compiledStatement.compiled],
                scope: compiledStatement.scope
            }
        }, { compiled: [], scope }).compiled.filter(s => s !== "").join("\n");
}

function compileStatement(statement, scope, indentation) {
    if (statement === "pass") return { compiled: "", scope };

    if ("function" in statement && statement.function.body !== undefined) {
        const { name, parameters, type, body } = statement.function;
        const [scopeHead, ...scopeTail] = scope;
        const functionScope = [{ ...scopeHead, [name]: { type, parameters } }, ...scopeTail];
        const innerScope = [
            { [name]: { type, parameters }, ...Object.fromEntries(parameters.map(p => [p.name, p.type])) },
            ...scope
        ]
        return {
            compiled:
                `${indentation}${type} ${name}(${parameters.map(compileParameter).join(", ")}) {\n`
                + `${compileStatements(body, innerScope, indentation + "  ")}\n`
                + `${indentation}}\n`,
            scope: functionScope
        };
    } if ("function" in statement && statement.function.body === undefined) {
        const { name, parameters, type } = statement.function;
        const [scopeHead, ...scopeTail] = scope;
        const functionScope = [{ ...scopeHead, [name]: { type, parameters } }, ...scopeTail];
        return {
            compiled: "",
            scope: functionScope
        };
    } else if ("if" in statement) {
        const { condition, body, elseBody } = statement.if;
        const { compiled, type } = compileExpression(condition, scope);
        // assert(type === "boolean");

        const compiledBlock = `${indentation}if(${compiled}) {\n`
            + `${compileStatements(body, scope, indentation + "  ")}\n`
            + `${indentation}}`;

        if (elseBody !== undefined) {
            const compiledElseBlock = ` else {\n`
                + `${compileStatements(elseBody, scope, indentation + "  ")}\n`
                + `${indentation}}`;
            return { compiled: compiledBlock + compiledElseBlock, scope };
        } else {
            return { compiled: compiledBlock, scope };
        }
    } else if ("return" in statement) {
        return { compiled: `${indentation}return ${compileExpression(statement.return, scope).compiled};`, scope };
    } else if ("let" in statement) {
        const { name, value } = statement.let;
        const { type, compiled } = compileExpression(value, scope);
        const [scopeHead, ...scopeTail] = scope;
        const letScope = [{ ...scopeHead, [name]: { type } }, ...scopeTail];
        return { compiled: `${indentation}${type} ${name} = ${compiled};`, scope: letScope };
    } else if ("call" in statement) {
        const { compiled, type } = compileExpression(statement, scope);
        // assert(type === "void");
        return { compiled: `${indentation}${compiled};`, scope };
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
    } else if ("equals" in expression) {
        const left = compileExpression(expression.equals[0], scope);
        const right = compileExpression(expression.equals[1], scope);
        // assert(left.type === right.type);
        return { compiled: `${left.compiled} == ${right.compiled}`, type: "int" };
    } else if ("greaterThan" in expression) {
        const left = compileExpression(expression.greaterThan[0], scope);
        const right = compileExpression(expression.greaterThan[1], scope);
        // assert(left.type === right.type);
        return { compiled: `${left.compiled} > ${right.compiled}`, type: "int" };
    } else if ("lessThan" in expression) {
        const left = compileExpression(expression.lessThan[0], scope);
        const right = compileExpression(expression.lessThan[1], scope);
        // assert(left.type === right.type);
        return { compiled: `${left.compiled} < ${right.compiled}`, type: "int" };
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
        // TODO: String escaping?
        return { compiled: `\"${expression.string}\"`, type: "char*" };
    } else if ("boolean" in expression) {
        return { compiled: `${expression.boolean}`, type: "int" };
    } else if ("call" in expression) {
        const { id, args } = expression.call;
        const definition = scope.map(s => s[id]).filter(s => s)[0];
        if (definition === undefined) {
            throw `Undefined function ${id}.`;
        }
        const returnType = definition.type;
        const parameters = definition.parameters;
        const compiledArgs = args.map(a => compileExpression(a, scope));

        for (let i = 0; i < compiledArgs.length || i < parameters.length; i += 1) {
            if (i >= parameters.length) {
                throw `Unexpected extra argument ${args[i].compiled},`;
            }

            if (i >= compiledArgs.length) {
                throw `Missing argument ${parameters[i].name},`;
            }

            // Needs to handle String->char* properly before enabling this
            // if(compiledArgs[i].type != parameters[i].type) {
            //     throw `Expected argument of type ${parameters[i].type}, but got ${compiledArgs[i].type} for "${parameters[i].name}" in call to ${id}.`;
            // }
        }
        return { compiled: `${id}(${compiledArgs.map(a => a.compiled).join(", ")})`, type: returnType };
    } else {
        return { compiled: `/* UNK: ${JSON.stringify(expression)} */`, type: "UNK" };
    }
}

function compileParameter(parameter) {
    const { type, name } = parameter;
    return `${type} ${name}`
}

module.exports = { compile: compileStatements };