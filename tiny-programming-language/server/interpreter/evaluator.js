const { TinyLangError } = require('./errors');

class Environment {
  constructor(parent = null) {
    this.values = {};
    this.parent = parent;
  }

  set(name, value) {
    this.values[name] = value;
  }

  get(name, line) {
    if (name in this.values) {
      return this.values[name];
    }
    if (this.parent) {
      return this.parent.get(name, line);
    }
    throw new TinyLangError(`Undefined variable: '${name}'`, line);
  }
}

class Evaluator {
  constructor() {
    this.output = [];
    this.env = new Environment();
    this.loopIterations = 0;
    this.MAX_ITERATIONS = 10000;
  }

  evaluate(node) {
    if (!node) return;

    switch (node.type) {
      case 'Program':
        for (const statement of node.body) {
          this.evaluate(statement);
        }
        break;

      case 'LetStatement': {
        const val = this.evaluateExpression(node.value);
        this.env.set(node.name, val);
        break;
      }

      case 'PrintStatement': {
        const val = this.evaluateExpression(node.expression);
        this.output.push(val === null || val === undefined ? '' : String(val));
        break;
      }

      case 'IfStatement': {
        const cond = this.evaluateExpression(node.condition);
        if (cond) {
          for (const statement of node.thenBranch) {
            this.evaluate(statement);
          }
        } else if (node.elseBranch) {
          for (const statement of node.elseBranch) {
            this.evaluate(statement);
          }
        }
        break;
      }

      case 'ForStatement': {
        const startVal = this.evaluateExpression(node.start);
        const endVal = this.evaluateExpression(node.end);

        if (typeof startVal !== 'number' || typeof endVal !== 'number') {
          throw new TinyLangError('FOR loop bounds must be numbers', node.line);
        }

        let currentVal = startVal;
        while (currentVal <= endVal) {
          this.loopIterations++;
          if (this.loopIterations > this.MAX_ITERATIONS) {
            throw new TinyLangError(`Infinite loop detected: Exceeded maximum loop limit of ${this.MAX_ITERATIONS} iterations`, node.line);
          }

          this.env.set(node.variable, currentVal);

          for (const stmt of node.body) {
            this.evaluate(stmt);
          }

          currentVal++;
        }
        break;
      }

      default:
        throw new TinyLangError(`Unknown statement type: '${node.type}'`, node.line);
    }
  }

  evaluateExpression(node) {
    switch (node.type) {
      case 'Literal':
        return node.value;

      case 'Variable':
        return this.env.get(node.name, node.line);

      case 'BinaryExpression': {
        const left = this.evaluateExpression(node.left);
        const right = this.evaluateExpression(node.right);

        switch (node.operator) {
          case '+':
            if (typeof left === 'string' || typeof right === 'string') {
              return String(left) + String(right);
            }
            return left + right;
          case '-':
            return left - right;
          case '*':
            return left * right;
          case '/':
            if (right === 0) {
              throw new TinyLangError('Division by zero', node.line);
            }
            return left / right;
          case '%':
            if (right === 0) {
              throw new TinyLangError('Modulo by zero', node.line);
            }
            return left % right;
          case '==':
            return left === right;
          case '!=':
            return left !== right;
          case '>':
            return left > right;
          case '<':
            return left < right;
          case '>=':
            return left >= right;
          case '<=':
            return left <= right;
          default:
            throw new TinyLangError(`Unknown operator: '${node.operator}'`, node.line);
        }
      }

      default:
        throw new TinyLangError(`Unknown expression type: '${node.type}'`, node.line);
    }
  }
}

function evaluate(ast) {
  const evaluator = new Evaluator();
  evaluator.evaluate(ast);
  return evaluator.output;
}

module.exports = { evaluate };
