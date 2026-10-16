# Design system

The site follows the shared DAGO design used across dago.lt projects. It does
not have its own visual style.

## Sources of truth

- `https://dago.lt/assets/styles/reset.css` and `https://dago.lt/assets/styles/dago.css`
  (loaded in `src/routes/+layout.svelte`) own colours, type, headings, links,
  buttons (`.primary-button`, `.text-button`), tables, `details`, focus rings,
  `.sr-only` and print. Their source lives in the `dago-homepage` repository.
- `src/app.css` adds only layout and data-display rules on top. It must not
  restyle shared components or define a second set of colour or spacing
  tokens. Colours are always `hsl(var(--theme) / alpha)` or `hsl(var(--black))`.
- The closest sibling pages are the dago.lt tools (`dago-irankiai`), for
  example `tools/asmens-kodai/static-site/project.css`.

## Page anatomy

Every page uses the same column, `min(100%, 75ch)`, and the same parts:

1. Header: the lowercase title `dažniausi lietuviški žodžiai`, the dimmed `// dago` link
   and the `Žodžiai // Duomenys // Apie` navigation. The title is plain text, as
   on the dago.lt tools; `Žodžiai` in the menu is the way home. The current menu
   section is filled amber, like the selected tab on asmens kodai, with a tight
   line height so the fill stays low; research pages count as `Žodžiai`
   (`aria-current="true"`).
2. Page heading: `SectionHeading`, the `// Heading` label, followed by
   one plain sentence that says what the page answers.
3. Main tool: the homepage explorer, or `WordLookup` on research pages.
4. Results: the word as an `h2`, bars first, exact numbers in a `Lentelė`
   disclosure.
5. Disclosures: `Kaip skaityti` (units, caveats) and `Šaltinis ir licencija`
   (citation, licence, source link).
6. Footer: the inline contact line and the AI badge.

`main` is a grid with a 2rem gap; `.stack` groups a heading with its content
at 1rem. Grid gaps own the spacing, so direct children have no margins.

## Shared components

| Component | Use |
| --- | --- |
| `PageMeta` | Title, description, canonical URL and social tags for every route. |
| `SectionHeading` | The `//` section label (`h2` or `h3`). The text is full colour for contrast; only the decorative `//` is dimmed (35%). |
| `WordLookup` | Label, text input, primary button, hint and clickable example words. |
| `RateBars` | Every horizontal bar chart: labelled rows, value on the right, `Neaptikta` for missing data. |
| `TableScroll` | Wraps wide tables; becomes a focusable, labelled region only when it overflows. |
| `DataLoader`, `FrequencyDashboard`, `DataTable` | The homepage explorer. |

Research pages keep the last lookup in `?q=` (`$lib/word-query`), so a copied
link opens the same word. Only a `?q=` on load triggers a data request.

Shared CSS classes: `.stack`, `.section-head` (heading plus an action on one
line), `.note` (secondary text), `.notice` and `.notice.error` (left-ruled
messages, as in the dago.lt tools), `.facts` (label and value grid),
`.number` (right-aligned figures), `.details-body` (padding inside `details`).

## States

| State | Treatment |
| --- | --- |
| Loading | A `.note` with `role="status"`; no zero values or empty tables. |
| Empty result | A `.notice` that says what was not found and that absence is not zero. |
| Error | A `.notice.error` with `role="alert"` and a short recovery hint. |
| Search pending | The homepage shows `Ieškoma…` in place of the totals line. |

On screens up to 40rem, buttons, selects and inputs are at least 44px tall,
and text buttons at least 44px wide. Pages must never scroll horizontally; only
tables scroll inside `TableScroll`.

## Honest data display

- A chart describes the selected source and filters, never Lithuanian as a
  whole.
- Units stay explicit: pavartojimai, žodžių formos, lemos, dokumentai.
- Logarithmic axes are labelled and explained in one sentence above the chart.
- Missing measurements stay `Neaptikta`; they are never drawn as zero.
- Every chart has a table equivalent and every result set can be downloaded.
- The homepage table keeps each word's rank in the whole dataset, so a search
  does not renumber results. Charts rank within the active filters.
