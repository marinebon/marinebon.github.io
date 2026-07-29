# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

This is the Marine Biodiversity Observation Network (MBON) website: a **Hugo**
static site. Content is Markdown with YAML front matter, data is YAML, styling is
plain CSS tokens. Published to GitHub Pages at `marinebon/marinebon.github.io` on
every push to `main`, served at **https://marinebon.org/** (org site, custom domain
set in the repo's Pages settings). `README.md` is the contributor-facing guide and is
the source of truth for the contribution flow — read it for anything user-facing.

This repo was `marinebon/hugo2` (served at `marinebon.org/hugo2/`) until the
2026-07-29 cutover; the site it replaced is archived at
`marinebon/marinebon.github.io_hugo-2026-07-28`. Anything in `_claude/` that talks
about a `/hugo2/` base path predates that — **the site now serves at the root**.

## Commands

```bash
hugo server                  # live-reloading preview at http://localhost:1313
hugo --gc --minify           # production build into ./public (what CI runs)
npx --yes pagefind --site public   # build the search index over the built site
python3 scripts/check_links.py public   # fail on any broken internal link (CI runs this)
./scripts/reindex.sh         # rebuild the LOCAL search index so hugo server's /search/ isn't stale
```

**Search is a build step, not live.** `hugo server` serves the Pagefind index from
`static/pagefind/` (git-ignored) and never rebuilds it, so `/search/` goes stale as
content changes — `scripts/reindex.sh` runs `hugo --gc --minify` → `pagefind` → copies
`public/pagefind` into `static/pagefind/`. Search meta (`type`/`badge`/`image`/`related`)
is emitted per page by `baseof.html`; grouping/cards live in `layouts/search.html`.

Requires Hugo **extended** ≥ 0.163 (CI pins `HUGO_VERSION: 0.163.3` in
`.github/workflows/deploy.yml`). There is no test suite; the build is the check —
`hugo --gc --minify` must exit 0 and not leak unintended files into `public/`,
and `check_links.py` must exit 0.

CI builds with `--baseURL "${{ steps.pages.outputs.base_url }}/"`, which is now the
**root** `https://marinebon.org/` — so the local default `baseURL` matches production
and a subpath build is no longer needed to catch base-path bugs. Keep the `relURL`
discipline below anyway: it is what makes the site portable across base paths (it is
why this repo could be served at `/hugo2/` and then moved to `/` without touching a
single link), and a preview deploy under a subpath would regress silently otherwise.
Check with `hugo --gc --minify --baseURL "https://example.org/sub/"` if you change
link plumbing.

Python helper scripts use only `pyyaml` + stdlib:

```bash
python3 scripts/import_papers.py     # regenerate content/papers/*.md
                                     # from a Hugo-Academic source tree
# build one content file from issue-form JSON (what the workflow runs):
ISSUE_JSON='{"title":"…","tags_topic":"Research"}' CONTENT_TYPE=news ISSUE_NUMBER=0 \
  python3 scripts/issue_to_content.py
# (re)generate the Datasets catalog: content/datasets/*.md from OBIS/GBIF/EDI/ERDDAP
python3 scripts/harvest_datasets.py --clean        # add --dry-run to preview
```

## Architecture

Standard Hugo layout: `content/<section>/*.md` (one file per item) → rendered by
`layouts/<section>/{list,single}.html` → styled by `static/css/styles.css`.
Structured data lives in `data/*.yaml`; client behavior in `static/js/` (globe,
methods hotspots, tools/papers filters). `hugo.yaml` holds the menu, hero text,
and `params.github_repo` (which backs the contribution links).

The top nav collapses the three output catalogs under one **Products** item
(`content/products/_index.md` + `layouts/products/list.html`) whose dropdown holds
Papers / Datasets / Tools. Products is a hub, **not** a content type: it owns no
regular pages, so it never appears as a `.Type`, a card, a tag, or a search group —
search still groups results as Papers / Datasets / Tools. `header.html` keeps the
Products link lit whenever `.Section` is one of those three.

Two things require reading multiple files to understand:

### Tags, content type, and `related:` links

**Three separate mechanisms — keep them apart (conflating them caused a lot of churn):**

1. **Content type = structural.** A page's type is the section it lives in (`.Type` ∈
   network, working-groups, methods, tools, datasets, papers, news, events) — it drives the
   layout, card, and URL. It is **not** a tag (there is no `type.*`), and `/tags` does not
   list it (the top nav / section index pages cover that).

2. **Tags = faceted labels for filter & search only.** Written `facet.Value` in
   `ProperCase` (e.g. `method.Remote-Sensing`, `tool.Portal`, `place.US`, `portal.OBIS`,
   `topic.Research`, `year.2021`). The **filter/search UI derives itself from the tags
   actually present** (see the unified control below) — `data/tags.yaml` no longer drives
   *which* buttons exist; it now supplies only **friendly labels** (`values`/`aliases`, so
   `org.GEOBON` → "GEO BON") and, via `--facet-<facet>` CSS tokens, **colors**. Both have
   automatic fallbacks: an unregistered value is humanized, an untokened facet is
   auto-colored. `layouts/partials/tag.html` resolves labels **case-insensitively** (Hugo
   lowercases taxonomy terms). Only two `role`s: `subtype` (`tool.*`) and `attribute`
   (everything else). **`org` = who *built* a tool (developer); `portal` = whose *data* a
   tool uses / where a dataset is served (OBIS/GBIF/EDI/ERDDAP).** **OBIS is a portal, not
   an org.** Prefer a specific facet over a vague one (no `topic.*` duplicating a
   `method`/`place`); `topic` stays flat — no hierarchy. The `content` facet
   (Tools/Papers/Datasets/News/…) is the content *type* exposed as a search filter — it is
   the one facet with no front-matter tags; `baseof.html` emits it as the Pagefind filter
   `content:<section>`.

3. **`related:` = page-to-page links.** A front-matter list of **content-page paths**
   (e.g. `related: [/working-groups/indicators, /network/pole-to-pole-americas]`). This —
   not a tag — is how you link to one *specific* page. Do **not** invent a tag that mirrors
   a page slug (the old `node.*` facet was retired for exactly this).

**Interlinking is all build-time; nothing is baked into content.**
- **Clickable chips** — `tag.html` renders a `<span>` for a string arg (safe inside card
  `<a>`s) or an `<a>` to the term page for `(dict "value" . "link" true)`; single-page tag
  lists use the linked form.
- **Related section** — `layouts/partials/related.html` (on every single template) builds
  "Related across the network" from, in order: (1) the page's curated `related:` pages,
  (2) **backlinks** — pages whose `related:` points *at* this page (declare a link once,
  both ends show it, so a referenced page becomes a hub), (3) a weighted shared-tag
  fallback (generic `year`/`tool`/`place.Global` ignored; an `org`/`portal` overlap counts
  3×). Dedup by `.RelPermalink`, cap 6. Pass `(dict "page" . "excludeSection" true …)` to
  drop same-type tag matches (network nodes do this — "Connected nodes" already lists other
  nodes). The whole related section (and the network "Connected nodes" section) carries
  `data-pagefind-ignore` — a page's links to *other* pages are not its own content, so they
  must not leak into search (otherwise e.g. `tools/onmsr` matched "seascape" via a linked card).
- **/tags index** (`layouts/tags/terms.html`) is one flat list of tag facets, built from
  the live taxonomy terms (`.Data.Terms.Alphabetical`, bucketed by the prefix before `.`)
  with usage counts. No content-type or "references" rows.
- **Portal hub** — a portal tool page (`tools/single.html`, tagged `tool.Portal`) shows "N
  datasets available via <CODE>" → `/datasets/?portal=<CODE>`, and each **dataset page** links
  its portals (from `sources[]`) back to the tool page; with `related:` backlinks,
  `tools/obis` is the single "everything OBIS" hub.
- **Network nodes carry `place.*`** so their page's related section surfaces the region's
  datasets/tools/news; content that *belongs to* a node uses `related: /network/<node>`
  (e.g. the Pole-to-Pole news + atlas ↔ `network/pole-to-pole-americas`).

**Adding a new tag value just works** — it appears in the filter dropdown and search
automatically (the UI derives options from the tags in use), humanized if unregistered
and auto-colored if its facet has no token. Register it only to *improve* presentation:
add a `values`/`aliases` entry in `data/tags.yaml` for a friendly label, a
`--facet-<facet>` token in `static/css/tokens/colors.css` for a specific color, and the
human label to the matching `.github/ISSUE_TEMPLATE/add-*.yml` `options:` so the issue
form offers it (if it doesn't kebab-case cleanly to its `Value`, also add it to
`TAG_ALIASES` in `scripts/issue_to_content.py`). **A `related:` link needs no registry** —
it's just a content path; the issue forms expose it via a "Related pages" field (parsed by
`collect_related` in `issue_to_content.py`).

### The unified filter + search control

One control — `layouts/partials/tag-filter.html` + `static/js/tag-filter.js` — powers
both the list-page filters (Tools/Papers/Datasets) and `/search/`. It is a single row
(free-text box + a "Filter by tag" dropdown of colorized pills grouped by facet) with a
second row of removable chips; **every tag and the free text are combined with AND**
(both across facets and within one facet — Pagefind's array default, matched by the DOM
engine). Two backends, one UI:
- **`mode: dom`** (list pages) show/hides the page's server-rendered `[data-filter-item]`
  cards by AND-matching `data-tags`; free text is a substring match. Grid stays
  server-rendered (SEO / no-JS safe). Dropdown lists only tags present on that page.
- **`mode: pagefind`** (`/search/`) queries Pagefind across all content and renders result
  cards; dropdown is populated from `pf.filters()` (all site tags + the `content` facet).

Nothing is hardcoded: facet **order** comes from `data/tags.yaml` order (JS appends any
extra facet found only in content); facet **color** is `--facet-<facet>` or an
auto-generated deterministic HSL; value **labels** come from the registry or are
humanized. So a brand-new tag or even a brand-new facet renders correctly with zero code
edits. Deep links `?<facet>=v1,v2` and `?q=` pre-select and are written back for
shareable filtered views. This replaced three near-identical filter engines
(`filter.js`/`tools-filter.js`/`papers-filter.js`, now deleted).

### Grouped list pages (Tools / Papers / Datasets)

The three catalogs are **grouped under headings by one facet** — Tools by `tool.*`
(Portal first, then A→Z), Papers by `year.*` (newest first), Datasets by `portal.*`
(OBIS first, then A→Z) — with items **alphabetical by title** inside each group. Three
partials do it, all facet-agnostic, so pointing a fourth list at a different facet is a
one-line change:
- `tag-groups.html` **returns** the ordered buckets (`{value,label,id,pages}`) for
  `(dict "pages" … "facet" … "first" … "reverse" … "otherLabel" …)`. A page carrying
  **several values of the facet appears in every bucket** — Sanctuary Watch is both a
  Portal and an Infographic, and ~34 datasets are in both OBIS and GBIF. Pages with no
  value of the facet fall into a trailing bucket (papers → "Undated"), so nothing drops
  off the page.
- `tag-group-head.html` renders the heading (facet-tinted rule, live count).
- `tag-pills.html` renders the quick-filter pill row under the search bar.
- `tag-label.html` resolves one `facet.value` to its friendly registry label and is now
  the single source for that lookup (`tag.html` calls it too).

Because a page can repeat, each `[data-filter-item]` carries `data-filter-key`
(its `.RelPermalink`) and the JS tallies **distinct keys** — "49 tools", not 51 cards.
Quick pills share the selection state of the dropdown chips and the `?facet=value` deep
link (click toggles; counts and `is-active` follow the filter), and when the grouping
facet is filtered, **only the chosen groups' sections stay visible** — otherwise picking
"Infographic" would still show a "Portal" heading for a tool that is both.

### The contribution pipeline (no-Git path)

```
Issue Form → content-from-issue.yml → scripts/issue_to_content.py → Pull Request → merge → deploy.yml
```

A contributor opens an issue from a template (or the "+ Add …" buttons / "Suggest
an edit" bar that `layouts/_default/baseof.html` injects). The workflow runs
`issue_to_content.py`, which builds one `content/<section>/*.md` (+ any image under
`static/img/<section>/`), maps dropdown labels to `facet.Value` tags, and for
papers resolves a DOI via Crossref. It opens a PR on a stable branch
`content/<type>-issue-<n>` — editing the issue re-runs and updates the same PR.

### Type-aware cards

`layouts/partials/card.html` is a dispatcher that renders the right card for a
Page by `.Type`: news (`card-news`, month/year badge over banner), events
(`card-event`, date), papers (`card-paper`, year badge over a placeholder),
datasets (`card-dataset`, portal-tinted placeholder + record count), everything
else (`card-tool`, generic image card). Any mixed-content list should call
`card.html` so each result keeps its section's treatment. The tag term page
`layouts/_default/taxonomy.html` uses it, grouping a tag's results by type.

### The Datasets catalog (harvested datasets)

The **Datasets** nav item (`content/datasets/`, type `datasets`, rendered by
`layouts/datasets/{list,single}.html`) is an auto-generated catalog of marine
biodiversity datasets — *not* hand-edited or issue-form contributed.
`scripts/harvest_datasets.py` (pyyaml + stdlib) discovers MBON datasets via GBIF
`dataset/search?q=MBON`, then cross-lists each across **OBIS / GBIF / EDI / ERDDAP**
and writes one `content/datasets/<slug>.md` per dataset (front matter: `records`,
`doi`, `sources[]`, `portal_primary`, `tags`, optional `extent`/temporal).

Two rules encoded there: **OBIS-first** — when a dataset is mirrored in both OBIS
and GBIF, the OBIS record is canonical (richer Darwin Core + QA/QC), GBIF is a
secondary "also in" link; and an **MBON-relevance gate** — a candidate is kept
only if it carries an MBON text signal *or* is served by the MBON IPT
(`ipt.iobis.org/mbon`); being merely in the GBIF "OBIS network" is **not** enough
(that's all ~3,400 OBIS datasets, which admits noise). ERDDAP discovery is a
stdlib re-implementation of `erddapy.multiple_server_search` over the
awesome-erddap registry. The new `portal` facet (OBIS/GBIF/EDI/ERDDAP) lives in
`data/tags.yaml` like any other; since datasets are harvested, it needs no
issue-template counterpart. `datasets/list` uses the unified tag filter and is
grouped by portal (see above), and each dataset page emits `schema.org/Dataset`
JSON-LD for Google Dataset Search.

Search (`layouts/search.html`, Pagefind) renders the same type-aware cards in JS.
`baseof.html` emits per-page Pagefind meta (`type`, `badge`, `image`) as **one
non-empty element per key** wrapped in `data-pagefind-ignore`: empty elements get
dropped by the minifier, a single comma-joined attribute isn't split into keys by
Pagefind, and without `-ignore` the hidden values leak into result excerpts.

## Conventions & gotchas

- **`url:` is reserved** by Hugo (permalink); papers use `paper_url:`, events use
  `event_url:` for external links.
- **Upcoming events** depend on `buildFuture: true` in `hugo.yaml` — future-dated
  content is otherwise skipped. Events split Upcoming/Past by `date`.
- Front-matter image paths are relative to `static/`, e.g. `banner: img/news/x.jpg`.
- Adding a `content/network/*.md` with `lat`/`lng` auto-adds a globe node
  (`globe.js` reads nodes emitted by `layouts/partials/globe.html`).
- Markdown allows raw HTML (`unsafe: true` in `hugo.yaml`); icons are Font Awesome 6.
- **Internal links must carry the base path.** Production is the root today, so this
  costs nothing to honor and everything to skip if the site ever moves again. The trap:
  `relURL` *drops* the base path on a leading-slash string — `relURL "/methods/x/"`
  → `/methods/x/` (404s under a subpath like the old `/hugo2/`), while
  `relURL "methods/x/"` → `/sub/methods/x/`. So write `relURL` args
  **without** a leading slash, prefer
  `.RelPermalink` for pages, and keep `data/*.yaml` link values slash-free. Markdown
  links/images are safe automatically: `layouts/_default/_markup/render-{link,image}.html`
  trim a leading slash and run every internal destination through `relURL`.
  `scripts/check_links.py` enforces all of this against the built site (see Commands).
- **An `aliases:` entry silently overwrites a real page** at the same path — Hugo writes
  the redirect stub last and does not warn, and `check_links.py` still passes because
  *a* file exists there. `content/tools/_index.md` used to alias bare `/products/`;
  that clobbered the Products hub until it was removed. Before giving a new page a path,
  `grep -rn "^- /<path>/" content/`.
- All CSS is in `static/css/`: `styles.css` imports `tokens/*` then
  `components.css` + `layout.css`. Brand and `--facet-*` colors are single-source.

## Repo-only directories (not part of the Hugo build)

- `_claude/` — working notes from prior Claude sessions (`notes.md` plus dated
  session logs). Useful background on past changes; not published.
- `tools-review/` — a one-off audit of `marinebon`/`noaa-onms`/`noaa-iea` repos for
  Tools-catalog candidates (`README.md`, `inventory.csv`, screenshots). Ignored by
  Hugo; kept as repo documentation.

## Style (R/Python helpers)

The parent `/Users/bbest/Github/CLAUDE.md` applies: 2-space indent, snake_case,
align `=` across multi-line assignments, lowercase comments.
