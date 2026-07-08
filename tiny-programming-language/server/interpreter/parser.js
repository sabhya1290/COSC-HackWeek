const { TinyLangError } = require('./errors');

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.current = 0;
  }

  peek() {
    return this.tokens[this.current];
  }

  previous() {
    return this.tokens[this.current - 1];
  }

  isAtEnd() {
    return this.peek().type === 'EOF';
  }

  advance() {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  check(type, value) {
    if (this.isAtEnd()) return false;
    const token = this.peek();
    if (token.type !== type) return false;
    if (value !== undefined && token.value !== value) return false;
    return true;
  }

  match(type, value) {
    if (this.check(type, value)) {
      this.advance();
      return true;
    }
    return false;
  }

  consume(type, message, value) {
    if (this.check(type, value)) return this.advance();
    throw new TinyLangError(message, this.peek().line);
  }

  parse() {
    const statements = [];
    while (!this.isAtEnd()) {
      while (this.match('NEWLINE')) {
        // Skip leading newlines or empty lines
      }
      if (this.isAtEnd()) break;
      statements.push(this.statement());
    }
    return { type: 'Program', body: statements };
  }

  statement() {
    if (this.match('KEYWORD', 'LET')) {
      return this.letStatement();
    }
    if (this.match('KEYWORD', 'PRINT')) {
      return this.printStatement();
    }
    if (this.match('KEYWORD', 'IF')) {
      return this.ifStatement();
    }
    if (this.match('KEYWORD', 'FOR')) {
      return this.forStatement();
    }

    throw new TinyLangError(`Unexpected token: '${this.peek().value}'`, this.peek().line);
  }

  letStatement() {
    const nameToken = this.consume('IDENTIFIER', 'Expect variable name after LET');
    this.consume('OPERATOR', "Expect '=' after variable name", '=');
    const value = this.expression();
    this.consumeStatementEnd();
    return {
      type: 'LetStatement',
      name: nameToken.value,
      value,
      line: nameToken.line
    };
  }

  printStatement() {
    const line = this.previous().line;
    const expression = this.expression();
    this.consumeStatementEnd();
    return {
      type: 'PrintStatement',
      expression,
      line
    };
  }

  ifStatement() {
    const line = this.previous().line;
    const condition = this.expression();
    this.consume('KEYWORD', "Expect 'THEN' after condition", 'THEN');
    
    // Skip optional newline after THEN
    this.match('NEWLINE');

    const thenBranch = [];
    while (!this.check('KEYWORD', 'ELSE') && !this.check('KEYWORD', 'END') && !this.isAtEnd()) {
      while (this.match('NEWLINE')) {}
      if (this.check('KEYWORD', 'ELSE') || this.check('KEYWORD', 'END') || this.isAtEnd()) break;
      thenBranch.push(this.statement());
    }

    let elseBranch = null;
    if (this.match('KEYWORD', 'ELSE')) {
      // Skip optional newline after ELSE
      this.match('NEWLINE');
      elseBranch = [];
      while (!this.check('KEYWORD', 'END') && !this.isAtEnd()) {
        while (this.match('NEWLINE')) {}
        if (this.check('KEYWORD', 'END') || this.isAtEnd()) break;
        elseBranch.push(this.statement());
      }
    }

    this.consume('KEYWORD', "Expect 'END' after IF statement", 'END');
    this.consumeStatementEnd();

    return {
      type: 'IfStatement',
      condition,
      thenBranch,
      elseBranch,
      line
    };
  }

  forStatement() {
    const line = this.previous().line;
    const variableToken = this.consume('IDENTIFIER', 'Expect variable name after FOR');
    this.consume('OPERATOR', "Expect '=' after loop variable name", '=');
    const start = this.expression();
    this.consume('KEYWORD', "Expect 'TO' after start value", 'TO');
    const end = this.expression();

    // Skip optional newline after TO
    this.match('NEWLINE');

    const body = [];
    while (!this.check('KEYWORD', 'END') && !this.isAtEnd()) {
      while (this.match('NEWLINE')) {}
      if (this.check('KEYWORD', 'END') || this.isAtEnd()) break;
      body.push(this.statement());
    }

    this.consume('KEYWORD', "Expect 'END' after FOR statement", 'END');
    this.consumeStatementEnd();

    return {
      type: 'ForStatement',
      variable: variableToken.value,
      start,
      end,
      body,
      line
    };
  }

  consumeStatementEnd() {
    if (this.isAtEnd()) return;
    if (this.check('NEWLINE')) {
      this.advance();
      return;
    }
    if (this.check('KEYWORD', 'ELSE') || this.check('KEYWORD', 'END')) {
      return;
    }
    throw new TinyLangError(`Expect newline or end of statement after expression`, this.peek().line);
  }

  expression() {
    return this.comparison();
  }

  comparison() {
    let expr = this.addition();
    const comparisonOps = ['==', '!=', '>=', '<=', '>', '<'];
    while (this.check('OPERATOR') && comparisonOps.includes(this.peek().value)) {
      const operator = this.advance().value;
      const right = this.addition();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: this.previous().line
      };
    }
    return expr;
  }

  addition() {
    let expr = this.multiplication();
    while (this.check('OPERATOR') && (this.peek().value === '+' || this.peek().value === '-')) {
      const operator = this.advance().value;
      const right = this.multiplication();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: this.previous().line
      };
    }
    return expr;
  }

  multiplication() {
    let expr = this.primary();
    while (this.check('OPERATOR') && (this.peek().value === '*' || this.peek().value === '/' || this.peek().value === '%')) {
      const operator = this.advance().value;
      const right = this.primary();
      expr = {
        type: 'BinaryExpression',
        left: expr,
        operator,
        right,
        line: this.previous().line
      };
    }
    return expr;
  }

  primary() {
    if (this.match('NUMBER') || this.match('STRING')) {
      return {
        type: 'Literal',
        value: this.previous().value,
        line: this.previous().line
      };
    }

    if (this.match('IDENTIFIER')) {
      return {
        type: 'Variable',
        name: this.previous().value,
        line: this.previous().line
      };
    }

    if (this.match('LPAREN')) {
      const line = this.previous().line;
      const expr = this.expression();
      this.consume('RPAREN', "Expect ')' after expression");
      return expr;
    }

    throw new TinyLangError(`Expect expression, found: '${this.peek().value}'`, this.peek().line);
  }
}

function parse(tokens) {
  const parser = new Parser(tokens);
  return parser.parse();
}

module.exports = { parse };
