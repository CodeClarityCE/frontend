import { toast } from "vue-sonner";

// Shows a short success message in the app's sonner toaster.
export function successToast(text: string): void {
  toast.success(text, { duration: 2000 });
}

// Shows a short error message in the app's sonner toaster.
export function errorToast(text: string): void {
  toast.error(text, { duration: 2000 });
}
