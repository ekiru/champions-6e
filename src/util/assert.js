export class AssertionError extends Error {}

/**
 * Throws a warning that some functionality has not yet been implemented.
 *
 * @param {string?} message A message to use in the error.
 * @returns {never} Always throws.
 */
export function notYetImplemented(message = undefined) {
  throw new AssertionError(message ?? "not yet implemented");
}

/**
 * Asserts that a pre-condition of the calling method holds.
 *
 * @param {boolean} condition Whether the precondition holds.
 * @param {string?} message A message to throw if the precondition fails.
 */
export function precondition(condition, message = undefined) {
  message = message ?? "Precondition failed";
  if (!condition) {
    throw new AssertionError(message);
  }
}