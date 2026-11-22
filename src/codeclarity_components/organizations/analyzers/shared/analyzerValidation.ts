export const analyzerValidationRules = {
  name: {
    minLength: 5,
    errorMessage: "Please enter a name (minimum 5 characters)",
    // The API stores at most 25 characters.
    maxLength: 25,
    maxLengthMessage: "Please enter a name of at most 25 characters",
  },
  description: {
    minLength: 10,
    errorMessage: "Please enter a description (minimum 10 characters)",
  },
} as const;
