const mongoose = require("mongoose");

/**
 * Validator to ensure keys of a Map match the fields of a Mongoose schema.
 * @param {mongoose.Schema} schema - The Mongoose schema object to validate against.
 * @returns {function} - A validation function for Mongoose schema.
 */
const mapKeysValidator = (schema) => {
  // Should move to TS soon
  return function (map) {
    const validKeys = Object.keys(schema.paths);
    return Array.from(map.keys()).every((key) => validKeys.includes(key));
  };
};

/**
 * Custom error message generator for invalid keys.
 * @param {mongoose.Schema} schema - The name of the Mongoose model.
 * @returns {function} - A message function for the validator.
 */
const mapKeysErrorMessage = (schema) => {
  return (props) => {
    const invalidKeys = Array.from(props.value.keys()).filter(
      (key) => !Object.keys(schema.paths).includes(key)
    );
    return `Invalid keys in Map: ${invalidKeys.join(", ")}. Allowed keys are: ${Object.keys(
      schema.paths
    ).join(", ")}`;
  };
};

module.exports = { mapKeysValidator, mapKeysErrorMessage };