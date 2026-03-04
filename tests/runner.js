import { EventEmitter } from 'node:events';
import assert from 'node:assert';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ANSI colors
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const colorize = (color, str) => `${COLORS[color]}${str}${COLORS.reset}`;

class TestRunner extends EventEmitter {
  constructor() {
    super();
    this.results = { passed: 0, failed: 0, total: 0, failures: [] };
    this.currentSuite = null;
    this.suiteStack = [];
    this.testQueue = [];
  }

  describe(name, fn) {
    this.suiteStack.push({ name, beforeEachFns: this.getCurrentBeforeEachFns() });
    this.currentSuite = name;
    console.log(`\n${colorize('bold', colorize('cyan', '◼'))} ${colorize('bold', name)}`);
    try {
      fn();
    } catch (error) {
      this.results.failed++;
      this.results.total++;
      this.results.failures.push({ suite: name, test: 'Suite error', error });
      console.log(`  ${colorize('red', '✗')} Suite setup failed: ${error.message}`);
    }
    this.suiteStack.pop();
    this.currentSuite = this.suiteStack.length ? this.suiteStack[this.suiteStack.length - 1].name : null;
  }

  getCurrentBeforeEachFns() {
    if (this.suiteStack.length === 0) return [];
    return this.suiteStack[this.suiteStack.length - 1].beforeEachFns;
  }

  beforeEach(fn) {
    if (this.suiteStack.length) {
      this.suiteStack[this.suiteStack.length - 1].beforeEachFns.push(fn);
    }
  }

  async runBeforeEach() {
    const currentSuite = this.suiteStack[this.suiteStack.length - 1];
    if (currentSuite) {
      for (const fn of currentSuite.beforeEachFns) {
        await fn();
      }
    }
  }

  // Register test for later execution
  it(name, fn) {
    this.testQueue.push({
      name,
      suite: this.currentSuite,
      beforeEachFns: this.getCurrentBeforeEachFns(),
      fn,
    });
  }

  async runQueue() {
    for (const test of this.testQueue) {
      this.results.total++;
      
      // Set current suite
      this.currentSuite = test.suite;
      this.suiteStack = [{ name: test.suite, beforeEachFns: test.beforeEachFns }];
      
      // Run beforeEach
      await this.runBeforeEach();
      
      try {
        await test.fn();
        this.results.passed++;
        console.log(`  ${colorize('green', '✓')} ${test.name}`);
        this.emit('test:pass', { suite: test.suite, name: test.name });
      } catch (error) {
        this.results.failed++;
        this.results.failures.push({ suite: test.suite, test: test.name, error });
        console.log(`  ${colorize('red', '✗')} ${test.name}`);
        console.log(`    ${colorize('red', error.message)}`);
        this.emit('test:fail', { suite: test.suite, name: test.name, error });
      }
    }
    this.testQueue = [];
  }

  summary() {
    console.log(`\n${colorize('bold', '─'.repeat(50))}`);
    console.log(`${colorize('bold', 'Test Results:')}`);
    console.log(`  ${colorize('green', `✓ Passed: ${this.results.passed}`)}`);
    console.log(`  ${colorize('red', `✗ Failed: ${this.results.failed}`)}`);
    console.log(`  ${colorize('blue', `Total: ${this.results.total}`)}`);

    if (this.results.failures.length > 0) {
      console.log(`\n${colorize('bold', colorize('red', 'Failures:'))}`);
      this.results.failures.forEach(({ suite, test, error }) => {
        console.log(`  ${colorize('yellow', `${suite} › ${test}`)}`);
        console.log(`    ${colorize('red', error.message)}`);
        if (error.stack) {
          const stack = error.stack.split('\n').slice(1, 3).join('\n    ');
          console.log(`    ${colorize('yellow', stack)}`);
        }
      });
    }

    console.log(colorize('bold', '─'.repeat(50)));
    const success = this.results.failed === 0;
    console.log(success ? colorize('green', '✓ All tests passed!') : colorize('red', `✗ ${this.results.failed} test(s) failed`));
    return success;
  }
}

const runner = new TestRunner();

export const describe = runner.describe.bind(runner);
export const it = runner.it.bind(runner);
export const beforeEach = runner.beforeEach.bind(runner);
export { assert };

export async function runTests(dir = 'unit') {
  const testDir = join(__dirname, dir);
  const files = await readdir(testDir).catch(() => []);
  const testFiles = files.filter((f) => f.endsWith('.test.js')).sort();

  console.log(`${colorize('cyan', '▶')} Running tests in ${colorize('bold', dir)}...`);

  for (const file of testFiles) {
    const filePath = join(testDir, file);
    const fileUrl = new URL(`file://${filePath}`).href;
    const relativePath = relative(process.cwd(), filePath);
    console.log(`\n${colorize('yellow', '📄')} ${relativePath}`);
    
    // Reset state for each file
    runner.suiteStack = [];
    runner.currentSuite = null;
    runner.testQueue = [];
    
    try {
      await import(fileUrl);
      await runner.runQueue();
    } catch (error) {
      console.log(`  ${colorize('red', '✗')} Failed to load: ${error.message}`);
      runner.results.failed++;
      runner.results.total++;
      runner.results.failures.push({ suite: file, test: 'Load error', error });
    }
  }

  return runner;
}

if (process.argv[1]?.endsWith('runner.js')) {
  const args = process.argv.slice(2);
  const testType = args[0] || 'unit';

  (async () => {
    try {
      const testRunner = await runTests(testType);
      const success = testRunner.summary();
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error(colorize('red', 'Test runner error:'), error.message);
      process.exit(1);
    }
  })();
}

export default runner;
