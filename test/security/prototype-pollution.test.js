/**
 * Security Regression Test: Prototype Pollution
 * Tests for GHSA-xxjr-mmjv-4gpg, GHSA-p6mc-m468-83gw, GHSA-35jh-r3h4-6jhm
 */

const _ = require('lodash');
const lodashPick = require('lodash.pick');
const lodashTemplate = require('lodash.template');

describe('Prototype Pollution Protection', () => {
  beforeEach(() => {
    // Reset Object.prototype before each test
    delete Object.prototype.polluted;
  });

  afterAll(() => {
    // Clean up after tests
    delete Object.prototype.polluted;
  });

  describe('lodash (GHSA-xxjr-mmjv-4gpg)', () => {
    test('set() should not pollute Object.prototype', () => {
      _.set({}, '__proto__.polluted', 'yes');
      expect(Object.prototype.polluted).toBeUndefined();
    });

    test('setWith() should not pollute Object.prototype', () => {
      _.setWith({}, '__proto__.polluted', 'yes');
      expect(Object.prototype.polluted).toBeUndefined();
    });

    test('set() with constructor.prototype should not pollute', () => {
      _.set({}, 'constructor.prototype.polluted', 'yes');
      expect(Object.prototype.polluted).toBeUndefined();
    });
  });

  describe('lodash.pick (GHSA-p6mc-m468-83gw)', () => {
    test('pick() should not pollute Object.prototype', () => {
      const obj = JSON.parse('{"__proto__": {"polluted": "yes"}}');
      lodashPick(obj, ['__proto__']);
      expect(Object.prototype.polluted).toBeUndefined();
    });
  });

  describe('lodash.template (GHSA-35jh-r3h4-6jhm)', () => {
    test('should not allow prototype pollution via template variables', () => {
      const template = lodashTemplate('<%= value %>');
      const result = template({
        value: 'test',
        __proto__: { polluted: 'yes' },
      });
      expect(Object.prototype.polluted).toBeUndefined();
      expect(result).toBe('test');
    });
  });
});
