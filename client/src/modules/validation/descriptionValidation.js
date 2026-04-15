/**
 * Validates a description field.
 * Rules:
 * - Required
 * - At least 10 words
 * - Maximum 500 characters
 *
 * @param {string} description - The description to validate
 * @returns {{ isValid: boolean, errorMessage: string }}
 */
export const validateDescription = (description) => {
  // Handle null, undefined, or non-string
  if (!description || typeof description !== "string") {
    return { isValid: false, errorMessage: "Description is required" };
  }

  const trimmed = description.trim();

  // Empty check
  if (trimmed === "") {
    return { isValid: false, errorMessage: "Description is required" };
  }

  // Count words: split by whitespace, filter out empty strings
  const words = trimmed.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  if (wordCount < 10) {
    return {
      isValid: false,
      errorMessage: `Description must be at least 10 words long (currently ${wordCount} word${wordCount === 1 ? "" : "s"})`
    };
  }

  // Max 500 characters
  if (trimmed.length > 500) {
    return {
      isValid: false,
      errorMessage: `Description cannot exceed 500 characters (currently ${trimmed.length})`
    };
  }

  // All good
  return { isValid: true, errorMessage: "" };
};
