class TinyLangError extends Error {
  constructor(message, line) {
    super(message);
    this.name = 'TinyLangError';
    this.line = line;
  }
}

module.exports = { TinyLangError };
