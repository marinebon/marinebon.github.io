#!/usr/bin/env python3
"""
Write papers / events / tools from a curated ingest file (YAML) into content/,
through the same builders the issue-form pipeline uses (issue_to_content.py),
so an AI-extracted record and an issue-form submission produce identical pages.

  python3 scripts/ingest_extracted.py _claude/ingest/2026-10_all-hands.yaml [--dry-run]

The ingest file is the hand-off point: an LLM reads unstructured sources (slides,
reports, agendas, email) into it, a person reviews it, this script applies it.
  papers: [{doi, related?, method?, src}]   -> metadata comes from Crossref, not the source
  events: [{title, date, end_date?, location?, event_url?, summary, topic?, related?, body?, src}]
  tools:  [{title, summary, links: ["label|url"], tool?, place?, org?, method?, portal?,
            other?: [facet.Value], related?, body?, src}]
Existing pages are never overwritten: a paper is skipped when its DOI is already in
content/papers/, an event or tool when its file already exists.
"""
import os, re, sys, glob, unicodedata
import yaml

sys.path.insert(0, os.path.dirname(__file__))
import issue_to_content as itc  # noqa: E402

STOP = {"a", "an", "the", "of", "on", "in", "for", "and", "to", "from", "with", "toward", "towards"}

def existing_dois() -> set:
    out = set()
    for f in glob.glob("content/papers/*.md"):
        m = re.search(r"^doi:\s*['\"]?([^'\"\n]+)", open(f, encoding="utf-8").read(), re.M)
        if m:
            out.add(m.group(1).strip().lower())
    return out

def csv(v) -> str:
    return ", ".join(v or [])

def ascii_fold(s: str) -> str:
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()

def paper_slug(family: str, title: str, year) -> str:
    family, title = ascii_fold(family), ascii_fold(title)
    word = next((w for w in re.findall(r"[a-z0-9]+", title.lower()) if w not in STOP), "")
    return itc.slugify(f"{family}-{word}-{year}")

def build_paper(rec):
    doi = rec["doi"]
    m = itc.crossref(doi)
    # name-only entries are organizations (often a mis-registered affiliation): skip them
    people = [a for a in m.get("author", []) if a.get("family")]
    authors = [" ".join(p for p in [a.get("given", ""), a["family"]] if p) for a in people]
    d = {"doi": doi, "authors": ",".join(a.replace(",", " ") for a in authors),
         "tags_method": csv(rec.get("method")), "related": "\n".join(rec.get("related") or [])}
    section, _, fm, body = itc.build_paper(d)
    # crossref titles/abstracts carry JATS markup whitespace and a leading "Abstract"
    fm["title"] = re.sub(r"\s+", " ", fm["title"]).strip()
    if fm.get("abstract"):
        fm["abstract"] = re.sub(r"^(abstract)\s*", "", re.sub(r"\s+", " ", fm["abstract"]).strip(), flags=re.I)
    family = people[0]["family"] if people else fm["title"].split()[0]
    return section, paper_slug(family, fm["title"], fm.get("year", "")), fm, body

def build_event(rec):
    d = {k: rec.get(k) for k in ("title", "date", "end_date", "location", "event_url", "summary", "body")}
    d["tags_topic"], d["tags_method"] = csv(rec.get("topic")), csv(rec.get("method"))
    d["related"] = "\n".join(rec.get("related") or [])
    return itc.build_event(d)

def build_tool(rec):
    d = {k: rec.get(k) for k in ("title", "summary", "body")}
    d["links"] = "\n".join(rec.get("links") or [])
    for fid, key in (("tags_tool", "tool"), ("tags_place", "place"),
                     ("tags_org", "org"), ("tags_method", "method")):
        d[fid] = csv(rec.get(key))
    d["tags_other"] = ", ".join([f"portal.{p}" for p in rec.get("portal") or []] + (rec.get("other") or []))
    d["related"] = "\n".join(rec.get("related") or [])
    return itc.build_tool(d)

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry = "--dry-run" in sys.argv
    if len(args) != 1 or not os.path.exists(args[0]):
        sys.exit("usage: ingest_extracted.py <ingest.yaml> [--dry-run]")
    spec = yaml.safe_load(open(args[0], encoding="utf-8"))
    have = existing_dois()
    written, skipped = [], []

    jobs = ([("paper", r) for r in spec.get("papers") or []] +
            [("event", r) for r in spec.get("events") or []] +
            [("tool",  r) for r in spec.get("tools")  or []])
    for kind, rec in jobs:
        if kind == "paper" and rec["doi"].lower() in have:
            skipped.append(f"paper {rec['doi']} (DOI already on site)")
            continue
        try:
            section, slug, fm, body = {"paper": build_paper, "event": build_event,
                                       "tool": build_tool}[kind](rec)
        except Exception as e:  # noqa: BLE001 — report and keep going
            skipped.append(f"{kind} {rec.get('doi') or rec.get('title')} (error: {e})")
            continue
        path = f"content/{section}/{slug}.md"
        if os.path.exists(path):
            skipped.append(f"{kind} {path} (file exists)")
            continue
        if not dry:
            with open(path, "w", encoding="utf-8") as f:
                f.write(itc.dump_md(fm, body))
        written.append(f"{path}  [{fm.get('year') or fm.get('date', '')}] {fm['title'][:70]}")

    print(f"{'would write' if dry else 'wrote'} {len(written)}:")
    print("\n".join(f"  {w}" for w in written))
    if skipped:
        print(f"skipped {len(skipped)}:")
        print("\n".join(f"  {s}" for s in skipped))

if __name__ == "__main__":
    main()
