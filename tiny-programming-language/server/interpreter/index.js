const { tokenize } = require('./tokenizer');
const { parse } = require('./parser');
const { evaluate } = require('./evaluator');
const { TinyLangError } = require('./errors');

function runTinyLang(sourceCode) {
  try {
    const tokens = tokenize(sourceCode);
    const ast = parse(tokens);
    const output = evaluate(ast);
    return { success: true, output };
  } catch (error) {
    if (error instanceof TinyLangError) {
      return {
        success: false,
        error: error.message,
        line: error.line
      };
    }
    return {
      success: false,
      error: error.message || 'Unknown runtime error'
    };
  }
}

module.exports = { runTinyLang };
