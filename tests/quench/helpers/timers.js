/**
 * Waits a short time before resolving.
 *
 * @returns {Promise<void>} A promise that returns after a moment.
 */
export function waitOneMoment() {
  return new Promise((resolve) => {
    setTimeout(resolve, 50);
  });
}
