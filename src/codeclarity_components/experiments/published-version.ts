import type { InjectionKey, Ref } from "vue";

import type { PublishedVersion } from "./experiment.entity";

/** The Published results version on screen, null while nothing is published. */
export const SELECTED_PUBLISHED_VERSION: InjectionKey<
  Readonly<Ref<PublishedVersion | null>>
> = Symbol("selectedPublishedVersion");
