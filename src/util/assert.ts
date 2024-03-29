export class AssertionError extends Error {}

export class AbstractMethodError extends AssertionError {
  readonly class: string;
  readonly method: string;

  constructor(cls: Function, method: string) {
    super(`Abstract method ${cls.name}.${method} called`);
    this.class = cls.name;
    this.method = method;
  }
}

/**
 * Throws an AbstractMethodError unless overriden.
 *
 * @param {Function} cls The class which defines the abstract method.
 * @param {string} method The method name
 */
export function abstract(cls: Function, method: string): never {
  throw new AbstractMethodError(cls, method);
}

/**
 * Throws a warning that some functionality has not yet been implemented.
 *
 * @param {string?} message A message to use in the error.
 * @returns {never} Always throws.
 */
export function notYetImplemented(message?: string): never {
  throw new AssertionError(message ?? "not yet implemented");
}

/**
 * Asserts that a pre-condition of the calling method holds.
 *
 * @param {boolean} condition Whether the precondition holds.
 * @param {string?} message A message to throw if the precondition fails.
 */
export function precondition(
  condition: boolean,
  message?: string
): asserts condition {
  message = message ?? "Precondition failed";
  if (!condition) {
    throw new AssertionError(message);
  }
}

/**
 * Asserts that a condition is true.
 *
 * @param {boolean} condition The condition to be asserted
 * @param {string?} message A message to be include in the error if the condition is false
 */
export function that(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new AssertionError(message ?? "Assertion failed.");
  }
}
