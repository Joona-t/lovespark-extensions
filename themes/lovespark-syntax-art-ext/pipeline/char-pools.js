/**
 * Token pools per token type, sorted by visual density (light to heavy).
 *
 * Each pool is an array of strings (single or multi-char). Multi-char tokens
 * consume multiple grid columns when placed (Option A). Darker pixels pick
 * heavier/wider tokens, brighter pixels pick lighter/narrower ones.
 *
 * Index 0 = lightest visual weight.
 * Last index = heaviest visual weight.
 */

const POOLS = {
  keyword:  ['.', ';', 'if', 'in', 'let', 'for', 'var', 'def', 'else', 'class'],
  string:   ['.', "'", '""', 'str', "'s'", '"ok"', "'hi'", 'text', '"data"', '"value"'],
  number:   ['.', '0', '1', '42', '0x', '256', '0xFF', '1024', '65535'],
  operator: ['.', '-', '=', '!=', '=>', '||', '&&', '<<=', '>>=', '**='],
  function: ['.', '()', 'fn', '();', '[]', 'fn()', 'call', 'init', 'fn(){}'],
  comment:  ['`', '.', '//', '--', '/*', '///', '/**', '//TODO', '/**/'],
  variable: ['.', ',', '_x', 'id', 'val', 'key', 'self', 'data', 'this.x'],
  type:     ['.', ':', 'i8', 'int', 'u32', 'bool', 'char', 'str', 'Vec<T>'],
};

const TOKEN_TYPES = [
  'keyword', 'string', 'number', 'operator',
  'function', 'comment', 'variable', 'type',
];
