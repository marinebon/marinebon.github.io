
## TODO

### Update README with style

Pull relevant bits from the Claude.ai/design design system at `/Users/bbest/Downloads/MBON Design System (1)` for 

### refine **tags**

Expand and refine the use of , so they could be prefixed by type, eg method.Tracking. 

### add **people**

And add **People** as its own content type under About to similarly enable connecting with Papers and Projects / Working Groups (ie Network). We want to be able to see related content throughout website.


## 2026-07-24

Look for the email thread with subject "eDNA resources for MBON website". Note the updates Adriano (@adrianocl) implemented yesterday to add these to the Products page for the current website marinebon.org found at @../marinebon.github.io. Create similar products but type-specific in this prototype website @../hugo2. Try to create ones as similar as possible and then expand with related working group and tags with a subsequent commit to highlight the extra connectedness of this website. Draft an email response to Gabrielle and Frank demonstrating how its the same backend website and can be similarly updated. Feel free to think of it as an interim website open for further review. There's no need for announcements or fanfare. It is simply an improvement over the status quo. I am not understanding why we haven't switched over already. 

## 2026-07-10

Done. The nav is now six items, with Papers / Data / Tools collapsed into a single Products dropdown containing Papers, Datasets, and Tools — and no sub-shortcuts under Tools.

What shipped

/products/ is a real hub page (content/products/_index.md + layouts/products/list.html) with three cards whose counts come from the live sections, so they can't drift: Papers 88, Datasets 54, Tools 46. The Products nav item stays highlighted whenever you're anywhere inside those three sections, not just on the hub itself.

Data became a genuine section rename, /data/ → /datasets/: 54 content files and both layouts moved, and I updated every place the section name was load-bearing — the .Type lookups in card.html, card-kind.html, taxonomy.html, and baseof.html's Pagefind meta; the filters: keys in data/tags.yaml; the portal-hub query on tool pages; the footer; the card__type--datasets CSS rule; and OUT_DIR in harvest_datasets.py. Old /data/ now redirects to /datasets/.

Per your follow-up: search result grouping is untouched. Papers, Datasets, and Tools remain separate groups. Products owns no regular pages, so it never becomes a .Type — and its page carries data-pagefind-ignore, so it isn't indexed at all. I confirmed the built site emits exactly the nine existing type values with no products among them.

One real bug found along the way

content/tools/_index.md carried a legacy alias for bare /products/ (an old marinebon.org URL). Hugo writes alias redirects last and doesn't warn, so it silently overwrote my new hub page — and check_links.py still passed, because a file existed at that path. I removed that one alias, kept the /products/<slug>/ ones, and wrote the trap into CLAUDE.md since nothing in the build catches it.

Two things worth your call

Consolidating the nav dropped the shortcuts that used to live under Data (OBIS/GBIF/EDI/ERDDAP, "How to access") and under Tools (Apps, Infographics, Packages, Portals, Protocols, Trainings, Workflows). Those views all still exist as ?portal= / ?tool= deep links and are reachable from each list page's filter bar, but they're now two clicks from the nav instead of one. Also, only the /data/ index redirects — old /data/<slug>/ dataset URLs will 404. Say the word and I'll emit per-dataset aliases from the harvest script.

Verified with hugo --gc --minify --baseURL "https://marinebon.org/hugo2/" (exit 0), check_links.py (exit 0, 31,095 internal links), and a browser pass over the dropdown, the hub, the /data/ redirect, and ?portal=EDI filtering to 10 of 54. Nothing is committed yet.

### consolidate filters / search with text + tags drop-down

PROMPT: Looks good! Please next think deeply about consolidating the filters and search across the website
  to a much simpler interface that displays all tags (as colorized pills) in a drop-down and then
  allows adding to the selection (or clicking an x to delete individuals), all of which are joined
  by AND in the filter (not OR)
----

I now have a complete model: three byte-identical DOM filter engines (filter.js, tools-filter.js, papers-filter.js) doing OR-within-facet on server-rendered grids, plus a separate Pagefind-backed /search/ that already does AND. The consolidation is clear in shape; three decisions determine the details.

──────────────────────────────────────────────────────────────────────────────────────────────────────
←  ☐ Architecture  ☐ List-page control  ☐ Type facet  ✔ Submit  →

The list pages (Tools/Papers/Datasets) are server-rendered grids today; /search/ is Pagefind (JS-only). How should the unified filter be wired?

❯ 1. Shared UI, two backends (Recommended)  │ ONE tag-picker.js (UI + AND state)           │
  1. Everything on Pagefind                 │    ├─ list pages  → filters server-rendered  │
                                            │    │                grid via data-tags (DOM) │
                                            │    └─ /search/    → Pagefind (all content,   │
                                            │                     free text + facets)      │
                                            │                                              │
                                            │ 3 engines (filter/tools/papers) → deleted    │
                                            │ Grids stay server-rendered (SEO safe)        │
                                            └──────────────────────────────────────────────┘

Notes: To clarify, we don't want another grid of clickable tags like presently on the Tools/Datasets/Pages index pages, just a streamlined single row search with all tags available as a dropdown (NOT a grid like existing). Maybe another line showing all the selected tags.

←  ☒ Architecture  ☒ List-page control  ☒ Type facet  ✔ Submit  →

On the list pages, should the unified control also include the free-text box, or just the tag dropdown?

❯ 1. Free text + tags (Recommended) ✔
     Same control everywhere: a free-text box (client-side substring match over card title/summary) plus the tag dropdown. Matches the 'free text search plus all tags' you described, applied on every page.
  2. Tags only on list pages
     List pages get just the tag-pill dropdown + chips (no free text); free-text search stays exclusive to /search/. Slightly less code, but the control differs between list pages and search.

←  ☒ Architecture  ☒ List-page control  ☒ Type facet  ✔ Submit  →

Add content type (Tools / Papers / Datasets / News / Events / …) as a selectable facet pill in the picker?

❯ 1. Yes, add a type facet (Recommended) ✔
     Emit a Pagefind `type` filter so /search/ can narrow to one or more content types via the same pill UI — currently impossible. Gives it its own color. Makes the single picker able to answer 'only Tools tagged Genomics'.
  2. No type facet
     Keep type as display-only meta; the picker filters by the existing 6 tag facets only (method/org/place/portal/tool/topic). Content type is still visible per-result via its badge/group.

----

Clear now. Your note settles the UI: a streamlined single row (free-text + a tags dropdown), with selected tags shown as removable chips on a second line — not the always-open button grid that's there now. Backend wiring wasn't the thing you cared about, so I'll take my recommended low-risk route (keep the list grids server-rendered; share the UI). Let me verify two precision details before writing the plan.

## 2026-07-01 

Read all the messages in the Gmail thread with subject "MarineBON website redesign with spinning globe using Claude.ai/design" since I (ben@ecoquants.com) last responded.

Provide a response and plan of action that retains all the thinking and design goals of the current website. It's ok to politely object to a suggestion if well reasoned and provide an alternative. Also translate any acronyms used.

Provide a summary to the group of all the latest changes in this session with tags and interlinking (and more minor methods image updates).

You can also read Joana's attached document here: /Users/bbest/Downloads/Suggestions.docx

----

Committed 687d367 (local — not pushed, holding for your OK given the back-and-forth).

Here's where the node migration landed:

Content — all 12 regional nodes now carry the real per-node content ported from marinebon.github.io/content/bons/ (cleaned of old-site images and dead WordPress links), replacing the shared boilerplate. Front matter (coordinates, tags, banners) preserved. Verified: 0 nodes still boilerplate, build clean, check_links passes.

New US MBON umbrella node (/network/us-mbon/) — the overall program page (benefits, the list of U.S. projects linking to each node, sponsors). It's kind_node: umbrella with no map pin; I filtered the globe and node grids to kind_node == regional so it doesn't show as a pin/card, and linked it as "About the U.S. MBON program →" in the Network page's USA section.

Redirects (Tylar-style aliases) so GEO BON's links resolve into the new site — verified they generate correct /hugo2/… redirects:
- /bons/<slug>/ → the matching node for every node
- /mbon-europe/, /mbon-pole-to-pole-of-the-americas/, /us-mbon/, /bons/us-mbon/

Southeast rename: the node is already titled "Southeast US MBON" with the /bons/south-florida-mbon/ redirect. I kept the URL slug as south-florida-mbon. If you'd like the URL to be /network/southeast-mbon/ too, I can rename it (safe — nothing else references it) and add a redirect from the old path.

A couple of things I did not touch yet, from Joana's GEO BON doc (want your call before I add them):
- A /data-products/ → /data/ redirect (her "Data Products link not working" item).
- A Webinar series entry (the YouTube playlist), the Partners link target, and the Resources/NASA-projects section.

Ready to push and deploy? And do you want the Southeast URL slug renamed?



## 2026-07-01 tags portal.* -> tool.portal

Help me revise the tags system comprehensively with the express intent of inter-linking content. For any given piece of content, we want to show other pieces of content with its tag and links to its other tags (with their own pieces of content). What I have become confused by is the presence of at least 4 types of tags:

- **Content type**. For a given content type, what is the more specific type? For instance for a tool, we have tags: tool.App, tool.Infographic, tool.Package, tool.Portal, tool.Protocol, tool.Training, tool.Workflow. This allows us to categorize and filter the Tools index page (https://marinebon.org/hugo2/tools/) by tool type.

- **Content**. But then for the dataset type, I wanted to flag which portal the dataset was hosted in with portal.* tag (portal.EDI, portal.ERDDAP, portal.GBIF, portal.OBIS). At the same time I created new tools for each (tools/EDI, tools/ERDDAP, tools/GBIF, tools/OBIS) with tag tool.Portal. Now I am thinking it would be better to have not introduced the portal.* tags, and instead tag to the content (tools/EDI, tools/ERDDAP, tools/GBIF, tools/OBIS), but just because they're content does not mean they have a tag. And I would not want that to conflate with the existing tool.* tag typology.

- **Topics**. There are other tags:
  - org.*: should probably instead be connected with network content (node or partner or other)
  - place.**: not a content type, except if directly the realm of an MBON node (which is the case for most; so probably good to also tag with associated MBON networks/node)
  - topic.**: catch-all, but should exclude other content types, like methods, or allow for more detailed refinement (ie topic.eDNA is a subset of method.genomics?)

Can we update this page to a header per content type, alphabetical?
https://marinebon.org/hugo2/tags/

I'm not exactly sure how to handle all this cleanly, and also for ease of adding/editing content via Github templated issue submission.

←  ☐ Portals  ☐ /tags layout  ☐ Org/place links  ✔ Submit  →

How should the portal.* tags (portal.OBIS/GBIF/EDI/ERDDAP, on datasets) relate to the portal tool pages (tools/OBIS, tools/GBIF, …)? Datasets already carry both portal.* tags AND sources[]/portal_primary fields, so there's redundancy.

  1. Keep facet + interlink       ┌─────────────────────────────────────────────────────────┐
❯ 2. Drop tag, use fields         │ Datasets: portal.* tags REMOVED                         │
  3. Leave as-is                  │   (keep sources[]/portal_primary fields)                │
                                  │                                                         │
                                  │ Data index filter reads portal_primary                  │
                                  │   instead of a tag                                      │
                                  │                                                         │
                                  │ Dataset page links sources -> tools/<portal>            │
                                  │                                                         │
                                  │ portal no longer appears under /tags/                   │
                                  │ (portal becomes pure content-link, not a tag)           │
                                  └─────────────────────────────────────────────────────────┘

                                  Notes: But then I hope its obvious how to search for all content
                                         tagged/related to <content_type>/<content>, eg tools/obis

←  ☒ Portals  ☐ /tags layout  ☐ Org/place links  ✔ Submit  →

You asked to change the /tags index to 'a header per content type, alphabetical.' Which grouping did you mean? (Tags span multiple content types, so 'facet' is the natural axis.)

❯ 1. Group by facet               ┌─────────────────────────────────────────────────────────┐
  2. Group by content type        │ CONTENT TYPES                                           │
                                  │   Dataset   Paper                                       │
                                  │                                                         │
                                  │ TOOL TYPES                                              │
                                  │   App  Infographic  Package  Portal ...                 │
                                  │                                                         │
                                  │ METHODS                                                 │
                                  │   Acoustics  Benthic  Genomics ...                      │
                                  │                                                         │
                                  │ REGIONS   Americas  Arctic  Global ...                  │
                                  │ ORGS      FWRI  NOAA IEA  OBIS ...                      │
                                  │ PORTALS   EDI  ERDDAP  GBIF  OBIS                       │
                                  │ TOPICS    Biodiversity  EOV ...                         │
                                  │ YEARS     2021  2020  2019 ...                          │
                                  └─────────────────────────────────────────────────────────┘

                                  Notes: press n to add notes

←  ☒ Portals  ☒ /tags layout  ☒ Org/place links  ✔ Submit  →

You noted org.* should connect to Network content and place.* is usually an MBON node's realm. How far should the redesign interlink org/place tags with the Network (nodes & partners)?

  1. Entity links, no re-tag      ┌─────────────────────────────────────────────────────────┐
❯ 2. Also re-tag nodes ✔          │ content/network/.md gain org./place.*                   │
  3. Minimal                      │                                                         │
                                  │ Node page: "Datasets & tools in this                    │
                                  │   region" (by shared place/org)                         │
                                  │                                                         │
                                  │ harvest_datasets.py stamps node place                   │
                                  │                                                         │
                                  │ = systematic but bulk content changes                   │
                                  └─────────────────────────────────────────────────────────┘

                                  Notes: I do not grasp this fully, but seems like the option that
                                         connects the most related content in a sensible way. It's
                                         only that it also feels brittle in that a harvest script
                                         has to potentially re-run in future to maintain it.


**PLAN**: `2026-07-01 Harmonize the tag system around content interlinking.md`

Done. The tag system is harmonized around content interlinking, and it all builds clean (hugo exit 0, **32,785 internal links**, 0 broken, pagefind indexed). I verified the key pages live in the browser.

What changed

One documented model. Every facet in `data/tags.yaml` now carries a role that names its job, which is the distinction that was missing:
- `type` — the content type (Paper, Dataset)
- `subtype` — a finer type within one section (`tool.*`)
- `attribute` — cross-cutting axes (method, place, topic, year)
- `entity` — points at a named org/portal that has its own page (org, portal)

Interlinking, all computed at build time from tags (nothing baked in — no script re-run needed):
- Clickable chips everywhere — `tag.html` now renders an `<a>` to the **term page** on content pages, but stays a `<span>` **inside card** links (no nested-anchor bugs).
- **"Related across the network"** on every page via Hugo Related Content indexed on tags — replacing news's fake "3 newest" block.
- `/tags` grouped by facet, alphabetical, with counts (screenshotted — Content types, Tool types, Methods, Regions, Organizations, Portals, Topics, Years).
- **Portal hubs** — `tools/obis` shows "34 datasets in OBIS" → `/data/?portal=OBIS`, datasets link back to their portal's tool page, and /tags/portal.obis/ features the OBIS page. Your "everything OBIS" ask.
- Nodes re-tagged with place.*/org.* so a node page surfaces its region's datasets/tools (confirmed: U.S. · 34, Nat'l Marine Sanctuaries · 11 reflect the node tags).

Kept easy to contribute: promoted place values (Monterey-Bay, Bering-Sea, Europe, etc.) added to data/tags.yaml and the add-tool/add-news dropdowns; all kebab-case cleanly so issue_to_content.py needed no change. Docs updated in CLAUDE.md + README.md.

**One thing to review — the node → place/org mapping**

I assigned these by geography (you asked me to flag them):

┌───────────────────────────────────────────────────────┬───────────────────────────────────────┐
│                         Node                          │              Tags added               │
├───────────────────────────────────────────────────────┼───────────────────────────────────────┤
│ arctic                                                │ place.US, place.Arctic                │
├───────────────────────────────────────────────────────┼───────────────────────────────────────┤
│ asia-pacific                                          │ place.Global                          │
├───────────────────────────────────────────────────────┼───────────────────────────────────────┤
│ central-california                                    │ place.US, place.Monterey-Bay          │
├───────────────────────────────────────────────────────┼───────────────────────────────────────┤
│ coastal-new-england, great-lakes, gulf-of-maine,      │                                       │
│ mid-atlantic, northern-california-current,            │ place.US                              │
│ southern-california-bight                             │                                       │
├───────────────────────────────────────────────────────┼───────────────────────────────────────┤
│ europe                                                │ Europe, place.North-Atlantic          │
├───────────────────────────────────────────────────────┼───────────────────────────────────────┤
│ pole-to-pole-americas                                 │ Americas, place.Pole-to-Pole          │
├───────────────────────────────────────────────────────┼───────────────────────────────────────┤
│ south-florida                                         │ US, place.South-Florida,              │
│                                                       │ org.NationalMarineSanctuaries         │
└───────────────────────────────────────────────────────────────────────────────────────────────┘

The coarse place.US is what links Uatasets (which are only tagged atUS/Americas/North-Atlantic granularity). I added org only to South Florida (its content explicitly calls it a sanctuary node); the othess affiliations. Adjust any ofthese and the related sections update on the next build.

I did not commit — say the word and I'll commit just my files (leaving the _claude/ changes, which are another session's).

----

PROMPT: 
I'm noticing http://localhost:1313/methods/remote-sensing/
[View related tools](http://localhost:1313/tools) should link to the Tools page with the Remote Sensing method applied to the filter

---- 
Fixed and verified. The methods page's View related tools button now deep-links into the filtered Tools index.

What I changed:
- layouts/methods/single.html — the button href is now /hugo2/tools/?method=<Value>, where <Value> is resolved by matching the method page's slug to its data/tags.yaml value (remote-sensing → Remote-Sensing, etc. — all 7 map cleanly). Falls back to plain /tools/ if no match.
- static/js/tools-filter.js — generalized the URL pre-activation from the hardcoded ?tool= to any facet (?method=, ?place=, ?org=, ?tool=), comma-separated for multiples. ?tool=Portal still works.

Confirmed in the browser: ?method=Remote-Sensing opens Tools with the Remote Sensing button active and filtered to 3 of 46. Build exits 0 and check_links still passes (32,785 links, 0 broken).

Two small notes:
- This also means the promoted place/org values now appear as buttons in the Tools filter bar (visible in the screenshot: Pole to Pole, Europe, Arctic, Monterey Bay, Bering Sea…), so ?place=US etc. work too.
- The Network node pages have the same "View related tools" button still pointing at bare /tools. I left it alone since you only mentioned methods — but I can point it at ?place=<node place> the same way if you'd like that consistency.

----

PROMPT: I'm not understanding http://localhost:1313/tools/gbif/ and how it shows OBIS datasets or for that matter how http://localhost:1313/data/?portal=GBIF shows so many OBIS datasets. Or why at /tools/gbif we see all these "Related across the network" -- is that because they also have a "Portal" tag? Maybe we should limit instead to those only with the given tag? Then there are News items listed there that do not show any common tags, but maybe have GBIF in text?

----

Here's what was going on, and what I changed.

The three things you noticed

1. **GBIF views showing "OBIS" datasets — correct, by design**. Of the 38 datasets tagged portal.GBIF, 34 also live in OBIS and only 4 are GBIF-only. The documented OBIS-first rule makes a mirrored dataset's canonical portal OBIS, so its card badge reads "OBIS" — but it genuinely is in GBIF too (it lists both under "Available in"). So "38 datasets in GBIF" and /data/?portal=GBIF are truthful; the badge just shows each dataset's canonical home. This reflects that MBON's GBIF presence is largely a mirror of OBIS-canonical data. I left this as-is since it's the intended catalog behavior — but happy to relabel (e.g. "38 datasets available via GBIF — 34 also in OBIS") if you'd like it spelled out.

2. **The noisy "Related across the network" — real problem, now fixed**. You were exactly right. tools/gbif has only two tags, `tool.Portal` and `place.Global`, both generic — so relatedness matched everything that was a Portal or Global, including News that merely shared place.Global.

3. News with "no common tags" — they did share one: `place.Global`. Related content is purely tag-based (never text), so nothing was matching "GBIF in the text" — it was the Global overlap.

The fix

I reworked `layouts/partials/related.html` to rank by shared specific tags and ignore generic ones:
- whole facets type.* (same kind ≠ related), year.* (same year ≠ related), tool.* (subtype)
- the single value place.Global

Relatedness now means a real method / place / topic / org / portal overlap. Verified:
- `tools/gbif` → no related section at all (its only tags are generic — correctly nothing specifically relates to it). Page now ends at "38 datasets in GBIF".
- `tools/obis` → relates to OBIS-org tools (bio-data-guide, obisindicators, biotrack-portal, pole-to-pole-atlas…) via shared org.OBIS — because OBIS is tagged as an org across content and GBIF isn't. That asymmetry is honest.
- `papers` → relate via shared method.*.

I also dropped the now-unused Hugo related: config from hugo.yaml and updated the CLAUDE.md note. Build exits 0, check_links passes (32,496 links, 0 broken), build still ~390ms.

One consequence worth confirming you're happy with: a page whose only overlaps are generic now shows no related section rather than a padded-out one. I think that's the right call (better empty than misleading), but if you'd prefer it to always show something, I can add a generic fallback.

----

PROMPT: yes, the relabel is helpful: "38 datasets available via GBIF — 34 also in OBIS (preferred)". The Related section seems better. Some tags are not showing, like in the first Related result of `tools/obis` "MBON Pole to Pole Data Atlas" does not show the "OBIS" tag (so it's not obvious that's why it's the top pick)

----

Both done and verified.

1. Portal hub relabel (layouts/tools/single.html) — the heading now reads:
- tools/gbif → "38 datasets available via GBIF — 34 also in OBIS (preferred)"
- tools/edi → "10 datasets available via EDI", tools/erddap → "6 datasets available via ERDDAP" (neither is mirrored to OBIS, so no suffix)
- tools/obis → "34 datasets available via OBIS" (no self-referential suffix)

The "N also in OBIS (preferred)" count is computed per portal (datasets carrying both portal.<X> and portal.OBIS), so it stays correct as the catalog changes.

2. Shared tag now visible on related cards — the culprit was cards truncating to first 3 tags while org.OBIS sat 4th in pole-to-pole-atlas's front matter. I bumped card-tool, card-dataset, and card-paper to first 4. Tools carry at most 4 tags (so all show now), and datasets sort tags alphabetically so portal.*/entity tags land within the first four. Confirmed: the Pole to Pole card now shows Protocol · Benthic · Americas · OBIS.

Build exits 0, check_links passes.

One small note on that second fix: it's a global card change, so every index card (Tools, Papers, Datasets, taxonomy pages) now shows up to 4 tags instead of 3 — slightly more informative, and I checked it doesn't overflow since those sections cap at 4–5 tags. If you'd rather keep other indexes at 3 and only widen the related cards, I can special-case it, but showing the 4th tag everywhere seemed like the simpler win.

----

PROMPT:  For http://localhost:1313/news/sea-of-cortez-fieldwork/ with tag "Pole to Pole", why does http://localhost:1313/network/pole-to-pole-americas/ also with tag "Pole to Pole" not show in Related? As a network/node, it should also have higher rank.

Also http://localhost:1313/tools/pole-to-pole-atlas/ should have "Pole to Pole" tagged.

But in actuality, now that I think about it, "Pole to Pole" without explicit reference to the node or tool just means "Global" which we already have, so this tag should be replaced with "Americas" (since pole to pole across the Americas) and old content should probably be tagged with network/pole-to-pole-americas.

----

All done and verified. Here's the resolution to everything you raised.

The diagnosis

The node was sharing place.Pole-to-Pole with the news item, but it tied at 1 shared tag against ~24 method.Genomics matches and got crowded out of the top 6. And you're right that place.Pole-to-Pole was a vague tag — it meant "Global or Americas," not a real place.

What I changed (your model, implemented)

Retired place.Pole-to-Pole → place.Americas everywhere (4 files), and removed it from tags.yaml and the issue-form dropdowns. Zero references remain.

Added a node entity facet — the natural completion of the entity pattern (org→tool, portal→tool, now node→network). node.Pole-to-Pole-Americas resolves to network/pole-to-pole-americas via the facet's entity_section. It gets its own rose color, shows on the /tags index under "MBON nodes," and its term page features the node.

Tagged the Pole-to-Pole content with node.Pole-to-Pole-Americas: the three news posts, the atlas tool, and the node itself (self-tagged so it interlinks both ways).

Weighted entity overlaps 3× in Related — sharing an org/portal/node ("same OBIS / same node") now counts triple, so a referenced node/org/portal ranks above generic method/place matches. This is why the node now appears, and why sea-of-cortez's Related is now a tight cluster of Pole-to-Pole content (atlas, both news posts, and the node page) instead of scattered genomics hits.

Made the node visible on the content — reordered the news front matter so the node.Pole-to-Pole-Americas chip leads the banner and the news card (the rose "Pole to Pole Americas" chip you saw).

Build exits 0, check_links passes, node term page lists all 5 items.

Two things worth your call

- The node isn't strictly first in Related — it's tied at the top score group with the other Pole-to-Pole content (atlas/news), so it lands ~4th among equals. If you want the referenced node itself pinned to the very front, I can special-case entity pages to lead. I left it as "in the top group" since that already fixes the "crowded out" problem.
- Other nodes now have the machinery but no node.*-tagged content yet. As you tag content to a node (via node.<Node> in the advanced-tags field, or I can wire per-node dropdowns into the issue forms), those nodes light up the same way. The node↔content links are all build-time, so no harvest re-run needed.

----

But I don't see the Genomics tag in this News post http://localhost:1313/news/sea-of-cortez-fieldwork/? I am also unclear how it gets this "Pole to Pole Americas" tag given it's actual tags in `@./content/news/sea-of-cortez-fieldwork.md`:
```yaml
tags:
- place.Pole-to-Pole
- method.Genomics
- topic.Fieldwork
```
I am confused by http://localhost:1313/tags/. Shouldn't "Content types" list beyond just "Dataset" and "Paper" all types under `@./content/` so also "Event", "Method", "Node" (`@./network/*`), "News", "Tool", "Working Group"? And "Pole to Pole Americas" is one of many Nodes (listed under `@./network/*`)? Think hard about this and be rigorous in the critical thinking  and organization, also in CLAUDE.md to yourself and README.md to others.

----

The news fix is done (all singles now render every tag). The /tags question exposes a genuine conceptual gap worth fixing rigorously. Let me verify the type-tag format before restructuring.

Confirmed safe: type.* tags are purely on papers/datasets, and search's type grouping uses the structural .Type meta (not the tag).

Here's my rigorous read of the problem: there are two orthogonal systems that got conflated. (1) Content type is structural — every page lives in exactly one section (.Type); there are 8. (2) Tags are applied descriptors/references. The type.* "facet" was a half-measure that duplicated the structural type as a tag, but only for 2 of 8 types — which is exactly why /tags "Content types" showed only Dataset & Paper. And "MBON nodes" as a tag facet lists nodes referenced by content (like org/portal), not all nodes — all nodes live structurally under the network section.

So: retire the redundant type.* tag, make /tags "Content types" structural (all 8, linking to section pages), and organize the rest into descriptive tags vs reference tags. Executing:

Three "nodate" papers now have an empty tags: (they had only type.Paper). That's valid YAML (null) but let me handle it cleanly. First, let me see the tail of tags.yaml and those papers.

----

The only remaining type references are a dormant .tag--type CSS class (like the existing .tag--region/.tag--tool legacy aliases) — harmless, and --facet-type is still used by .tag--tool. Everything else is clean.

Done — and here's the rigorous model that resolves the confusion

Your confusion pointed at a real conflation. There are two orthogonal classification systems, and the old design blurred them:

┌─────────┬──────────────────────────────────────────────────────────┬──────────────────────────┐
│         │                       Content type                       │           Tags           │
├─────────┼──────────────────────────────────────────────────────────┼──────────────────────────┤
│ Nature  │ Structural — the section a page lives in                 │ Applied labels           │
│         │                                                          │ (facet.Value)            │
├─────────┼──────────────────────────────────────────────────────────┼──────────────────────────┤
│ Choice? │ No — intrinsic (where the file is)                       │ Yes — added to           │
│         │                                                          │ describe/link            │
├─────────┼──────────────────────────────────────────────────────────┼──────────────────────────┤
│ The 8   │ network, working-groups, methods, tools, data, papers,   │ —                        │
│         │ news, events                                             │                          │
└─────────┴──────────────────────────────────────────────────────────┴──────────────────────────┘

The type.* "facet" was a half-measure that duplicated the structural type as a tag, but only for papers & datasets — which is exactly why /tags "Content types" showed just Dataset and Paper. And a node.*/org.*/portal.* tag is a reference (like a link) that only exists when content points at that entity — so "MBON nodes" listed only the referenced node, not all nodes.

What changed

1. All tags now show on every content page (news was capped at 2 — fixed; sea-of-cortez now shows all four: Pole to Pole Americas · Americas · Genomics · Fieldwork).
2. Retired the redundant type.* tag — stripped from 142 papers/datasets, removed from tags.yaml, and stopped the 3 generator scripts from emitting it. Content type is structural, period. (3 year-less papers became tagless, which surfaced a delimit nil bug in the list templates — guarded.)
3. Rebuilt /tags into three honest parts:
  - Content types (structural) — all 8, built from the sections, each linking to its section page, always complete.
  - Descriptive tags — tool/method/place/topic/year.
  - References — org/portal/node, with a note: "Only entities referenced by content appear here; every node/tool also lives under its content type above." That's the direct answer to "Pole to Pole Americas is one of many nodes" — all nodes are under Network nodes (structural); the References list shows which are referenced.
4. Documented the model rigorously , structural-vs-tag,entity-references) and README.md (the two-system framing + reduced facet table).                  
Build exits 0, check_links passes (32,131 links, 0 broken).                                       
Two things worth your awareness:                                                                  - The type.* retirement touched 142r/- type.Dataset line removed fromeach) — a large but purely mechanical diff. If you'd rather have kept those tags, say so and I'll revert just that piece.
- method is subtly entity-like too — method.Genomics ↔ methods/genomics exists as a page, socould also become an entity referen/ would feature the method page). Ileft it as an attribute to avoid over-weighting it in Related, but it's a reasonable future refinement — your call.

----

PROMPT: Looking at http://localhost:1313/tags/, I still don't understand.

What is the point of having these Content Type tags in the first place? Just to be able to browse them -- don't we have that in the index page of the content already, which these seem to link to; or just for completeness to enumerate on the tags page? or for use in search?

And what is truly the difference between "Descriptive tags" and "References"? I don't see the Organizations pointing to a page on the organization, like GOOS to the network/partners/ GOOS card. "Portals", like OBIS, is unique in that it can reference where the dataset is stored, but also confusing because there is an organization for instance for OBIS (so is that for it's organization vs other for data portal?). And "MBON nodes" lists only 1, "Pole to Pole Americas", yet we have 13 Network nodes.

We need to simplify this. Fundamentally I am wondering if we can tag with peices of content like "/working-groups/indicators" or "/network/pole-to-pole-americas" or even ? Or do we have to create tags for all of these for them to work and be easily maintained?

Also wierdly visiting http://localhost:1313/methods/indicators/, I don't reference to the related working groups like I would hope:
- http://localhost:1313/working-groups/indicators/
- http://localhost:1313/working-groups/eco-indicators/
- http://localhost:1313/working-groups/data-mgmt/

----

The audit clarifies everything. Two key facts:

1. methods/indicators and the 3 working groups already share method.Indicators — but that tag is on 15 items, so the working groups tie at score 1 and get crowded out of the top-6 Related (same failure mode as the node). The tag is there; ranking buries it.
2. Orgs are external-link cards in data/partners.yaml (GOOS → goosocean.org), rendered on one /network/partners/ page with no per-org anchor — so an org.* tag fundamentally can't "link to the GOOS card." The entity-reference idea only ever worked cleanly for portals (→ tool pages) and the one node.

So your instinct is right: the "References" tag category is the confused part. Let me get three decisions before writing the plan — they genuinely change its shape.

←  ☒ Tag model  ☒ /tags types  ☒ Methods↔WGs  ✔ Submit  →

The 'References' tag idea (node/org/portal pointing at a page) is the confusing part — nodes show 1 of 13, orgs can't link to a page. I recommend replacing page-to-page links with a `related:` front-matter field holding content paths (e.g. `/network/pole-to-pole-americas`, `/working-groups/indicators`), rendered as curated 'Related' links (bidirectional — declare once, both pages show it). How far should the tag facets be simplified?

 1. Retire node; keep org+portal             │ TAGS become one flat kind (filter/browse): │
 2. Also retire org + portal tags            │   Topics · Years · Organizations · Portals │
  3. Keep facets, add related:              │ GONE: node.* facet, 'References' category, │
                          │       entity-feature on term pages         │
                          │                                            │
                          │ PAGE-TO-PAGE links -> new related: field:  │
                          │   related:                                 │
                          │     - /network/pole-to-pole-americas       │
                          │     - /working-groups/indicators           │
                          └────────────────────────────────────────────┘

                          Notes:I like this new `related:` field with page-to-page linkages, but I am confused still about how to resolve the duplication between /tools/obis, tool.OBIS, org.OBIS. Ideally we only have one, the content, but we want to be able to easily tag news, events and datasets, so does that mean we go back to having all content with its own entity tag term page features the matching content page (portal→`tools/<slug>`, org→partner/node)?

←  ☒ Tag model  ☒ /tags types  ☒ Methods↔WGs  ✔ Submit  →

The /tags 'Content types' row (Network nodes, Tools, Papers…) just links to section index pages that are already in the top nav. Keep it on the /tags page?

❯ 1. Remove it ✔                  ┌────────────────────────────────────────────┐
  2. Keep a compact overview      │ /tags page =                               │
                                  │   Tool types · Methods · Regions           │
                                  │   Topics · Years · Orgs · Portals          │
                                  │                                            │
                                  │ (no 'Content types' row — use the          │
                                  │  nav / section pages for that)             │
                                  └────────────────────────────────────────────┘

←  ☒ Tag model  ☒ /tags types  ☒ Methods↔WGs  ✔ Submit  →

How should methods/indicators surface its 3 related working groups (Indicators, Eco-Indicators, Data Management)? They already share the `method.Indicators` tag.

 1. Auto-surface by shared method tag                     │ methods/indicators.md:                     │
 2. Curate with related: ref ✔    │   related:                                 │
                                  │     - /working-groups/indicators           │
                                  │     - /working-groups/eco-indicators       │
                                  │     - /working-groups/data-mgmt            │
                                  │                                            │
                                  │ = explicit, precise, manual                │
                                  └────────────────────────────────────────────┘


Your note asks the real crux: OBIS shows up three times — the /tools/obis page, org.OBIS, and portal.OBIS — and you want ideally one (the content page) while still tagging news/events/datasets easily.

Here's the key realization that resolves your question: the related: field lets content point straight at the /tools/obis page (the one canonical content), and backlinks ("what references this page") turn /tools/obis into the hub of everything OBIS — without needing a parallel org.OBIS/portal.OBIS term page that "features" it. So you don't go back to entity tags; you link to the content directly, and it's still easy to add via issue-form dropdowns that map "OBIS" → /tools/obis.

The one remaining fork is what to do with the org/portal tags that today also power filters (Tools-by-org, Data-by-portal). That's genuinely your call:

☐ OBIS = one thing

Given `related:` (page paths) + backlinks make /tools/obis the single OBIS hub: what should happen to the `org.*` and `portal.*` tags, which today also drive the Tools 'Organization' filter and the Data 'Portal' filter (?portal= deep-links)?

 1. Keep org/portal as filters    ┌─────────────────────────────────────────────┐
                                  │ ONE representation: the content page        │
 2. Collapse fully to the page    │   everything -> related: /tools/obis        │
                                  │   backlinks = browse by entity              │
                                  │                                             │
                                  │ RETIRE: node., org., portal.*               │
                                  │ /data 'Portal' filter rebuilt from          │
                                  │   dataset sources[] (data already there)    │
                                  │                                             │
                                  │ (bigger change: harvest_datasets.py,        │
                                  │  data filter, partners.yaml OBIS entry)     │
                                  └─────────────────────────────────────────────┘

                                  Notes: I like the consolidation, as long as we can include OBIS
                                         (and similar related content) in the /tools/ filtering and
                                         in the Search to act like a tag did?


The plan is ready. Here's the essence of how it answers your questions:

- "What's the point of Content Type tags?" — None, now that type.* is retired; the /tags "Content types" row just duplicated the nav. Removed.
- "Difference between Descriptive tags and References?" — The distinction was the problem. Collapsed — all tags become one flat filter/search set; page-to-page links move to the new related: field.
- "Can we tag with pieces of content like /working-groups/indicators?" — Yes — that's exactly related: (a list of content paths), with backlinks so you declare the link once and both pages show it. No parallel tag vocabulary to maintain.
- "MBON nodes shows 1 of 13" — node.* is retired; nodes are referenced via related:, and all 13 live under the Network section.
- methods/indicators → working groups — fixed with curated related: refs (your choice); backlinks light up the reverse on each working-group page.

The one deliberate call I made: org/portal stay as filter tags (so OBIS/GBIF/GOOS remain filterable in /tools/, /data/, and search — your hard requirement), because most orgs have no page to point related: at, and collapsing them would mean rebuilding the filters. OBIS still appears as org.OBIS/portal.OBIS tags, but /tools/obis becomes its single hub via backlinks. I flagged migrating portals into related: as an optional later pass.

----

PROMPT: Let's drop OBIS as an organization, and add Portals section to the /tools/ filter using the portal.* tags. Update the existing org.OBIS tags to portal.OBIS (assuming not already tagged with portal.OBIS). The organization for a tool tends to be the developer of it, whereas most (or probably all) of the tools tagged with OBIS use OBIS data.

[Interesting! "Portals do have pages, so a later pass could migrate portal.* into related: and derive the /data filter from it — noted, not done here (avoids a filter/harvest/search rebuild now)."]

----

PLAN: 2026-07-01 Simplify interlinking related content references + tags as pure filters.md

Done — the simplification is implemented and verified end-to-end. Build exits 0, 31,924 internal links check with 0 broken (every related: path resolves), and pagefind indexed.

What changed

Three clean mechanisms now, instead of the tangled "entity/reference" tags:

1. Content type = structural (the section) — /tags no longer lists it.
2. Tags = filter/search only. org = developer, portal = data source. OBIS is now a portal, not an org — the 8 tools tagged org.OBIS became portal.OBIS, and portal.* now filters the Tools index too (new Portals section, buttons OBIS/GBIF/EDI/ERDDAP, ?portal=OBIS deep-links work).
3. related: = a front-matter list of content paths — the one way to link to a specific page.

Verified working:
- methods/indicators → its 3 working groups (curated related:); working-groups/indicators → methods/indicators (automatic backlink). Same for acoustics↔biosound, genomics↔edna, tracking↔biotrack.
- node.* retired — the 5 Pole-to-Pole files now use related: /network/pole-to-pole-americas; the node page shows all of them via backlinks (it's the hub now).
- /tools/obis shows the 4 OBIS-referencing news/events via backlinks — the "everything OBIS" hub, no org.OBIS/node.* needed.
- /tags is one flat facet list (no Content types / References rows).
- related: titles are emitted as Pagefind meta (searchable), and the issue forms gained a "Related pages" field wired through collect_related in the script (tested: it writes related: and drops non-path input).
- Docs (CLAUDE.md, README.md) rewritten around the three mechanisms; data/tags.yaml header documents org vs portal.

Two judgment calls I made and flagged in the plan, worth your eye:
- 4 OBIS news/events (obis-unesco-world-heritage, terceira-island-workshop, europe-publishing-seminar, international-ocean-data-conference-2022) → I used related: /tools/obis rather than portal.OBIS, since they're about OBIS, not datasets using its data. Easy to switch if you'd prefer the tag.
- I saved the org=developer / portal=data-source / OBIS-is-a-portal decision to project memory so future sessions don't re-introduce the confusion.

Nothing is committed — the working tree holds this whole session's work (202 files, mostly the earlier type.* retirement). Say the word when you'd like it committed.

----

PROMPT: The search results are no longer nice (or maybe they need to get reindexed?) and are broken. I'm only seeing type "PAGE" and links out are all broken, eg
  searching "OBIS", going to "/products/" (defunct / old, now "/tools") or "/tags/orgobis/" (supposedly deleted, but also not quite right ie /tags/org.obis/). See
  for yourself please: http://localhost:1313/search/?q=OBIS. There was very nice grouping of results by type with proper cards for each before and all the links
  worked. FIX THIS SO TAGS WORK SMOOTHLY throughout the website

----

The search on localhost:1313 (the hugo server dev preview) is showing an ancient pagefind index — /products/ (renamed to /tools/ before this session even started) and /tags/orgobis/ are dead giveaways of a months-old index. hugo server doesn't run pagefind, so it's serving a stale one from somewhere. Let me find where, and how search is wired.

----

PROMPT: So how am I supposed to preview the results properly? Please update `## 1. Run it locally` which says only `hugo server          # live-reloading preview at http://localhost:1313` (but does say below `hugo --gc --minify; npx pagefind --site public`)

----

Fixed and verified. Here's what was going on and what I did.

Root cause

Search wasn't broken by code — the /search/ page on hugo server (localhost:1313) serves its index from static/pagefind/, a git-ignored artifact that was frozen at Jun 19 (before this whole session). hugo server live-reloads content/layouts/CSS but never rebuilds the Pagefind index, so it kept serving month-old data: type: PAGE everywhere (that build predated the type/badge meta), /products/ links (renamed to /tools/ long ago), and /tags/orgobis/.

What I did

1. Regenerated the index fresh and refreshed static/pagefind/, built with the default root-relative baseURL so links/images resolve on localhost:1313. Your hugo server already serves it — hard-reload /search/ (Pagefind caches the index in the browser).
2. Proved it works with a direct Pagefind query: "OBIS" → 130 results, grouped Tools / News / Events with correct badges, images, and links (/tools/obis/), and OBIS is correctly indexed under the portal filter (not org).
3. Added scripts/reindex.sh — a one-command build → pagefind → copy into static/pagefind/ — so you never hit stale search again.
4. Updated the docs you asked about:
  - README.md §1 "Run it locally" now explains that search is a separate build step, points to ./scripts/reindex.sh, and notes the hard-reload + git-ignored artifacts.
  - CLAUDE.md Commands gained the same note.

So, to preview search locally from now on

./scripts/reindex.sh   # then hard-reload http://localhost:1313/search/
hugo server stays your fast loop for everything else; run that one command whenever you want /search/ to reflect new content. Tags themselves (chips, /tags/, filters, Related) were already working live — it was only the search index that was stale.

----

PROMPT: Ok, that's a relief! Can you also fix the code so as to clean up this deprecation warning when running the pagefind `npx pagefind --site public`:

   ─────────────────────────────────────────────────────────────────────────┐
  │  Pagefind found references to the Default UI (pagefind-ui.js)           │
  │  on your site. The Default UI is supported and will continue            │
  │  to work.                                                               │
  │                                                                         │
  │  As of 1.5.0, if you are setting up a new integration, use the          │
  │  Component UI instead. It includes a search modal, better               │
  │  accessibility and customization: https://pagefind.app/docs/search-ui/  │
  └─────────────────────────────────────────────────────────────────────────┘

----

Done — the deprecation warning is fixed.

What it was

layouts/404.html was the only thing still using Pagefind's Default UI — it loaded pagefind-ui.css + pagefind-ui.js and called new PagefindUI(...) to show "related content" suggestions for the mistyped URL. Pagefind scans the built HTML, saw those references, and emitted the "use the Component UI instead" notice. (The main /search/ page already used the modern core API, so it was never the culprit.)

The fix

Rewrote the 404's search to use the core Pagefind API — the same import('pagefind/pagefind.js') + type-aware result cards as /search/. It still extracts search terms from the bad URL path and shows the top 6 matches, just without the deprecated UI bundle. Net effect: removed the two pagefind-ui.* <link>/<script> tags and the PagefindUI call.

Verified

- Pagefind output is now clean — no "Default UI" warning.
- Built 404.html has 0 pagefind-ui/PagefindUI references and imports the core pagefind.js.
- check_links passes; build exits 0.
- Local index refreshed via ./scripts/reindex.sh.

As a bonus, the 404's suggestions now render with the same cards (type badge, image, excerpt) as the main search, so it's visually consistent too. Pagefind still outputs the pagefind-ui.* files into the bundle (it always does) — they're just no longer referenced, which is what silences the notice.

----

PROMPT: Drop topic.Regional from tags altogether. That seems to be vestigial from earlier designation of /network/ as regional vs thematic. See http://localhost:1313/tags/topic.regional/

---

All clean. That last "Regional" is just the "Regional MBONs" nav link (→ /network/) in the site header — a menu item, not a tag. The topic.Regional tag itself is fully gone:

- Removed from all 12 network nodes (each keeps its place.*); 0 left in content.
- /tags/topic.regional/ now 404s (term page gone), and there's no topic.Regional chip on /tags.
- Search reindexed, check_links passes (0 broken).

You were right that it was vestigial — every node already carries its place.* region (place.US, place.Arctic, place.Americas, etc.), so topic.Regional was redundant labeling from the old regional-vs-thematic split.

One useful fix fell out of this: check_links initially flagged a broken link because scripts/reindex.sh rebuilt over the old public/ and Hugo's --gc only cleans the cache, not stale output files — so the deleted term page lingered. I added rm -rf public to the top of reindex.sh so it always does a clean build. Reload /tags/ (and /search/ after a hard refresh) and Regional is gone.

----

PROMPT: Can we cleanly distinguish between all card content types? For instance, when I look at "Related across the network" for http://localhost:1313/methods/acoustics/, I do not understand the 1st is a working-group, the 2nd a tool. The dataset is obvious with "{n} records" and "VIEW DATASET"; event less so with date and VIEW DETAILS.

----

Done. Every card now carries a consistent, colored type label at the top of its body, so all eight content types read at a glance — the exact gap you hit (working-group vs tool looking identical in methods/acoustics's Related section).

What I did

- New layouts/partials/card-kind.html — maps a page's .Type to an icon + singular label:

| Type           | Label         | Icon          | Colour     |
|----------------|---------------|---------------|------------|
| tools          | Tool          | 🧰 toolbox    | amber      |
| working-groups | Working Group | 👥 users      | kelp green |
| methods        | Method        | 🔬 microscope | teal       |
| network        | Node          | 🔗 diagram    | navy       |
| data           | Dataset       | 🗄 database    | violet     |
| papers         | Paper         | 📄 file       | ink grey   |
| news           | News          | 📰 newspaper  | coral      |
| events         | Event         | 📅 calendar   | teal-dk    |

- Added it to the top of every card body (card-tool, card-dataset, card-paper, card-news, card-event) — the key fix is card-tool, which is the shared fallback for tools, working groups, methods, and nodes, so those four are now distinct.
- Added .card__type + per-type color CSS; removed the now-redundant over-media .card__kind from the paper card (its "Paper" label moved into the body like the rest).

Verified

On methods/acoustics "Related across the network", the cards now label as Working Group · Tool · Dataset · Dataset · Dataset · Event (was: two indistinguishable generic cards). A mixed tag page (method.genomics) shows all types correctly tagged. Build exits 0, check_links passes, index refreshed.

The type label sits above the tag chips, so a card reads: type (what it is) → tags (what it's about) → title → summary → CTA. The existing distinctive touches stay too (dataset record count, news/event date badges).

I couldn't grab a screenshot — this browser environment blocks the CDN fonts/globe scripts and freezes the page — but it's verified in the built HTML/CSS. Hard-reload http://localhost:1313/methods/acoustics/ and you'll see the labeled cards.

----

PROMPT: Looks great! Can we obtain better images for http://localhost:1313/methods/ that are in the public domain. Acoustics is currently using the logo for the BioAcoustics working group. "Indicators & Data Management" the Pole to Pole map (specific to a node or its atlas). At sea surveys shows a manta ray gliding underwater, not suggestive of a ship going out to sea to collect data really at all. Remote sensing is an underwater image, not a satellite (or drone) from above, ie remote.

----

All four public-domain banners are installed and resolve; build and link check pass, index refreshed.

New method images (all public domain)

┌────────────────────────────┬──────────────────────┬─────────────────────────────────────────────────────────────────────────┬───────────────────────────────┐
│           Method           │         Was          │                                   Now                                   │    Source (public domain)     │
├────────────────────────────┼──────────────────────┼─────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Remote Sensing             │ underwater seascape  │ swirling phytoplankton bloom from space (Pribilof Islands, Bering Sea)  │ NASA                          │
├────────────────────────────┼──────────────────────┼─────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ At-Sea Surveys             │ manta ray underwater │ NOAA survey vessel Shenehon underway with a bow wave                    │ NOAA                          │
│ (Traditional)              │                      │                                                                         │                               │
├────────────────────────────┼──────────────────────┼─────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Acoustics                  │ BioSound WG logo     │ NOAA sanctuary hydrophone / acoustic recorder on the seafloor (Gray's   │ NOAA                          │
│                            │                      │ Reef NMS)                                                               │                               │
├────────────────────────────┼──────────────────────┼─────────────────────────────────────────────────────────────────────────┼───────────────────────────────┤
│ Indicators & Data          │ Pole-to-Pole node    │ large NOAA data buoy (station 46035) with its sensor mast               │ NOAA (National Data Buoy      │
│ Management                 │ map                  │                                                                         │ Center)                       │
└────────────────────────────┴──────────────────────┴─────────────────────────────────────────────────────────────────────────┴───────────────────────────────┘

Each now matches its method: a from-above satellite view for remote sensing, a ship going to sea for surveys, an acoustic instrument for acoustics, and ocean-observing data infrastructure for indicators/data — and none are node- or WG-specific. They live in static/img/methods/, referenced via each page's banner:. Since they're NASA/NOAA works they're public domain (no attribution required), but I've kept the provenance above for your records.

Hard-reload http://localhost:1313/methods/ to see them (and the method cards/related sections that use the banner will pick them up too).

Two notes:
- I left the old images in place — biosound-hero.jpg, pole-to-pole-map.png, etc. are still used by the BioSound working group, the Pole-to-Pole node/news, and other pages, so nothing was deleted.
- Tracking (img/working-groups/atn-biotrack.png) has the same "using a working-group image" issue you flagged for Acoustics — want me to swap it for a public-domain animal-tracking image (e.g. a tagged sea turtle/shark or a satellite tag) the same way? Benthic (kelp) and Genomics (eDNA) look on-topic, so I'd leave those.

----

PROMPT: These feel inconsistent. Provide clean LLM image prompts for ALL of the methods, to make scientific cartoon illustrations of each method, extending from /img/methods/methods-illustration.png

----

That base illustration is a lovely flat-vector cross-section — deep navy ground, teal/aqua water with soft light rays, sparing coral accents, and each method rendered as a clean geometric vignette (satellite + drone, ship, hydrophone with sound rings, tagged whale/turtle/fish, DNA + sample bottle, shore quadrat, data panel). Here are consistent prompts to generate a matching illustration per method.

**Shared style block** — prepend to every prompt (verbatim, so all 7 match)

▎ Flat-design vector scientific illustration, clean minimal geometric shapes with subtle flat shading (no photoreal texture). A cross-section of the ocean with a crisp horizontal waterline: calm sky above, translucent sea below, soft pale light-rays fanning down from the surface. Palette: deep navy background (#04131f–#082336), cool teal-to-aqua water (#15788f, #38a7bb, #74c8d6, #aee2ea), sparing warm coral accents (#f2683f) on one or two focal elements, occasional soft sun-gold (#f5b53f). Muted, sophisticated, editorial science-museum-diagram aesthetic. Centered, uncluttered, generous negative space, wide banner composition. No text, no labels, no logos, no watermark. Part of a single cohesive illustration set. --ar 16:9 --style raw

**Consistency tip**: in Midjourney, also paste the master image's URL as a style reference (--sref <url-to methods-illustration.png>) — that locks the exact line weight and palette across all seven. (DALL·E/Ideogram: just reuse the style block word-for-word.)

**Per-method subject** (append after the style block)

**1 · Remote Sensing** → remote-sensing.jpg

▎ Subject: above the waterline, a small stylized satellite and a fixed-wing survey drone high in the sky, each casting a translucent scanning cone down onto the sea; the surface below shows swirling phytoplankton ocean-color patterns and faint sea-surface-temperature bands seen from above.

**2 · Traditional At-Sea Surveys** → traditional.jpg

▎ Subject: a research vessel on the surface towing an opening trawl/plankton net underwater, with a CTD rosette on a line over the side; a few schooling fish near the net; classic ship-based sampling on a calm sea.

**3 · Acoustics** → acoustics.jpg

▎ Subject: a hydrophone on a slender stand on the seafloor emitting concentric sound-wave rings; a whale and a school of fish nearby emitting faint sound rings too; a downward echosounder cone from a small boat at the surface; a small audio-waveform motif to one side.

**4 · Tracking** → tracking.jpg

▎ Subject: tagged marine animals moving through the water — a sea turtle, a tuna or shark, and a whale — each wearing a small electronic tag pinging signals up to a satellite above; faint dotted movement-track paths tracing their routes; a tagged seabird skimming the surface.

**5 · Genomics & eDNA** → genomics.jpg

▎ Subject: a Niskin sampling bottle collecting a water sample near the surface, with a translucent DNA double-helix rising out of it; tiny stylized organisms (plankton, fish and whale silhouettes) suspended as particles in the water; a small sediment core tube on the seafloor.

**6 · Benthic Surveys** → benthic.jpg

▎ Subject: a scientist kneeling on a rocky intertidal shore at the land-sea edge, placing a square photo-quadrat frame on the rocks; tide pools, kelp fronds, and a sandy-beach transect line; low tide exposing shoreline biodiversity where the waterline meets the shore.

**7 · Indicators & Data Management** → indicators.jpg

▎ Subject: streams of small data glyphs and dotted lines flowing upward from ocean instruments (a buoy and a seafloor sensor) and converging into a clean floating dashboard panel with a simple line chart, a small world map, and a row of indicator dots/bars; an abstract “observations becoming knowledge” pipeline, minimal and diagrammatic.

Notes

- Aspect/size: banners crop to ~16:10 on cards and a short strip on the page, so keep the subject centered with headroom; export ~1600px wide. Save each as static/img/methods/<slug>.jpg (the four I added — remote-sensing, acoustics, traditional, indicators — will be overwritten; benthic, genomics, tracking are new).
- Each vignette is essentially a zoomed-in panel of the master illustration, so the set will read as one family and tie back to the methods-illustration.png hero on /methods/.
- Once you've generated them, drop them in and I'll wire up the banner: fields (and we can retire the stock photos). Want me to also switch benthic/genomics/tracking to img/methods/… now so all seven are consistent the moment you add the art?

----

PROMPT: Ok, they're all in `@static/img/methods/`

----

All seven method banners now use the illustrated set — build clean, every page references its own img/methods/*.jpeg, and check_links passes.

Done

┌────────────────────────┬──────────────────────────────────────────────────────────────┐
│         Method         │                            Banner                            │
├────────────────────────┼──────────────────────────────────────────────────────────────┤
│ Remote Sensing         │ remote-sensing.jpeg (satellite + drone scanning ocean-color) │
├────────────────────────┼──────────────────────────────────────────────────────────────┤
│ At-Sea Surveys         │ traditional.jpeg                                             │
├────────────────────────┼──────────────────────────────────────────────────────────────┤
│ Acoustics              │ acoustics.jpeg                                               │
├────────────────────────┼──────────────────────────────────────────────────────────────┤
│ Tracking               │ tracking.jpeg (tagged tuna/whale/turtle → satellite)         │
├────────────────────────┼──────────────────────────────────────────────────────────────┤
│ Genomics & eDNA        │ genomics.jpeg                                                │
├────────────────────────┼──────────────────────────────────────────────────────────────┤
│ Benthic Surveys        │ benthic.jpeg                                                 │
├────────────────────────┼──────────────────────────────────────────────────────────────┤
│ Indicators & Data Mgmt │ indicators.jpeg                                              │
└────────────────────────┴──────────────────────────────────────────────────────────────┘

The two I spot-checked (remote-sensing, tracking) match the master methods-illustration.png palette and flat-vector style exactly, and all seven are a uniform 1280×714 set — so the whole /methods/ experience is now cohesive: the master illustration with clickable hotspots on the index, and a matching per-method vignette as each page's banner (and on every method card + Related section that uses it).

The old stock photos are out of rotation (you moved them to static/img/methods/old/); they're unreferenced now, and I left the other shared photos (kelp, eDNA, biosound, etc.) untouched since they're still used elsewhere.

Hard-reload http://localhost:1313/methods/ to see the set. If you'd like, I can prune the unused static/img/methods/old/ and the superseded NASA/NOAA .jpg files I'd added, so only the illustrations remain — say the word.


## 2026-06-26.d + Data #1

Take on issue #1 + Data

  I now have a clear picture of the architecture. Issue #1 has a firm ask (Data nav item + landing page explaining data access via Tools) and a larger "Consider" (a new filterable dataset content type harvested from OBIS/GBIF/EDI/ERDDAP). Those are very different sizes of work, so let me confirm scope before building.

  ☐ Scope

  Issue #1 firmly asks for a Data nav item + landing page (routing to Portals/Apps/Packages), and separately says to *consider* a new filterable `dataset` content type harvested from OBIS/GBIF/EDI/ERDDAP. How far should I take it now?

    1. Landing page only            ┌───────────────────────────────────────────────────┐
    2. Landing page + dataset scaffold                      │                                                   │
  > 3. Full build incl. harvester    │ scripts/harvest_datasets.py                       │
                                    │   → queries OBIS / GBIF / EDI / ERDDAP            │
                                    │   → writes content/datasets/*.md                  │
                                    │   → n_records, cross-portal linking               │
                                    │                                                   │
                                    │ Needs: API exploration, network calls,            │
                                    │ de-dup logic. Multi-hour, iterative.              │
                                    └───────────────────────────────────────────────────┘

Note: looks like erddapy supports searching across ERDDAP servers. From Google Search AI results:

Let's prefer OBIS datasets over GBIF duplicates, since OBIS has more extended schemas and QA/QC

```py
import pandas as pd
from erddapy.multiple_server_search import search_servers

# Searches across registered ERDDAP servers simultaneously
df = search_servers(
    query="glider", 
    servers_list=None, 
    parallel=True, 
    protocol="tabledap"
)
print(f"Total entries found: {len(df)}")
```

Note: Per https://edirepository.org/resources/finding-data#ediutils, the https://docs.ropensci.org/EDIutils/reference/search_data_packages.html function allows searching data packages in EDI. And then there's a broad Google Dataset type that could be searched: https://developers.google.com/search/docs/appearance/structured-data/dataset

**Outcome — what shipped (uncommitted; tree had prior WIP, so left for you to branch+commit):**

- **Nav + landing**: `Data` in navbar left of Tools (`hugo.yaml` w5, others bumped) with a
  dropdown (All · OBIS/GBIF/EDI/ERDDAP · How to access). `content/data/_index.md` +
  `layouts/data/list.html` = "Three ways into the data" (Portals/Apps/Packages) over a
  filterable catalog. Footer → "Data & Tools" with a Data-catalog link.
- **Dataset type**: `layouts/data/{list,single}.html`, `card-dataset.html` (portal-tinted
  placeholder + record count), `card.html` routes `data`. New `portal` facet (violet
  `--facet-portal`) + `type.Dataset` in `data/tags.yaml`; data filters = Portal/Method/Region.
  Single page: record-count stat, cross-portal "Available in" buttons, `schema.org/Dataset`
  JSON-LD (Google Dataset Search). Generic `static/js/filter.js`; `partials/num.html` formats
  counts (`lang.NumFmt` errored in this Hugo — resolved to interface{}).
- **Harvester** `scripts/harvest_datasets.py` (pyyaml+stdlib): GBIF q=MBON → resolve to
  canonical **OBIS** (per-node index + title/IPT-sig match; OBIS global paging unreliable,
  size≥5000 times out). **OBIS-first** merge (ARMS-MBON: OBIS 20,210 vs GBIF 21,482). EDI via
  PASTA Solr, ERDDAP via stdlib multi-server search over awesome-erddap (no erddapy dep).
  **Relevance gate**: keep only with MBON text signal OR `ipt.iobis.org/mbon` — the GBIF "OBIS
  network" alone admitted noise (Royal Ontario Museum, Queensland turtles, "Ambon Indonesia").
- **Result**: 54 datasets (34 OBIS, 10 EDI, 6 ERDDAP, 4 GBIF gap), 219 off-topic dropped.
  `hugo --gc --minify` exit 0 (524 pages); pagefind OK. Verified landing + a dataset page in browser.

Looking good! Something is off though with PORTAL tag filters, which don't have proper pill
  styling and disappear when selected, eg here OBIS disappeared: [Image #2]

Also noticing the datasets are not showing up as typed like other content, just under "More" at
  bottom, eg http://localhost:1313/tags/method.genomics/ [Image #3]

Both issues are now resolved and verified in the browser:

1. Portal filter pills — now render correctly: OBIS shows as a filled violet pill (active/visible), with GBIF/EDI/ERDDAP as outlined violet pills alongside the teal Method and navy Region pills. The root cause was a stale cached styles.css: it's @import-ing tokens/colors.css and the <link> has no fingerprint, so your browser kept serving the pre---facet-portal CSS. With --_c: var(--facet-portal) undefined, the pill lost its background/border and the active state's color:#fff went invisible — exactly what you saw. The build itself was already correct; a rebuild + fresh load fixed it.

2. Datasets typed on tag pages — fixed for real. layouts/_default/taxonomy.html had an explicit type-group list (Network, Methods, Tools, Papers, News, Events) that omitted data, so datasets fell into the catch-all "More". I added a Datasets group (between Tools and Papers). Now /tags/method.genomics/ shows a proper DATASETS · 3 section with portal-tinted dataset cards.

Clean rebuild passed (exit 0, no errors/broken links). The only file changed for these fixes is layouts/_default/taxonomy.html.

One follow-up worth flagging: that stale-CSS confusion will recur on every CSS edit — and bite returning visitors in production (GitHub Pages caches styles.css), since it's linked directly from static/ without a content hash. If you'd like, I can route the CSS through Hugo's asset pipeline with fingerprint (cache-busting hash in the filename) so CSS changes always take effect immediately. Out of scope for issue #1, but a small, high-value hardening — say the word.


## 2026-06-26.c fix navbar, website on phone

I notice on a smartphone that the navbar is not navigable [image]. The whole website needs to be reviewed for use on smartphone devices.

Summary

The code fix is complete and verified — the menu now closes on the second click, even while the button is focused (tested with fresh CSS: open → flex, second click → display: none).

What I changed:
- layout.css: removed the .site-header:focus-within .site-nav fallback that held the menu open whenever the hamburger had focus.
- header.html: the toggle now also syncs aria-expanded and swaps the glyph ☰ ↔ ✕.


Can you see this Chrome window controlled by Claude that is already setup  to iPhone SE 375 x
  667. I could now see the hamburger toggle to an X, but not close the nav menu when clicked (just
  toggles back to hamburger) [Image #4]

Why you're still seeing the bug: your browser is running stale styles.css. Hugo's livereload reloaded the page HTML (which is why you got the new ☰↔✕ icon behavior), but it reused the cached stylesheet — which still has the original max-width:780px + :focus-within rules. I confirmed this by reading the loaded CSS in the controlled tab: it had the old 780px/focus-within rules, while the dev server is serving the corrected 1024px/no-focus-within version.

👉 To pick it up: hard-refresh the device-mode tab — Cmd+Shift+R (or DevTools open → right-click reload → "Empty Cache and Hard Reload"). After that, tapping ✕ will close the menu.

If it still doesn't close after a hard refresh, tell me and I'll dig further — but the fresh-CSS test passed cleanly, so I'm confident it's the cache.

---
One optional follow-up worth considering: in production, returning visitors can cache /css/styles.css across deploys and hit this same staleness. Hugo can fingerprint the CSS (hashed filename like styles.abc123.css) so every change auto-busts the cache. Want me to wire that up? It's a ~10-line change to head.html + styles.css handling.

Yes, let's autobust the cache


## 2026-06-26.b fix 404s on Methods illustration

I notice that the Methods illustration links are not properly formed, eg goes to https://marinebon.org/methods/acoustics/ which 404s. It is missing `hugo2`:  https://marinebon.org/hugo2/methods/acoustics/. Fix all these links now and into future (for when the website gets staged from https://marinebon.org/hugo2/ to https://marinebon.org/). 

Can we also check for these 404s throughout the website, possibly on render and fail if any are found to flag for fixing? We could also have an exceptions list to allow publishing the site anyways, until some known culprits are fixed later.

Done. Everything is fixed and verified against both the production subpath build (/hugo2/) and the future root build (/).

Root cause

The methods illustration "Learn more" links came from data/methods.yaml (url: /methods/acoustics/) rendered via relURL. The trap: relURL drops the base path when given a leading-slash string — relURL "/methods/acoustics/" → /methods/acoustics/ (404s under /hugo2/), whereas relURL "methods/acoustics/" → /hugo2/methods/acoustics/. It "worked" locally only because the default local baseURL has no path.

What I fixed

The link checker I wrote surfaced 20 broken links across the site, not just the methods band — all now fixed (zero content edits needed for the markdown ones):

- data/methods.yaml — removed leading slashes from the 7 hotspot url: values (the reported bug).
- layouts/_default/_markup/render-link.html (new) — there was already a render-image.html hook but no link hook, which is exactly why markdown images resolved correctly but markdown links didn't. This new hook runs every internal markdown link through relURL (base-path-correct), fixing the tool/news/method cross-links and the relative docs/*.pdf links automatically — now and for future content.
- layouts/partials/social-links.html — the footer "Contact" link (/contact/ from data/social.yaml, on all 327 pages) now resolves through relURL.
- layouts/404.html — hardcoded href="/" and href="/search" now use relURL.

404 detection (your second ask)

- scripts/check_links.py (new, stdlib-only) — walks the built site, extracts every href/src/srcset, and fails (exit 1) if any internal link either drops the base path (catches the exact relURL class of bug) or points to a missing file. Auto-detects the base path from sitemap.xml, so it's correct whether the site is served at /hugo2/ or root.
- scripts/linkcheck_allow.txt (new) — your exceptions list: glob patterns for known-broken links to allow publishing anyway. Currently empty — every real link was fixable, so nothing needed an exception.
- .github/workflows/deploy.yml — runs the checker after the Hugo build (against the real /hugo2/ baseURL), so a regression fails the deploy.
- CLAUDE.md — documented the command, the leading-slash gotcha, the render hooks, and how to reproduce the subpath locally.

Verification: pre-fix build → 20 broken (exit 1); fixed subpath build → 0 broken (exit 0); fixed root build → 0 broken (exit 0); allow-file correctly demotes matches to warnings.

To check locally the way CI does:
hugo --gc --minify --baseURL "https://marinebon.org/hugo2/"
python3 scripts/check_links.py public

One thing worth your awareness: the build I tested includes your in-progress data/tags.yaml refactor (the deleted *_filters.yaml files) — it builds clean and passes the link check, so nothing there is blocked.

Committed on a new branch fix/base-path-internal-links (commit 3674e3e).

What's in the commit — only the 7 task files:
- data/methods.yaml, layouts/_default/_markup/render-link.html, layouts/partials/social-links.html, layouts/404.html — the link fixes
- scripts/check_links.py, scripts/linkcheck_allow.txt, .github/workflows/deploy.yml — the checker + CI wiring

Deliberately left out of this commit (still in your working tree, uncommitted):
- Your in-progress tags refactor — data/tags.yaml, the deleted *_filters.yaml, the card-*/taxonomy.html/baseof.html/etc. changes — not mine to commit.
- CLAUDE.md — my doc additions (link-checker command + the relURL gotcha) are entangled with your refactor's documentation in that same new file, so I left it for you to commit alongside the refactor.
- _claude/notes.md — was already modified before this session.

Two notes:
- I branched (rather than committing to main) per the default for the default branch. To fold it into your trunk-based flow: git checkout main && git merge fix/base-path-internal-links (fast-forward). Nothing has been pushed, so no deploy was triggered.
- Your other uncommitted changes carried over to this branch and will follow you back when you git checkout main.

Done — everything that was pending is now folded into main as two clean commits:

9e6f7d0  Make navbar and layout responsive on mobile        (components.css, layout.css, notes)
51dd35f  Fix internal links dropping base path; add link checker   (+ CLAUDE.md docs)
bf93fc5  Harmonize tags into one registry; type-aware tag & search cards   (your refactor — already committed)

Notes on what I did:
- The bulk of the tags refactor was already committed in bf93fc5, so "commit the refactor" only left its tail (responsive CSS, docs, notes).
- I folded my CLAUDE.md link-checker docs into the fix commit (51dd35f) so the docs travel with the code, and committed the mobile/responsive-nav CSS + session notes as 9e6f7d0.
- The old fix/base-path-internal-links branch is deleted (fully merged).
- Nothing was pushed, so no deploy was triggered.

One heads-up: there are newer uncommitted changes in your working tree that appeared while we were committing — hugo.yaml, data/tags.yaml, layouts/partials/header.html, static/css/tokens/colors.css. These are your in-progress Data nav work (issue #1), not part of "these changes," so I left them alone for you to finish and commit.

Related: that new Data menu item points to /data (pageRef: /data). Once you build, if there's no content/data page yet, check_links.py will flag the menu link as broken — that's the new checker doing its job, not a regression. Add the page (or a linkcheck_allow.txt entry) when you're ready.

## 2026-06-26.a create CLAUDE.md, harmonize tags

  All references check out. I've created /Users/bbest/Github/marinebon/hugo2/CLAUDE.md.

  It deliberately doesn't restate the contributor-facing README (which is already excellent). Instead it captures what a future Claude instance needs to be productive fast:

  - Commands — hugo server / hugo --gc --minify / pagefind, the pinned extended-Hugo version, and the fact that the build is the test (no test suite).
  - Architecture — the two non-obvious systems that require reading several files: the faceted facet.Value tag system (color + filter wiring, and the two-places-must-agree rule for new values) and the issue → PR → deploy contribution pipeline.
  - Conventions & gotchas — the reserved url:, buildFuture for events, image path roots, auto-globe nodes, unsafe: true, CSS token structure.
  - Repo-only dirs — _claude/ (session notes) and tools-review/ (the repo audit), both ignored by Hugo so an agent doesn't mistake them for site content.
  - A pointer to the parent /Users/bbest/Github/CLAUDE.md for R/Python style rules.

  One thing I noticed but left out (flag for you): data/product_filters.yaml uses a different, lowercase facet:value schema (region/tool with dashboard, infographic) that doesn't match the live tool_filters.yaml ProperCase convention — it looks like a legacy/orphaned file. Worth confirming whether it's still used or should be deleted.
  One thing I noticed but left out (flag for you): data/product_filters.yaml uses a different, lowercase facet:value schema (region/tool with dashboard, infographic) that doesn't match the live tool_filters.yaml ProperCase convention — it looks like a legacy/orphaned file. Worth confirming whether it's still used or should be deleted.

Yes, proceed with harmonizing all the tags and their usage. The data/product_filters.yaml is I
  believe vestigial and should be removed (after confirming it is not used), since products was
  renamed to tools (or maybe the tools/ index needs to properly point to the working
  tool_filters.yaml). This should be confirmed by looking at the /tags page, which ideally would
  also describe results here and in the search with different cards  based on content type (like a
  header tag similar to the news card with "month year" over news image).

  All verified — year buttons render descending (2021→2016); minify had just dropped the attribute quotes from my grep. Everything builds clean and works in the browser.

  Summary

  Done. Here's what changed, grouped by your three asks.

  1. Removed the vestigial files
  - data/product_filters.yaml was confirmed unused (referenced nowhere in templates — only tool_filters/paper_filters were). Deleted it, along with tool_filters.yaml and paper_filters.yaml, now superseded by a single source.

  2. Harmonized all tags into one canonical source — data/tags.yaml
  - Every facet (method/tool/place/org/topic/type/year) lives in one file with curated filter-button values plus an aliases map for proper labels of open-set values.
  - Fixed the /tags inconsistency you spotted: Hugo lowercases taxonomy terms, so the old case-sensitive lookup fell back to humanize — the index showed "Geobon", "Noaa iea", "Nationalmarinesanctuaries". tag.html now resolves labels case-insensitively from tags.yaml, so the index reads "GEO BON", "NOAA IEA", "Nat'l Marine Sanctuaries", "AIR Centre", "Seabed 2030" everywhere consistently.
  - tools/list.html and papers/list.html filter bars now read tags.yaml (via each facet's filters: list); the Papers Year buttons are generated from the papers themselves, so import_papers.py no longer writes a filter file.
  - Fixed the stray undefined method.Data-Mgmt → aliased to "Data Management".

  3. Type-aware cards on /tags term pages and search
  - New card.html dispatcher routes by content type: news = month/year badge over banner, events = date, papers = year badge over a placeholder (the news-card motif you described, applied to papers), everything else = generic image card.
  - New layouts/_default/taxonomy.html renders a tag's results grouped by type (verified in-browser: "Genomics" → Working groups, Methods, Tools, Papers with year badges, News, Events).
  - Search (search.html + Pagefind) renders the same type-aware cards with thumbnail + badge. This required emitting per-page Pagefind meta (type/badge/image) in baseof.html — verified in-browser that news shows "JAN 2022", tools "TOOLS", etc., images load, and excerpts are clean (data-pagefind-ignore keeps the hidden meta out of result text).

  Also renamed the vestigially-named card-product.html → card-tool.html, and updated README.md and CLAUDE.md to document the single tags.yaml registry and the card/search architecture.

  Verified throughout: hugo --gc --minify builds clean (442 pages, exit 0), pagefind indexes 329 pages + 5 filters, and I drove the actual rendered /tags/ and /search/ pages in Chrome to confirm.

  Two notes:
  - I did not commit anything (you didn't ask). When you're ready, the relevant changes are the data/, layouts/, scripts/import_papers.py, static/css/components.css, README.md, and new CLAUDE.md/data/tags.yaml files.
  - Your working tree also has unrelated uncommitted edits I didn't touch (data/methods.yaml, layouts/404.html, scripts/check_links.py, scripts/linkcheck_allow.txt) — left them as-is.

## 2026-06-23.b + Tools, incl Trainings, from `marinebon/*`, `noaa-onms/*`, `noaa-iea/*`

Now comb all repositories under github.com/marinebon github.com/noaa-onms and develop a table for considering new additions to the Tools. See also the Glossary and Repository listing of latest paper on MBON indicators with repository references at `/Users/bbest/Library/CloudStorage/GoogleDrive-ben@ecoquants.com/.shortcut-targets-by-id/1sppUmlMtZ-sXaBm72M1-8PnjVudXO91v/US MBON Public Folder/Working Groups/BioIndicators/manuscripts/indicators/ocean_indicators_manuscript_DRAFT_v2.docx`. Try to classify each according to the existing tags (especially tool.*) and record date_last_commit, website if listed, screenshot of website (using webshot2 a la existing tools), status of website, description. Provide a recommendation for inclusion, exclusion, include if updated, etc with any notes. Place the table and images in a safe place within this repository for pushing to the Github repo without interrupting the regular hugo website.

⏺ Done — the review is committed and pushed to `tools-review/` (viewable at github.com/marinebon/hugo2/tree/main/tools-review).

  **What I built**

  **Scope**: Combed all **108 repos** — 90 under `marinebon` + 18 under `noaa-onms` — via the GitHub API, and cross-referenced the indicators manuscript's **Supplement S3 (Source Code Repositories)** and software section to
  prioritize indicator-relevant tools and borrow its descriptions. (The unpublished draft is not reproduced — I deleted the converted text before committing.)

  Disposition: 11 already on-site · **17 candidates** · 80 excluded (websites, workshops, backend infra, superseded demos, analyses).

  **Deliverable in `tools-review/`**:
  - `README.md` — a recommendation table + per-candidate detail cards with embedded screenshots, classified by `tool.*`/method/org tags, each with date_last_commit, website + 🟢/🔴 HTTP status, and a
  recommendation. 
  - `inventory.csv` — all 108 repos with disposition + reason.
  - `img/` — 13 webshot2/chromote screenshots (mirroring your screenshots.R pattern).

  **Top recommendations (Include)**: `obisindicators`, `extractr`, `onmsR` (R packages); `sanctsound` (Portal); `map-of-activities` (App); `eco-indicators` (App — though the screenshot showed it's still an early landing
  page).

  Safe placement: `tools-review/` is a top-level dir Hugo doesn't process — verified the build is clean (exit 0) and nothing leaks into public/.

  Two notes

  - 3 sites are down (404): `obis-hex-map`, `sdm-explore`, `sdg14-shiny` — flagged "include if live/updated."
  - `MarineSDMs` screenshot failed (page render timeout, even via chromote) — noted as unavailable in the doc; the row is otherwise complete.

  Also FYI: inventory.csv includes ~9 manuscript-cited repos in other orgs (CalCOFI, MarineSensitivity, noaa-iea/ecoidx, GEO-BON, iobis) that I listed for context but didn't recommend, since they're outside
  the two orgs you asked me to comb — easy to fold in if you want them considered too.

Excellent! I fixed MarineSDMs website so should now be able to screenshot, and lets include. Also noaa-onms/sanctsound should be tool.Infographic. proceed with including all recs, and promote workshop /    
  course / training materials with new tool.Training (and Trainings into navbar of Tools)   

⏺ The screenshot job is already running in the background and will notify me when it completes — no need for a separate monitor. The filter facet, navbar, and all 19 content pages are done and the build is
  clean. I'll verify the images and commit once the renders finish.

  Interim status:
  - 19 tool pages created (14 software/data + 5 training workshops), build passes.
  - tool.Training facet added + Trainings in the Tools navbar (alphabetical).
  - sanctsound reclassified to tool.Infographic. 
  - MarineSDMs included (site confirmed live again).
  - Held back only obis-hex-map and sdm-explore (still 404).
  - Screenshots rendering into static/img/tools/ (6/19 done so far).

  I'll pick up automatically when the screenshot render finishes to confirm all 19 images landed (re-shooting any failures) and commit everything.

⏺ Committed and pushed. The Tools catalog grew from 16 to 35 entries.

  What was added

  19 new Tools (all with live sites + webshot2 card screenshots in static/img/tools/):

  Software / data (14) — sanctsound (reclassified tool.Infographic per your note), map-of-activities, extractr, obisindicators, onmsR, eco-indicators, edna-vis, aquamaps-downscaled, MarineSDMs
  (re-screenshotted now that you fixed its site), py-dwc-viz, gmbi, extract-app, intertidal-temps, data-reports.

  Training workshops (5) under the new tool.Training facet — USF Moore taxa mobilization (2026), MBON AIR mobilization, and Pole to Pole Mexico / Brazil / Colombia.

  Navbar + filter — added a tool.Training value to data/tool_filters.yaml and a Trainings entry to the Tools dropdown (alphabetical: Apps · Infographics · Packages · Portals · Protocols · Trainings).

  Disposition note added to tools-review/README.md.

  Two things to flag

  - Held back 2 of the 17 recs — obis-hex-map and sdm-explore still return 404 (no live GitHub Pages site). They're ready to add the moment their sites publish; everything else is curated.
  - One adjacent training resource left out of scope: ioos/bio_mobilization_workshop — the canonical IOOS/MBON biological-data-mobilization curriculum (cited by the manuscript), live and directly relevant,
  but it lives in the ioos org rather than the two you asked me to comb. Say the word and I'll add it as a tool.Training too.

  The newer/stronger tools were given lower weights so they sort ahead of the older ones (gmbi, extract-app, intertidal-temps) within the catalog. The site build is clean and the page is live-deployable.


Yes, add `ioos/bio_mobilization_workshop` as a `tool.Training`. Similarly add `tbep-tech/shiny-workshop`, and `noaa-iea/r3-train`. Comb through all repos in https://github.com/noaa-iea and update all relevant files in `@./tools-review`.

Let's move these from `tool.App` to new `tool.Workflow` and add **Worfklows** to Tools navbar:
- [Sanctuary Eco-Indicators · MBON](http://localhost:1313/tools/eco-indicators/)
- [AquaMaps Downscaled · MBON](http://localhost:1313/tools/aquamaps-downscaled/)
- [Intertidal Temperatures · MBON](http://localhost:1313/tools/intertidal-temps/)
And a few more changes:
- [MarineSDMs · MBON](http://localhost:1313/tools/marine-sdms/): tool.Package -> tool.Protocol
- [onmsR · MBON](http://localhost:1313/tools/onmsr/): for image use https://noaa-onms.github.io/onmsR/reference/figures/onmsR.svg with white background padding.
- [seascapeR · MBON](http://localhost:1313/tools/seascapr/): similarly to onmsR, use white backgrounded https://marinebon.org/seascapeR/logo.svg.


⏺ All done and pushed. Summary of this pass:

  Tools site changes
  
  - New tool.Workflow facet + Workflows in the Tools navbar (alphabetical, after Trainings). Moved eco-indicators, aquamaps-downscaled, intertidal-temps from tool.App → tool.Workflow.
  - MarineSDMs: tool.Package → tool.Protocol.
  - 3 new tool.Training tools with screenshots — ioos/bio_mobilization_workshop, tbep-tech/shiny-workshop, noaa-iea/r3-train (Tools catalog now 38, with 8 trainings).
  - onmsR and seascapeR card images replaced with their white-padded SVG hex logos (rsvg-convert → PIL composite on a 16:10 white canvas).

  noaa-iea sweep → tools-review/

  Combed all 20 noaa-iea repos: 2 already on-site (fk-esr-info, ak-info), 6 candidates, 12 excluded. Added to:
  - inventory.csv (now 128 repos across the three orgs)
  - README.md — a new "noaa-iea sweep" section with a recommendation table + screenshots, plus an updated change-log banner.

  Candidates surfaced (in the review, not auto-added to the site): ecoidx (manuscript-cited IEA indicator package — include if updated), ca-esr-info (California Current ESR infographic — include, sibling of
  the on-site FK/AK infographics), and three demo/borderline ones (ecoidx-report, ecoidx-dashboard, fl-wq — maybe). r3-train is both a noaa-iea candidate and one of the three I added to the site this pass.

  Build is clean (0 errors), tools-review/ stays out of the Hugo output.

  One small note for next time: those two review candidates — ecoidx and ca-esr-info — are the strongest noaa-iea additions (ecoidx is manuscript-cited; ca-esr-info matches infographics you already publish).
  Say the word and I'll promote them onto the site like the others.

✻ Baked for 9m 19s

Yes, add ecoidx, ca-esr-info, fl-wq. Fix the missing basemap in `@~/Github/noaa-iea/fl-wq`

⏺ Both parts done and pushed.

  **fl-wq basemap fix** (`noaa-iea/fl-wq`, pushed to master)

  Root cause: Esri retired the Ocean_Basemap MapServer — its tile URL now returns HTTP 500, so the Leaflet map showed only the marker + attribution with blank tiles. The fix switches to the live
  Ocean/World_Ocean_Base service (verified 200):
  - date_template.Rmd — replaced addProviderTiles(Esri.OceanBasemap) with explicit addTiles() URLs (durable — no longer depends on the leaflet-providers alias), plus the ocean reference/labels layer.
  - docs/site_libs/.../leaflet-providers_1.9.0.js — updated the bundled provider variant so the already-deployed dashboards render tiles immediately (shared site_libs, so all date pages fixed at once).

  I confirmed the redeploy went live and the screenshot now shows the SW-Florida coastline behind the marker.

  **3 tools added** to the site (hugo2, pushed to main)

  - **ecoidx** — tool.Package · method.Indicators · org.NOAA-IEA (manuscript-cited IEA indicator package)
  - **California Current ESR Infographic** — tool.Infographic · org.NOAA-IEA (sibling of the Florida Keys ESR and Alaska IEA infographics)
  - **Fisher Water Quality Monitoring** (fl-wq) — tool.App · place.South-Florida · org.NOAA-IEA, screenshotted after the basemap fix

  The tools-review/README.md now marks all three as included (with a change-log banner noting the fl-wq basemap fix), and tools-review/img/fl-wq.png was refreshed to the fixed version. The Tools catalog is now 41 entries; build is clean.

  One note: I left three of your in-progress edits untouched and uncommitted in the working tree — extract-app.md (draft: true), and gmbi.md / py-dwc-viz.md (tool.App → tool.Package). They're yours to commit when ready; say the word if you'd like me to fold them into a commit instead.


Add these two:
- ioos/bio_data_guide: tool.Protocol, tool.Training
- bbest/dismapr: tool.Package

⏺ Both added and pushed. Tools catalog is now 43 entries.

  - Bio Data Guide (ioos/bio_data_guide) — tool.Protocol + tool.Training, plus org.OBIS and place.Global. IOOS Standardizing Marine Biological Data Working Group's guide for mobilizing biological data to
  Darwin Core/OBIS.
  - dismapr (bbest/dismapr) — tool.Package, plus method.Traditional and place.US. R access to NOAA's DisMAP species-distribution/range-shift APIs (derived from bottom-trawl surveys).

  Both sites are live (200), screenshotted as card images, build is clean. Since bio-data-guide carries both tool.Protocol and tool.Training, it'll surface under both the Protocols and Trainings filters/nav.

## 2026-06-23 tag tool.Library -> Package

Let's change tag `tool.Library` to `tool.Package` and update the navbar Tools accordingly to **Packages** (keeping alphabetical order).

### pad seascapeR hex logo
Can you pad the `seascapeR` **hex logo** https://marinebon.org/seascapeR/reference/figures/logo.png so the entirety of it (with subtle margin) appears in the card [Image #1]

### fix funk cards: grafana dashboard, fk storymap

Come up with a standardized fix for these 2 tools: 1) https://marinebon.org/hugo2/img/products/early-alert-dashboard.png needed more time to render. 2) https://marinebon.org/hugo2/img/products/storymap-fk-fwri-water-quality.png is crazy long full page without any of the images loaded (probably more time needed to render). The point is to make the cards look nice. Also noticing the vestigial "products" name in img url that should be swapped for updated "tools"

## 2026-06-22 **methods** content and hero

Let's brainstorm on adding another content type **methods** that has its own hero section below the first hero and above the network globe. Each page should hightlight the different methods for observing, synthesizing and disseminating that MBON seeks to advance. These are also reflective of the working groups: genomics (DNA, eDNA), remote sensing (seascapes, imagery), tracking (telemetry), sound (passive & active acoustics), indicators (synthesis, dissemination), data management (DMAC, data sharing). It should also give some mention of supporting and augmenting traditional methods (trawl, visual & acoustic survey), which can be expensive at scale. Come up with a prompt for an image-generating LLM to make a graphic that can be converted to an interactive display in the hero section highlighting each method, so method labels live seperatly on top and when icon hovered shows a description.

We're looking for a simplified scientific illustration, but let this graphic be an inspiration [Image #2] 

**PLAN**: `@./_claude/2026-06-22 add methods.md`

Excellent, proceed with Gemini Pro image generated to `~/Downloads/gemini_pro.png`

Make the description show on hover. Resolve the z-index problems with the underlying point markers showing throught the description per [image screenshot]

⏺ Two root causes fixed:

  1. Hover now works — removed hidden attribute from the tip <div> in the template. The attribute's browser-level display:none was overriding the CSS :hover rule regardless of specificity. Tips are now hidden
  purely by display:none in CSS, which :hover / :focus-within / .is-active can freely override.
  2. Z-index bleed-through fixed — added z-index:30 to the entire .method-spot wrapper on hover/focus/active. Previously each spot sat at z-index:2 and the tip had z-index:20 within that stacking context,
  meaning sibling spots (also at z-index:2) could paint over it. Elevating the whole hovered wrapper to z-index:30 puts it above all idle sibling spots and their pins.


Add Methods to navbar. Rename Products to Tools (and associated content and content types), which will be software and data portals. Clean up the tags (http://localhost:1313/tags/) and filters (eg in old Products / new Tools) to consistently refer to tags from recently added "Method. remote sensing" to "method.remote sensing" but then consistently drop the prefixes (eg "method.") and color code for given category. Rename Regions to "place." Resolve a prefix for all tags, creating new ones if need be. Can we update the Search page to filter across content types for any given tag (along with free text search)?

⏺ This is a wide-ranging refactor. Let me survey the full picture before touching anything.

Move "Genomics & eDNA" (not EDNA) to above the double helix, and the Indicators & Data to above the dashboards (over land) per screenshot with pink arrows [image]

Now the descriptions for Methods hover/click are cutoff by border [Image #6] [Image #7]

⏺ Pushed. Here's what landed in this commit:

  - Products → Tools: all 17 content files, both layout templates, and products-filter.js renamed via git mv; every template reference (/products/ hrefs, button text, section headers, footer links) updated
  - Tag normalization: all content across methods, network, news, and tools normalized to prefix.value dot notation (e.g., place.global, method.genomics, org.noaa)
  - New CSS token variables: --facet-place, --facet-method, --facet-topic with matching .tag--place, .tag--method, .tag--topic classes
  - JS filter: tools-filter.js now matches facet + '.' + val and uses data-tool-* attributes
  - Methods hotspot positions: genomics moved to x=73,y=42 (above DNA helix); indicators moved to x=93,y=22 (dashboard strip)
  - Search: Pagefind filter facets wired up (method, place, org, type, topic) with data-pagefind-filter spans injected into all single-page templates — the search page will show facet checkboxes once you
  rebuild the pagefind index with npx pagefind --site public


⏺ Two changes landed:

  1. overflow:hidden removed from .methods-scene — tooltip cards can now escape the image boundary. border-radius moved onto the <img> tag so the image corners still look rounded.
  2. Edge-anchor modifiers — the template automatically assigns:
    - .method-spot--right when x > 75 (Indicators at 93, Genomics at 73) — tooltip aligns its right edge to the pin instead of centering, preventing rightward overflow
    - .method-spot--left when x < 25 (Tracking at 14) — tooltip aligns its left edge to the pin

  Refresh the dev server and the cards for Genomics and Indicators should now be fully visible.

The tag caps scheme is inverted: category.TagProper should be the way. Also let's add partners (revisit @../marinebon.github.io/) to the Network nav and convert Thematic BONs to Working Groups, adding eDNA, indicators, eco-indicators and data as working groups. Expand the Methods menu to a simple drop-down.

⏺ Pushed. Here's what landed:

  Tags — All 202 tag instances across 80 files renamed to prefix.ProperCase. topic.thematic became topic.Working-Group. tool_filters.yaml values updated to match.

  Network dropdown now has three columns:
  - Regional MBONs (unchanged)
  - Working Groups — BioSound, BioTrack + 4 new: eDNA, Indicators, Eco-Indicators, Data Management
  - Partners — 10 orgs with external links (IOOS, GEOBON, GOOS, GEO, OBIS, AIR Centre, GCRMN, MarineGEO, SCAR, LifeWatch)

  Methods — now a single-column dropdown listing all 6 method pages with a chevron caret, consistent with the Network dropdown style.

### methods hero image

The image needs to be redone. Google Gemini Pro NanoBanana is much better at one shot images -- tweaks become fraught with complications. Provide a fresh prompt borrowing with old:

```
A wide-format (16:9) scientific illustration in a simplified, flat-diagram style showing a cross-section of the ocean environment from outer space to the seafloor. Style: clean vector-like scientific illustration with a limited palette of deep navy, ocean teal, steel blue, and warm coral accents on a near-black navy background. No text or labels anywhere in the image.

Composition, top to bottom:
— Space / upper atmosphere: a satellite in low Earth orbit, downward-looking sensors implied by subtle scan-line fans toward the ocean surface.
— Open ocean surface: a research vessel on the water, with a trawl net implied below the hull; seabirds in flight; faint sonar cone radiating downward from the hull.
— The ocean surface itself as a crisp, luminous boundary layer with gentle waves.
— Shallow coastal zone (right side): kelp forest and coral reef visible near the seafloor edge; a diver with a camera and slate floating mid-column.
— Mid water column (center): a streamlined underwater glider/AUV emitting acoustic fan beams in multiple directions; a hydrophone mooring rising from the seafloor with signal rings; two or three fish with small tag devices on them, signal arcs radiating outward; a faint double-helix DNA strand spiraling upward from a water-sampling bottle, indicating environmental DNA capture.
— Deep seafloor (bottom): benthic lander instrument package with sensor arms; soft coral and sparse invertebrates for ecological context.
— Far right edge: a translucent data-visualization overlay — a thin vertical strip showing abstract time-series lines and a world-map heat-map fragment — suggesting the synthesis and dissemination pipeline.

Atmosphere: deep, luminous, scientifically authoritative. The underwater lighting should suggest sunlight refracting through the surface. The overall tone is dark ocean blue with teal bioluminescence accents. The illustration should feel like a premium magazine centrepiece — detailed enough to reward close inspection but clean enough to work as a UI background. Aspect ratio 16:9, no letterboxing.
```

Running this in Gemini 3.5 Thinking produced: `@~/Downloads/gemini_thinking.png`

Then upgrading to  Gemini 3.1 Pro produced: `@~/Downloads/gemini_pro.png`

But then here are my complaints for Pro:

```
I like that there is a fish and coral. Add a whale and turtle. Remove the seafloor robot, but add cables extending from traditional ship a drone and bottle collector with eDNA above. Remove the robotoic arm holding the DNA attached to the rock

I like that there is a fish and coral. Add a whale and turtle. Remove the seafloor robot, but add cables extending from traditional ship a drone and bottle collector with eDNA above. Remove the robotoic arm holding the DNA attached to the rock
```

And it produced: `@~/Downloads/gemini_pro_v2.png`

The rosette should not be on the floor. Probably a good idea to include a buoy in the scene and emphasize instruments/vessels maybe a shore-based rocky/sandy beach quadrat with person above like human in loop with scuba already.

  ---
  Key changes from the v2 prompt:
  - Rosette moved to mid-water on a ship cable, not the seafloor
  - Shore scene added far-left: person doing quadrat survey on rocky intertidal
  - Buoy added at surface with mooring cable 
  - Drone added above the ocean near the satellite
  - No seafloor robot or robotic arm — explicitly removed
  - Whale and turtle kept from v2
  - Data strip stays far right 

Ok, use the latest `@~/Downloads/gemini_thinking_v3.png`. This image is ~6 MB (like the previous), so should get downsampled for use on the web.

### **papers**

Let's add **papers** as a new content type and navbar item with allowance for any of the tags. The papers should be filterable by tags and absorbable via Coins -- maybe a Hugo helper out there.  Hugo websites handle academic citations and publications using plugins like [Hugo-Bibliography](https://dh-tech.adho.org/blog/2025/07/11/hugo-bibliography/) or tools like [Hugo Simple Cite](https://github.com/joksas/hugo-simplecite) or [Lucid Manager Bibliography](https://lucidmanager.org/productivity/hugo-bibliography/). These tools expose bibliography entries via COinS (OpenURL-based metadata), enabling reference managers like Zotero to automatically detect and import publication citations directly from the webpage.

I'm seeing some publications on the old websit here:
https://web.archive.org/web/20231213233358/https://marinebon.org/publications/. Perhaps extractable in @../marinebon.github.io.

⏺ Pushed. Here's what's live:
  
  - /papers/ — filterable list of 88 publications, sorted newest first, with Method and Year facets using the same JS filter pattern as Tools
  - /papers/{slug}/ — single paper page with full author list, journal, DOI link, abstract, and an invisible <span class="Z3988"> COinS element — the Zotero browser connector will detect it and offer
  one-click import
  - Papers in the navbar at weight 4 (between Methods and Tools)
  - scripts/import_papers.py left in the repo so you can re-run it if the source library is updated

  The COinS title attribute on the andruszkiewicz paper encodes all 6 authors, title, journal, year, and DOI correctly. Install the Zotero browser connector and visit any single paper page to test the import.

### re-org: network -> node, working-group

We need to reorganize the content:

- There are not actually thematic nodes to MBON in its current form -- they are simply **Working Groups** (WG) that are tightly connected to Methods. WGs should be a seperate content type `working-group` with `Lead(s)` pointing to individuals in the content type YAML. 
  * biosound.md
  * biotrack.md
  * data-mgmt.md
  * eco-indicators.md
  * edna.md
  * indicators.md
A button to all the Working Groups could link out from the Methods hero as well as the Network hero. 

The "Strategic collaborators" (which is really the subtitle to Partners) should show up at the bottom of Network hero and a link out to the **Partners** page, which should have each listed with a header and description (to be fetched from a new yaml `partners` content type). The Partners link should also be added to the Network navbar.

- The Regional MBONs should be split in the hero and navbar into:
  * International
    - asia-pacific-mbon.md
    - europe-mbon.md
    - pole-to-pole-americas.md
  * USA
    - arctic-mbon.md
    - central-california-mbon.md
    - coastal-new-england-mbon.md    
    - great-lakes-mbon.md
    - gulf-of-maine-mbon.md    
    - mid-atlantic-mbon.md
    - northern-california-current-mbon.md
    - south-florida-mbon.md
    - southern-california-bight-mbon.md

The **Tools** should become better organized with a new drop-down navbar pointing directly to the tools page filtered by one of: "Portals" (Type.Portal -> tool.Portal), "Apps" (tool.App), "Infographics" (Type.Infographic  -> tool.Infographic), "Libraries" (tool.Library), "Protocols" (tool.Protocol).

- biotrack-portal.md: tool.Portal
- climate-dashboard-app.md: tool.App
- climate-dashboard.md: tool.App
- coastwatch-obis.md: tool.App
- early-alert-dashboard.md: tool.App
- edna-explorer.md -> mbon-data-portal: tool.Portal
- infographic-cinms.md: tool.Infographic
- infographic-florida-keys-esr.md: tool.Infographic
- infographic-iea-alaska.md: tool.Infographic
- infographic-ocnms.md: tool.Infographic
- infographiq.md: tool.Library
- pole-to-pole-atlas.md: tool.Protocol
- sanctuary-condition-reports.md -> sanctuary-watch.md: tool.Portal, tool.Infographic
- seascapes-viewer.md: tool.App
- seascapr.md: tool.Library
- storymap-fk-fwri-water-quality.md: tool.Infographic

Tags that should get dropped: Type.Tool, Type.Data, Type.Instance
Tags that should get renamed: Org.NMS -> org.NationalMarineSanctuaries

Comb throughout the website for any inconsistencies, including navbar, footers, related / cross-linked content. For instance, all tags should have a lower prefix before "." and use capitals after.

Can you add tags to the Search interface, perhaps selectable from auto-complete list with AND (vs OR) to filter?

⏺ Everything pushed. Here's a summary of what was done across all 5 areas:

  A. **Working Groups** — 6 files moved from `content/network/` → `content/working-groups/` with `leads:` field added. New `layouts/working-groups/list.html` + `single.html`. Old `/network/biosound/` etc. redirect via
  aliases. "View working groups" CTA added to both the methods band and the network hero.

  B. **Partners** — 10 partner entries in `data/partners.yaml` now have descriptions. `/network/partners/` shows logo + name + description cards. The Network hero shows the partner logo strip with a "View all
  partners →" link. Nav dropdown replaced the 10 individual partner links with a single "All partners →" link.

  C. **Regional split** — 12 nodes tagged with `geo: USA` or `geo: International`. Nav now has USA (9 nodes) + International (3 nodes) columns. Network list page has separate USA and International grid sections.

  D. **Tools dropdown** — Nav Tools item now has a dropdown: All / Portals / Apps / Infographics / Libraries / Protocols. `/tools?tool=Portal` pre-activates the Portal filter. `type.*` tags replaced with `tool.*`
  across all 16 tools. Two files renamed (`edna-explorer` → `mbon-data-portal`, `sanctuary-condition-reports` → `sanctuary-watch`) with aliases. `org.NMS` → `org.NationalMarineSanctuaries` everywhere.

  E. **Search** — Custom autocomplete widget using the programmatic Pagefind API. Type-ahead tag suggestions from `pagefind.filters()`, dismissible chips, AND logic across selected facets. The `?q=` URL param still
  pre-fills the text search.

  Note: the WG `leads` for data-mgmt, eco-indicators, edna, and indicators are placeholder "TBD" — you'll want to fill those in with actual names.

The Tools filter doesn't seem to actually filter anything, eg http://localhost:1313/tools/?tool=Portal shows All and I am not seeing the Portal tag selected 

⏺ Pushed. The two root causes were:
  
  1. Timing race — defer scripts run just before DOMContentLoaded fires, but Hugo's dev server sometimes delivers the script after that event has already fired. Wrapping in
  addEventListener('DOMContentLoaded', ...) then silently does nothing. The fix is the readyState === 'loading' guard: if the DOM is still loading, wait for the event; if it's already ready, call init()
  immediately.
  2. preBtn.click() bypassed — simulating a DOM click event to pre-activate a filter is fragile. The fix directly writes into sel and adds the is-active class, then calls apply() unconditionally at the end of
  init().

  Hard-refresh the page (Cmd+Shift+R) to clear the cached old JS, then try /tools/?tool=Portal — you should see the Portal button highlighted and only the 3 portal tools showing.

Add leads:
- Data Management: Matt Biddle (NOAA Integrated Ocean Observing System)
- Indicators: Ben Best (Ocean Metrics LLC)
- eDNA: Luke Thompson (NOAA Atlantic Oceanographic and Meteorological Laboratory)
- Eco-Indicators: Joshua Kilborn (University of South Florida)

⏺ Done. All four working groups now have named leads — Matt Biddle, Ben Best, Luke Thompson, and Joshua Kilborn. BioSound and BioTrack already had leads (Liz Ferguson/Neil Hammerschlag and Neil Hammerschlag respectively), so all six working groups are now fully populated.

Consider revising the Network hero with spinning globe to seperate the many USA nodes from the few International MBON nodes. Update text since no longer showcasing "thematic" nodes -- these are simply the Working Groups (mentioned above in Methods hero). And the Partners did not get migrated from below into the Network hero. Reconsider all titles, subtitles and text in the home page for consistency. Also, consider alternating light and dark between sections which presently are not (viewing from top to bottom): white navbar, blue overview, dark blue Methods, lighter blue Network, white News, white Tools, dark Strategic Collaborators (Partners which should be moved up to Network hero), and dark footer. 

⏺ Good. Now I have the full picture. Here's my plan:

  Color fix: swap News (white → currently tint) and Tools (tint → currently white), move partner strip from footer into the globe section. This produces: dark(hero) → dark(methods) → dark(globe+partners) →
  white(news) → tint(tools) → dark(footer) — proper alternation.

  Globe: split chips into USA / International labeled groups, remove "thematic" text, add partner strip at bottom.

  Network page: remove partner strip from page-header (it'll be in the globe section below).


⏺ Done. Here's what changed and why:
  
  Section color rhythm (homepage, top to bottom):

  ┌──────────────────┬───────────────────────────────────────┬────────────────────────────────────────────────────────────────────────┐
  │     Section      │                Before                 │                                 After                                  │
  ├──────────────────┼───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Hero             │ dark photo                            │ dark photo ✓                                                           │
  ├──────────────────┼───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Methods          │ dark                                  │ dark ✓                                                                 │
  ├──────────────────┼───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Globe + Partners │ dark / separate dark stripe at bottom │ dark (partners now live inside the globe section)                      │
  ├──────────────────┼───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ News             │ foam tint                             │ white — stronger contrast after dark                                   │
  ├──────────────────┼───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Tools            │ white                                 │ foam tint — alternates with white news                                 │
  ├──────────────────┼───────────────────────────────────────┼────────────────────────────────────────────────────────────────────────┤
  │ Footer           │ dark                                  │ dark ✓ (now arrives cleanly without the orphaned partner stripe above) │
  └──────────────────┴───────────────────────────────────────┴────────────────────────────────────────────────────────────────────────┘

  Globe changes:
  - Node chips split into a "USA" group (9 nodes) and an "International" group (3 nodes), each with a faint monospaced label above
  - Heading updated to "Regional nodes from Arctic to Antarctic" (no more "thematic")
  - Partners logo strip now lives at the bottom of the globe section on both the homepage and the /network/ page — one consistent location

  Network page: Partner strip removed from the page-header (where it used the wrong CSS class). It now appears in the globe section immediately below, using the correct .globe-partners styling on the dark
  gradient background.

Drop the duplicative orange dot in the label of the globe (already orange dot on map and only one label showing at a time).

Change Network hero title from "Regional nodes from Arctic to Antarctic" "Regional nodes from the US and Internationally"


⏺ Done. Two changes:
  
  1. Globe canvas labels — the small 3px dot that was drawn inside the text callout box (both the orange active dot and yellow hover dot) is removed. The label now starts flush after the stem line, with the
  box sized to fit just the text. The node's main dot on the globe surface still shows the orange/yellow indicator.
  2. Globe heading — changed from "Regional nodes from Arctic to Antarctic" to "Regional nodes from the US and internationally".

### 404 not found

Populate a lovely 404 page that automatically shows search results                                                                                                                                            
⏺ All good. Here's what was built:

  layouts/404.html — A "Lost at Depth" page with:
  - Eyebrow label — Signal lost · depth unknown in teal mono
  - "404" numeral — enormous (clamp(6rem, 22vw, 14rem)), gradient from aqua-100 → teal-300 → cobalt-300 → navy-500, with a pulsing bioluminescent glow animation
  - Volumetric light rays — conic-gradient shafts that slowly drift
  - 32 bioluminescent bubble particles — generated by JS, float upward with random size/speed/phase/opacity
  - Wave SVG — organic break between the dark abyss hero and the light search surface
  - Auto-search — extracts terms from the 404 URL path (strips stop words, numbers, short fragments), pre-fills Pagefind and fires the search automatically; hint text shows Showing results for <em>term</em>
  - Action buttons — "↑ Return to surface" and "Browse all"

Looks good, but the suffix to the website was not populated into the Search

⏺ Three fixes applied:

  1. .replace(/\.html?$/i, '') — strips .html/.htm from the path before splitting, so accessing /404.html directly → path becomes /404 → 404 is all digits → filtered → terms = "" → shows "Explore MBON content
  below" instead of searching for the useless word "html".
  2. Split regex changed from /[\/\-_\.]+/ to /[\/\-_]+/ — no longer splits on dots, so paths like /tools/my.tool stay coherent.
  3. Particles moved before PagefindUI and PagefindUI wrapped in try/catch — particles always render even if pagefind isn't built yet.

  In production (Netlify/GitHub Pages), the real 404'd URL is preserved in the address bar, so /papers/lafferty-at-2021 correctly yields search terms papers lafferty.

### add **benthic survey**

Add benthic surveys to Methods and hero (quadrat person on coast already in image), at sea and on coast (especially rocky tidal and sandy beach; photo quadrat). Differentiate from surveys at sea (∆ "Traditional Surveys" to "Traditional At-Sea Surveys" for label on hero image). 

Link to tools/pole-to-pole-atlas

⏺ Done. What changed:
  
  - New "Benthic Surveys" hotspot placed at the rocky coast on the left side of the illustration (x=14, y=46) — exactly where the quadrat figure already is in the image. Tooltip appears to the right of the
  pin via the method-spot--left class. Covers rocky intertidal transects, sandy-beach surveys, and photo quadrats.
  - New /methods/benthic/ page with kelp.jpg banner, full description of all three coastal survey types, and a direct link to the Pole to Pole Data Atlas in the final section.
  - "Traditional Surveys" → "Traditional At-Sea Surveys" in both data/methods.yaml (hotspot label) and content/methods/traditional.md (page title), making the ship vs. shore distinction explicit.
  - Pole to Pole Atlas now tagged method.Benthic so it surfaces when users filter tools by benthic method.
  - tool_filters.yaml has Benthic added to the method facet for the tools filter bar.

Alphabetically order the Methods navbar elements

⏺ Done. The Methods dropdown now reads: Acoustics → Benthic Surveys → Genomics & eDNA → Indicators & Data Management → Remote Sensing → Tracking → Traditional At-Sea Surveys.

Alphabetically order the Tools navbar elements

⏺ Done. Tools dropdown now reads: All Tools → Apps → Infographics → Libraries → Portals → Protocols.

### Github Issue templates (+ events content type)

Design Github Issue templates to enable issue creation to add or edit content. Pre-populate with all necessary YAML and instructions with help on finding tags and formatting basics. Make these consumable via a Github Action that imports images and injects content into the website. Consider a link directly on the pages enabling issue creation for edits of existing content. I think this is all doable, but be creative with the most efficient system that minimizes the technical burden for end users contributing.

In reality events should be its own content type too, and added under the News navbar, with a listing. Please do that first, then the rest. 

←  ☒ Edit flow  ☒ Add forms  ☐ Papers  ✔ Submit  →

For editing existing pages, how should the on-page link behave?

 1. Issue form + GitHub      ✔    ┌───────────────────────────────────────────┐
   editor                         │ Page footer:                              │
  2. Issue form only              │   ✏️  Suggest an edit   ·   Edit on GitHub │
  3. GitHub editor only           │    └ issue form          └ raw web editor │
                                  │      → Action → PR          → instant PR  │
                                  └───────────────────────────────────────────┘

←  ☒ Edit flow  ☒ Add forms  ☐ Papers  ✔ Submit  →

Which content types should get dedicated 'Add new…' issue forms?

 1. News, Events, Papers,    ✔    ┌───────────────────────────────────────────┐
   Tools                          │ Add forms:                                │
  2. All content types            │ - Add News                                │
  3. News & Events only           │ - Add Event                               │
                                  │ - Add Paper                               │
                                  │ - Add Tool                                │
                                  │ (Network/WG → generic edit)               │
                                  └───────────────────────────────────────────┘

←  ☒ Edit flow  ☒ Add forms  ☒ Papers  ✔ Submit  →

How should adding a Paper work?

  1. DOI auto-fill                ┌───────────────────────────────────────────┐
  2. Full manual form             │ Form:                                     │
❯ 3. Both (DOI or manual) ✔       │   DOI (optional, auto-fills)              │
                                  │   — or —                                  │
                                  │   Title/Authors/Year/...                  │
                                  │   (manual fallback)                       │
                                  └───────────────────────────────────────────┘


⏺ Done — all five parts are implemented, verified with clean Hugo builds, committed, and pushed to main.

  **What shipped**

  **Part 1 — Events content type**. content/events.md split into 13 per-event files under a new content/events/ section, with layouts/events/{list,single}.html, a range-aware event-date.html formatter, and
  card-event.html. News is now a navbar dropdown (All News + Events). All dates display faithfully (Nov 1–4, 2022, October 2021, 2016–2018).

  **Part 2 — Issue Forms**. .github/ISSUE_TEMPLATE/ forms for News, Event, Paper, Tool, plus an Edit form and chooser config. Contributors pick tags from dropdowns (no facet.Value typing), drag-drop images, and
  get inline formatting help. Each auto-labels content:<type>.

  **Part 3 — Action + builder**. scripts/issue_to_content.py (tested for all five types) builds the Markdown file, maps friendly labels → facet.Value tags, imports dragged-in images, auto-tags methods, and
  fetches Crossref metadata for papers given a DOI. .github/workflows/content-from-issue.yml parses the form, runs the script, and opens a PR. buildFuture: true so upcoming events publish.

  **Part 4 — On-page links**. Every content page gets a ✏️  Suggest an edit (pre-filled issue) + Edit on GitHub bar (wired once in baseof.html), and the News/Events/Tools/Papers list pages get + Add buttons.

  **Part 5 — README**. Rewritten to correct the stale architecture and document the full contributor and maintainer procedures.

  **One manual setup step for the maintainer**

  For the workflow to open PRs with the default token, enable in repo Settings → Actions → General → Workflow permissions:
  - "Read and write permissions", and
  - "Allow GitHub Actions to create and approve pull requests"

  Without that toggle, create-pull-request fails with a permissions error. (The forms, on-page links, and Events type all work regardless.)

  **Note on your in-progress edits**

  I left your staged globe/hero/layout.css/_claude changes (the "reduce right-panel height" work) untouched and uncommitted — none of my commits include them, so they're still yours to finish.

  One thing worth deciding when you can test it live: the edit form's auto-apply only triggers when someone pastes a full ```markdown block; plain-language edit requests are left for a maintainer. If you'd prefer the on-page "Suggest an edit" to always prefill the current page content for editing, that's a worthwhile follow-up — but it runs into GitHub's URL-length limit on long pages, which is why I didn't default to it.


### tag fix

Why are all the news tags of incorrect format, eg "Place. pole to pole" vs "place.Pole-to-Pole" and not synchronized the tags page? Clean this up. Why also are the tags in the tags page not sorted alphabetically? [Image #3] [Image #4]

⏺ All fixes applied. Here's the full summary:

  Root causes:
  1. card-news.html called humanize (index . 0) on the raw full string "place.Pole-to-Pole" → the dot becomes a period with a space, giving "Place. pole to pole". Fixed to partial "tag.html" (index . 0).
  2. news/single.html had the same bug — humanize . on full tag strings in the banner. Fixed to partial "tag.html" ..
  3. tag.html emitted tag--Place (uppercase) when given a title-cased input; CSS only defines tag--place. Fixed with $facet | lower.
  4. Tags page had no dedicated template, falling back to _default/list.html with unsorted .Pages. Created layouts/tags/terms.html using .Pages.ByTitle for alphabetical order and rendering each tag via the
  tag.html partial (colored chips linking to their tag page).
  5. Bonus: humanize was ordinalizing years ("2016th"). Fixed with a numeric check — pure digit values skip humanize and display as-is.