# svg-pdf

Converts a standalone chart SVG (from `standaloneChart()` in `base_components/charts/chart-export.ts`) into a one-page vector PDF with embedded fonts, for LaTeX workflows. It has no npm dependencies. Compression uses the browser's `CompressionStream`.

The writer was chosen over a PDF library after the supply-chain review recorded on CodeClarityCE/codeclarity-dev#71.

## Supported SVG

The writer supports only what the experiment charts emit. Anything else throws an error instead of drawing wrongly, and the chart export tests export every chart as PDF, so a new chart feature fails a test.

- **Elements:** `svg`, `g`, `text`, `line`, `rect` (`rx` and `ry` allowed), `circle` and `path`. `title` and `desc` are skipped.
- **Path commands:** `M L H V C S Q T Z`, absolute or relative. Arcs (`A`) are not supported.
- **Paint:** `fill`, `stroke`, `stroke-width`, `stroke-dasharray`, `stroke-linecap`, `stroke-linejoin`, `fill-opacity` and `stroke-opacity`. `opacity` is allowed on shapes and text, but not on `g` or on a shape that is both filled and stroked.
- **Colours:** hex, `none` and `transparent`.
- **Text:** `font-size`, `font-weight` (600 and above, or `bold`, use the bold font) and `text-anchor`. Every character needs a glyph in Liberation Sans (Latin, Greek and Cyrillic scripts); a label with any other character is refused. Kerning is not applied.
- **Not supported:** nested `svg`, transforms, gradients, clip paths, images, `tspan` and inline styles other than `font-variant-numeric: tabular-nums`.

Text is set in Type0 fonts with a ToUnicode map, so labels stay selectable and searchable. Each used font is embedded whole (no subsetting).

## Fonts

| File                               | SHA-256                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| `fonts/LiberationSans-Regular.ttf` | `76d04c18ea243f426b7de1f3ad208e927008f961dc5945e5aad352d0dfde8ee8` |
| `fonts/LiberationSans-Bold.ttf`    | `788abee4c806d660e8aee46689dd8540cd4bb98da03dcc9d171ce3efd99a9173` |

- **Version and source:** Liberation Sans 2.1.5, from `liberation-fonts-ttf-2.1.5.tar.gz` (SHA-256 `7191c669bf38899f73a2094ed00f7b800553364f90e2637010a69c0e268f25d0`), attached to the 2.1.5 release of github.com/liberationfonts/liberation-fonts.
- **Licence:** SIL Open Font License 1.1 (`fonts/LICENSE`). The OS/2 `fsType` is 0, so embedding is allowed.
- **Why this font:** its metrics match Arial and Helvetica, the figure SVG's font family, so PDF text takes the same space as in the SVG and PNG exports.
- **How fonts load:** they are fetched on the first PDF export only (`load-fonts.ts`), not bundled into page code.

## Removing it

1. Delete this directory.
2. Remove the `svg-pdf` imports, `downloadPdf()` and the "Download PDF" button from `base_components/charts/ChartExport.vue`.
3. Remove the `@/utils/svg-pdf/load-fonts` mocks and the PDF tests from `ChartExports.test.ts` and `ExperimentDetail.test.ts`.
