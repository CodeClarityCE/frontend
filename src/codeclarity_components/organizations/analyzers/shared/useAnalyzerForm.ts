import { computed, type ComputedRef, type Ref, ref } from "vue";

import { analyzerValidationRules } from "./analyzerValidation";

export interface AnalyzerFormErrors {
  name?: string;
  description?: string;
}

/** Name and description of an analyzer, with errors shown once the user tried to submit. */
export function useAnalyzerForm(): {
  name: Ref<string>;
  description: Ref<string>;
  submitted: Ref<boolean>;
  errors: ComputedRef<AnalyzerFormErrors>;
  isValid: ComputedRef<boolean>;
  shownErrors: ComputedRef<AnalyzerFormErrors>;
} {
  const name = ref("");
  const description = ref("");
  const submitted = ref(false);

  const errors = computed(() => {
    const result: AnalyzerFormErrors = {};
    const { name: nameRule, description: descriptionRule } =
      analyzerValidationRules;
    if (name.value.trim().length < nameRule.minLength) {
      result.name = nameRule.errorMessage;
    }
    if (description.value.trim().length < descriptionRule.minLength) {
      result.description = descriptionRule.errorMessage;
    }
    return result;
  });

  const isValid = computed(() => Object.keys(errors.value).length === 0);
  const shownErrors = computed(() => (submitted.value ? errors.value : {}));

  return { name, description, submitted, errors, isValid, shownErrors };
}
