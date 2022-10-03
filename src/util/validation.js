/**
 * Performs preprocessing on updates, meant to be called in a Document class's
 * _preUpdate method.
 *
 * Currently it just allows setting numeric defaults for number fields, which will be
 * used when either null is explicitly passed or a number input field is set to the
 * empty string.
 *
 * @param {*} schema  Specifies the fields of the document.
 * @param {Array<object>} schema.numberFields An array of {path, default} objects
 * describing the locations and default values of numeric fields.
 * @param {*} changes The object of changes passed to _preUpdate.
 */
export function preprocessUpdate({ numberFields }, changes) {
  for (const field of numberFields) {
    const change = foundry.utils.getProperty(changes, field.path);
    if (field.default !== undefined && change === null) {
      foundry.utils.setProperty(changes, field.path, field.default);
    }
  }
}
