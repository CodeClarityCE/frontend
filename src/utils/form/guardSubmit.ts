import type { GenericObject, SubmissionHandler } from "vee-validate";
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

/**
 * The form's submit handler, guarded like guardSubmit. It also drops a submit
 * whose values changed while it was validating, so a refused submit never
 * sends what was typed after the click.
 */
export function guardFormSubmit<
  TValues extends GenericObject,
  TOutput extends GenericObject = TValues,
>(
  form: {
    handleSubmit: (
      cb: SubmissionHandler<TValues, TOutput>,
    ) => (event?: Event) => Promise<unknown>;
    isSubmitting: Readonly<Ref<boolean>>;
    values: TValues;
  },
  onValid: SubmissionHandler<TValues, TOutput>,
): (event?: Event) => void {
  let clicked = "";
  const submit = form.handleSubmit((values, actions) => {
    if (JSON.stringify(form.values) !== clicked) return;
    return onValid(values, actions);
  });
  return guardSubmit(form.isSubmitting, (event) => {
    clicked = JSON.stringify(form.values);
    return submit(event);
  });
}
