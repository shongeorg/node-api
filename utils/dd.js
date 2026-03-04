import { inspect } from "node:util";

const ANSI = {
  reset: "\x1b[0m",
  key: "\x1b[33m",
  string: "\x1b[32m",
  number: "\x1b[34m",
  boolean: "\x1b[35m",
  null: "\x1b[31m",
  error: "\x1b[1;97;41m",
};

const colorize = (str) => {
  return str
    .replace(/^(\s*)(\w+):/gm, `$1${ANSI.key}$2${ANSI.reset}:`)
    .replace(/: '([^']*)'/g, `: ${ANSI.string}'$1'${ANSI.reset}`)
    .replace(/: (\d+)/g, `: ${ANSI.number}$1${ANSI.reset}`)
    .replace(/: (true|false)/g, `: ${ANSI.boolean}$1${ANSI.reset}`)
    .replace(/: (null)/g, `: ${ANSI.null}$1${ANSI.reset}`);
};

export const dd = (data) => {
  const raw = inspect(data, {
    colors: false,
    depth: Infinity,
    sorted: true,
    breakLength: 80,
    numericSeparator: true,
  });

  const colored = colorize(raw);

  return {
    log: () => console.log(colored),
    error: () => console.error(`${ANSI.error}${colored}${ANSI.reset}`),
    warn: () => console.warn(colored),
    table: () => console.table(data),
    raw: () => console.log(raw),
  };
};
