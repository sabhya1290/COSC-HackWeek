const { TinyLangError } = require('./errors');

function tokenize(sourceCode) {
  const tokens = [];
  let i = 0;
  let line = 1;

  while (i < sourceCode.length) {
    const char = sourceCode[i];

    // Handle newlines
    if (char === '\n') {
      tokens.push({ type: 'NEWLINE', value: '\n', line });
      line++;
      i++;
      continue;
    }

    if (char === '\r') {
      i++;
      continue;
    }

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Skip comments
    if (char === '#') {
      while (i < sourceCode.length && sourceCode[i] !== '\n') {
        i++;
      }
      continue;
    }

    // String literals
    if (char === '"') {
      let value = '';
      i++; // Skip opening quote
      while (i < sourceCode.length && sourceCode[i] !== '"') {
        if (sourceCode[i] === '\n') {
          throw new TinyLangError('Unterminated string literal', line);
        }
        value += sourceCode[i];
        i++;
      }
      if (i >= sourceCode.length) {
        throw new TinyLangError('Unterminated string literal', line);
      }
      i++; // Skip closing quote
      tokens.push({ type: 'STRING', value, line });
      continue;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      let value = '';
      while (i < sourceCode.length && /[0-9.]/.test(sourceCode[i])) {
        value += sourceCode[i];
        i++;
      }
      if (isNaN(Number(value))) {
        throw new TinyLangError(`Invalid number: ${value}`, line);
      }
      tokens.push({ type: 'NUMBER', value: Number(value), line });
      continue;
    }

    // Operators and double character operators
    const nextChar = sourceCode[i + 1] || '';
    const doubleOp = char + nextChar;

    if (doubleOp === '==' || doubleOp === '>=' || doubleOp === '<=' || doubleOp === '!=') {
      tokens.push({ type: 'OPERATOR', value: doubleOp, line });
      i += 2;
      continue;
    }

    if ('+-*/%()><='.includes(char)) {
      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: '(', line });
      } else if (char === ')') {
        tokens.push({ type: 'RPAREN', value: ')', line });
      } else {
        tokens.push({ type: 'OPERATOR', value: char, line });
      }
      i++;
      continue;
    }

    // Identifiers and Keywords
    if (/[a-zA-Z_]/.test(char)) {
      let value = '';
      while (i < sourceCode.length && /[a-zA-Z0-9_]/.test(sourceCode[i])) {
        value += sourceCode[i];
        i++;
      }

      const upperValue = value.toUpperCase();
      const keywords = ['LET', 'PRINT', 'IF', 'THEN', 'ELSE', 'FOR', 'TO', 'END'];
      if (keywords.includes(upperValue)) {
        tokens.push({ type: 'KEYWORD', value: upperValue, line });
      } else {
        tokens.push({ type: 'IDENTIFIER', value, line });
      }
      continue;
    }

    throw new TinyLangError(`Unexpected character: '${char}'`, line);
  }

  tokens.push({ type: 'EOF', value: 'EOF', line });
  return tokens;
}

module.exports = { tokenize };
