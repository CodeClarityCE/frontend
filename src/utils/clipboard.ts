import { logger } from "@/utils/logger";
import { errorToast } from "@/utils/toasts";

const COPY_FAILED_MESSAGE =
  "Couldn't copy. Select the text and copy it yourself.";

// Copies text to the clipboard. Never throws: when the browser refuses,
// it tells the user and resolves false, logging locally at debug only.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    logger.debug("Clipboard write refused", { error: String(error) });
    errorToast(COPY_FAILED_MESSAGE);
    return false;
  }
}
