import { FieldContextKey, type PrivateFieldContext } from "vee-validate";
import { computed, type ComputedRef, inject } from "vue";
import { FORM_ITEM_INJECTION_KEY } from "./injectionKeys";

/** The ids and validation state of the enclosing form field. */
export interface FormFieldState {
  id: string | undefined;
  name: PrivateFieldContext["name"];
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
  valid: ComputedRef<boolean>;
  isDirty: ComputedRef<boolean>;
  isTouched: ComputedRef<boolean>;
  error: PrivateFieldContext["errorMessage"];
}

export function useFormField(): FormFieldState {
  const fieldContext = inject(FieldContextKey);
  const fieldItemContext = inject(FORM_ITEM_INJECTION_KEY);

  if (!fieldContext)
    throw new Error("useFormField should be used within <FormField>");

  const { name, errorMessage: error, meta } = fieldContext;
  const id = fieldItemContext;

  const fieldState = {
    valid: computed(() => meta.valid),
    isDirty: computed(() => meta.dirty),
    isTouched: computed(() => meta.touched),
    error,
  };

  return {
    id,
    name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
}
