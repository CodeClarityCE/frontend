# shadcn-vue components

The components in `ui/` started as copies of [shadcn-vue](https://shadcn-vue.com) (style `new-york-v4`) and are now ours. Upstream is a reference we pull improvements from, not a copy we keep identical. Last refreshed against shadcn-vue 2.9.0 (registry of 2026-11-15).

Never run `shadcn-vue add --overwrite` on its own: it replaces files and drops the local changes listed below.

## Adding a component

Add one only when it replaces something built by hand or a screen needs it now. Then:

1. `shadcn-vue add <name>`, or copy the files from `https://shadcn-vue.com/r/styles/new-york-v4/<name>.json`. Raw registry files import `cn` from `"cn"` and other components from `@/registry/new-york-v4/ui/`; point them at `@/shadcn/lib/utils` and `@/shadcn/ui/`.
2. Apply the token rules below and run Prettier.
3. Check it with axe in the e2e suite.

## Refreshing

1. On a branch, overwrite every component with the upstream files, then run Prettier.
2. Read `git diff` hunk by hunk. Keep upstream fixes (new props, `data-slot`, ARIA). Put back each local change below.
3. Run `vue-tsc`, `vitest` and the Playwright suite; its screenshots must not change.

## Token rules

These apply to every component, including new ones.

- Controls (input, textarea, select trigger, checkbox, switch) use `shadow-card`, where upstream has `shadow-xs` or `shadow-sm`.
- Floating surfaces (dialog, sheet, popover, dropdown, select list, toast) use `shadow-raised`, where upstream has `shadow-md` or `shadow-lg`.
- Dialogs use `rounded-card`; text inputs and the select trigger use `rounded-control`.
- Focus rings are `ring-2` in solid `ring-ring`. Upstream's `ring-3 ring-ring/50` is too faint for 3:1 contrast. No `focus-visible:border-ring` either.
- No `aria-invalid:` styles and no `text-base md:text-sm` on controls yet. Both change how forms look; adopt them in their own change.
- Size classes a caller may override (`h-9`, `max-w-lg`) stay unprefixed. `tailwind-merge` cannot replace `data-[size=default]:h-9` or `sm:max-w-lg` with a caller's `h-8` or `max-w-3xl`.

## Local changes to upstream

| Component            | What we changed                                                                                                                             | Why                                                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| button               | Pill radius (`rounded-button`), semibold text, our variant colours and sizes, `shadow-primary`, ring with offset, `arrow` prop              | The landing page's button shape and its call-to-action arrow                                                               |
| badge                | Older look kept (`rounded-md`, `font-semibold`, `px-2.5`)                                                                                   | Upstream's pill badges would change every page                                                                             |
| card                 | Padding on each part (`p-6`, `p-6 pt-0`); no `CardAction`                                                                                   | 13 call sites set their own padding and break with upstream's `py-6 gap-6` layout. `CardAction` needs that layout          |
| checkbox             | `border-muted-foreground`, square `rounded-sm`, ring with offset                                                                            | 3:1 boundary against the page                                                                                              |
| radio-group          | `border-input`, checked border and check icon in `foreground`, `gap-2`                                                                      | 3:1 boundary in `foreground`, where upstream uses `primary`                                                                |
| switch               | Upstream's older size (`h-5 w-9`)                                                                                                           | Upstream's smaller switch would change forms                                                                               |
| input, textarea      | `rounded-control`; input keeps `flex` and the plain `file:` styles; textarea keeps a fixed `min-h-[60px]`, not `field-sizing-content`       | Without `flex` the input sits on the text baseline and forms shift; textareas don't grow on their own                      |
| alert                | Older classes kept                                                                                                                          | Upstream's `text-muted-foreground` description fails contrast, worst on destructive alerts                                 |
| alert-dialog         | Same box, gaps and title as `dialog`; `Cancel` has no extra `mt-2`; `data-slot` on `Action` and `Cancel`                                    | Confirmations look like the other dialogs                                                                                  |
| accordion            | Trigger centres its chevron; last item keeps its border                                                                                     | Upstream's `items-start` and `last:border-b-0` move FAQ lists                                                              |
| dialog               | `max-w-lg` without `sm:`; close button `size-6`; title `tracking-tight`; header and footer gaps kept                                        | Callers widen dialogs with `max-w-*`; the close button needs a 24px target for axe                                         |
| form                 | `FormItem` keeps `space-y-2`; `FormMessage` keeps `text-[0.8rem] font-medium`                                                               | Upstream's spacing moves every form                                                                                        |
| select               | `SelectContent` marks the page `inert` while the list is open                                                                               | Reka only sets `aria-hidden`; axe fails while the page behind stays focusable                                              |
| select               | Trigger keeps `w-full`, `truncate` and a plain `h-9`; `SelectGroup` keeps its `class` prop and padding; `SelectLabel` keeps `font-semibold` | Upstream's `w-fit` trigger would resize every form                                                                         |
| skeleton             | `bg-border`, no pulse under reduced motion                                                                                                  | Visible on white; respects reduced motion                                                                                  |
| sidebar              | Desktop column is `md:flex` and painted like the sidebar                                                                                    | The column reaches the bottom of long pages                                                                                |
| sonner               | Our toast classes with `shadow-raised`                                                                                                      | Kept our tokens over upstream's CSS variables                                                                              |
| tooltip              | `bg-primary` style, no arrow; provider keeps Reka's delay                                                                                   | Upstream's dark tooltips with no delay would change every page                                                             |
| toggle, toggle-group | Token rules only                                                                                                                            | Callers pass `:spacing` above 0 to keep their own rounded items, and `:roving-focus="false"` to keep one Tab stop per item |
| tabs                 | Older classes kept                                                                                                                          | Upstream's `w-fit` list and stretched triggers change page layout                                                          |
| table                | Cells wrap; headers stay `text-muted-foreground`                                                                                            | Upstream's `whitespace-nowrap` breaks long text columns                                                                    |
| label                | Inline label, not `flex gap-2`                                                                                                              | Upstream's `flex` label is a block box and would move labels laid out inline                                               |
| kbd                  | `data-slot="kbd"` added                                                                                                                     | Upstream's `Kbd` has none, unlike `KbdGroup`                                                                               |
| native-select        | `wrapperClass` prop; `defineModel` instead of a passive `useVModel`; `ChevronDown` icon                                                     | The wrapper holds the width; the parent sees a change in the same tick; the test icon mock knows `ChevronDown`             |
| command              | Palette has `shadow-raised` and a `size-5` search icon; input row has no fixed `h-9`; item icons keep their colour                          | Keeps the palette as it was                                                                                                |

`form` stays on vee-validate. Upstream no longer develops it and recommends `field`. New forms use `field` once it is added; the existing forms move separately.
