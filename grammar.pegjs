{
	let indentation = 0;
}

Program
 = head:(Indented Statement)? tail:(EOL Indented Statement / EOL _)* {
  tail = tail.map(x => x[2]).filter(x => x);
  return head ? [head[1], ...tail] : [...tail];
 }
 
Statement
 = ReturnStatement
 / IfStatement
 / Function
 / ExternalFunction
 / ForLoop
 / Var
 / Call
 / PassThrough
 / "pass"

Expression
 = Constant
 / Assignment
 / Call
 / Reference
 / PassThrough

ComparisonExpression
 = l:Expression _ "==" _ r:ComparisonExpression  {return {equals:[l,r]};}
 / l:Expression _ "<" _ r:ComparisonExpression  {return {lessThan:[l,r]};}
 / l:Expression _ ">" _ r:ComparisonExpression  {return {greaterThan:[l,r]};}
 / Expression

MultiplicativeExpression
 = l:ComparisonExpression _ "*" _ r:MultiplicativeExpression  {return {multiply:[l,r]};}
 / l:ComparisonExpression _ "/" _ r:MultiplicativeExpression  {return {divide:[l,r]};}
 / ComparisonExpression

ArithmeticExpression
 = l:MultiplicativeExpression _ "-" _ r:ArithmeticExpression {return {minus:[l,r]};}
 / l:MultiplicativeExpression _ "+" _ r:ArithmeticExpression {return {plus:[l,r]};}
 / MultiplicativeExpression

IfStatement
 = "if" _ "(" _ condition:ArithmeticExpression _ ")" _ EOL body:Block EOL Indented "else" _ EOL elseBody:Block {
  return {if: {condition, body, elseBody}};
 }
 / "if" _ "(" _ condition:ArithmeticExpression _ ")" _ EOL body:Block {
  return {if: {condition, body}};
 }

ForLoop
 = "for" _ "("  _ initialStatement:Statement _ ";" _ condition:ArithmeticExpression _ ";" _ recurringExpression:Expression  _ ")" _ EOL body:Block {
   return {for: {initialStatement, condition, recurringExpression, body}};
 }

ReturnStatement
 = "return" _ expression:ArithmeticExpression {return {return: expression};}

ExternalFunction
 = "external" _ "fun" _ name:Id "(" _ parameters:ParameterList? _ ")"type:(":" _ Id)? _ EOL {
  type = type ? type[2] : "void";
  parameters = parameters ? parameters : [];
 	return {function: {name, parameters, type}};
 }

Function
 = "fun" _ name:Id "(" _ parameters:ParameterList? _ ")"type:(":" _ Id)? _ EOL body:Block {
  type = type ? type[2] : "void";
  parameters = parameters ? parameters : [];
 	return {function: {name, parameters, type, body}};
 }

ParameterList
 = head:Parameter "," _ tail:ParameterList { return [head, ...tail]; }
 / parameter:Parameter { return [parameter]; }

Parameter
 = name:Id":" _ type:Id { return {name, type}; }

Block
 = Indent statement:Statement statements:("\n" Indented Statement)* Dedent {
  return [statement, ...statements.map(x => x[2])];
 }

Indent
 = spaces:" "* &{const match = spaces.length == indentation+2; indentation += match ? 2 : 0; return match;}

Indented
 = spaces:" "* &{const match = spaces.length == indentation; return match;}

Dedent
 = &{indentation -= 2; return true;}

Assignment
 = name:Id _ "=" _ value:ArithmeticExpression {
 	return {assign: {name, value}};
 }

Var
 = "var" _ name:Id _ "=" _ value:ArithmeticExpression {
 	return {var: {name, value}};
 }

Call
 = id:Id '(' args:ArgumentList? ')' {
   args = args ? args : [];
   return {call: {id, args}};
  } 

ArgumentList
 = head:ArithmeticExpression "," _ tail:ArgumentList { return [head, ...tail]; }
 / argument:ArithmeticExpression { return [argument]; }

Reference
 = id:Id { return {id}; } 

PassThrough 
 = "!{" __ content:PassThroughContent { return {passThrough: content}}

PassThroughContent
 = __ "}!" { return ""; }
 / head:. tail:PassThroughContent { return head + tail; }

Id "identifier"
 = id:([A-z<>]+ / "@"[A-z0-9<>]+) { return id.flat().join(""); }

Constant
 = Boolean / Float / Integer / String

Boolean
 = "true" {return {boolean: "true"};}
 / "false" {return {boolean: "false"};}

Float "float"
  = number:$([0-9]+"."[0-9]+) "f" { return {float:number + "f"}; }
  / number:$([0-9]+) "f" { return {float:number + ".0f"}; }
  / number:$([0-9]+"."[0-9]+) "d" { return {float:number}; }
  / number:$([0-9]+) "d" { return {float:number + ".0"}; }

Integer "integer"
  = "0x" integer:([0-9A-z]+) { return {integer:text()}; }
  / "0b" integer:([0-1]+) { return {integer:text()}; }
  / [0-9]+ { return {integer:text()}; }

String "string"
 = '"' string:[^\"]* '"' { return {string: string.join("")}; }

Comment
 = "//".*

EOL
 = !"\\" [\n;]

_ "whitespace (excluding line breaks)"
  = [ \t]*
 
__ "whitespace (including line breaks)"
  = [ \t\r\n]*