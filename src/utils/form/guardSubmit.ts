import type { Ref } from "vue";

/**
 * Wraps a vee-validate submit handler so a second submit while the first one
 * is still validating or sending does nothing.
 */
export function guardSubmit(
  isSubmitting: Readonly<Ref<boolean>>,
  submit: (event?: Event) => Promise<unknown>,
): (event?: Event) => void {
  return (event?: Event): void => {
    if (isSubmitting.value) {
      event?.preventDefault();
      return;
    }
    void submit(event);
  };
}
