#!/usr/bin/env python3
"""harvest marine biodiversity datasets into content/datasets/*.md.

Discovers MBON datasets across four open repositories and writes one Hugo
content file per dataset, cross-listing every portal the dataset appears in.

OBIS-first: when a dataset is mirrored in both OBIS and GBIF, the OBIS record is
made canonical (title, abstract, record count, DOI, deep link), because OBIS
carries richer Darwin Core extensions and QA/QC. GBIF is kept as a secondary
"also in" link. GBIF datasets tagged into the OBIS *network* but not yet ingested
into OBIS are the "gap" datasets (cf. iobis/obis-network-datasets) and are noted.

Sources
  OBIS    api.obis.org/v3/dataset   (per-node fetch, then title/IPT match)
  GBIF    api.gbif.org/v1           (dataset/search?q= → record count, networks)
  EDI     pasta.lternet.edu         (PASTA Solr eml search; cf EDIutils)
  ERDDAP  awesome-erddap registry   (multi-server search, stdlib re-impl of
                                      erddapy.multiple_server_search)

Dependencies: pyyaml + stdlib only (no requests/pandas/erddapy), matching the
repo convention for helper scripts. Run occasionally to refresh the catalog:

  python3 scripts/harvest_datasets.py            # default: write up to 150
  python3 scripts/harvest_datasets.py --limit 40 --verbose
  python3 scripts/harvest_datasets.py --dry-run  # discover + report, write nothing
"""

import argparse
import concurrent.futures as cf
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import date, datetime

import yaml

# ----------------------------------------------------------------------------
# config
# ----------------------------------------------------------------------------
HERE        = os.path.dirname(os.path.abspath(__file__))
REPO        = os.path.dirname(HERE)
OUT_DIR     = os.path.join(REPO, "content", "datasets")
UA          = {"User-Agent": "mbon-harvest/1.0 (+https://marinebon.github.io)"}
GENERATOR   = "harvest_datasets.py"

OBIS_NETWORK_GBIF = "2b7c7b4f-4d4f-40d3-94de-c28b6fa054a6"  # OBIS network on GBIF

# OBIS nodes that host MBON / Pole-to-Pole-Americas / US-MBON data. We fetch each
# node's dataset list (one call, ≤1000) and match GBIF candidates into it; OBIS
# global pagination is unreliable, so per-node is the robust path.
MBON_OBIS_NODES = {
    "8385435b-bcf5-4bec-b827-8b480163d479": "Caribbean OBIS",
    "b7c47783-a020-4173-b390-7b57c4fa1426": "OBIS USA",
    "573654c1-4ce7-4ea2-b2f1-e4d42f8f9c31": "OBIS-SEAMAP",
    "dde0dbd3-92fb-41e6-9f51-b1ae930a934b": "OBIS Brazil",
    "d2f71b1b-9138-4aba-ad8f-8327ac3d041e": "OBIS Colombia",
    "f224ae79-1a05-4744-b0e6-934386bd71ed": "OBIS Panama",
    "e339c31d-88f2-45ea-924d-2f8cef0d9fa9": "OBIS Ecuador",
    "464a96d8-c17e-4bbb-b6b8-778e1fb687c4": "OBIS Argentina",
    "ab4338af-28d1-402b-a01a-4caa41f90fc3": "OBIS CPPS",
    "6c17c09e-5cc2-4d5a-8463-e866731d35a1": "SWP OBIS",
    "4bf79a01-65a9-4db6-b37b-18434f26ddfc": "EurOBIS",
}

ERDDAP_REGISTRY = ("https://raw.githubusercontent.com/IrishMarineInstitute/"
                   "awesome-erddap/master/erddaps.json")

# OBIS node → place facet value
NODE_PLACE = {
    "OBIS USA": "US",
    "Caribbean OBIS": "Americas", "OBIS Brazil": "Americas",
    "OBIS Colombia": "Americas", "OBIS Panama": "Americas",
    "OBIS Ecuador": "Americas", "OBIS Argentina": "Americas",
    "OBIS CPPS": "Americas", "SWP OBIS": "Americas",
    "EurOBIS": "North-Atlantic",
}

# keyword → method facet (high-precision substrings, matched on title+abstract)
# a candidate that is NOT in OBIS / the OBIS network must carry a real MBON text
# signal to be kept — guards against GBIF/ERDDAP free-text false positives such as
# "Merseyside BioBank" or an unrelated "Ambon, Indonesia" dataset.
MBON_SIGNAL = re.compile(
    r"\bmbon\b|marine bon\b|marine biodiversity observ|pole.?to.?pole|biodiversity observation network",
    re.I)


def has_mbon_signal(*texts):
    return bool(MBON_SIGNAL.search(" ".join(t for t in texts if t)))


def via_mbon_ipt(*urls):
    """True if any URL is served by the MBON IPT (ipt.iobis.org/mbon) — a
    structural MBON signal independent of free text."""
    return any(u and "ipt.iobis.org/mbon" in u for u in urls)


METHOD_KEYWORDS = [
    ("Genomics",       ("edna", "e-dna", "environmental dna", "metabarcoding", "metagenom", "barcoding")),
    ("Acoustics",      ("hydrophone", "passive acoustic", "soundscape", "bioacoustic", "acoustic monitoring")),
    ("Tracking",       ("telemetry", "satellite tag", "acoustic tag", "tagging", "animal track", "argos")),
    ("Remote-Sensing", ("seascape", "remote sensing", "satellite-derived", "chlorophyll", "sea surface")),
    ("Benthic",        ("rocky shore", "rocky intertidal", "sandy beach", "intertidal", "benthic",
                        "kelp forest", "coral reef", "reef", "quadrat", "seagrass")),
    ("Traditional",    ("trawl", "zooplankton", "ichthyoplankton", "bottom trawl", "visual census",
                        "transect", "fish survey")),
]


# ----------------------------------------------------------------------------
# http helpers
# ----------------------------------------------------------------------------
def http_json(url, timeout=40, retries=2):
    """GET → parsed JSON, with light retry. Raises on final failure."""
    last = None
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return json.loads(r.read())
        except Exception as e:  # noqa: BLE001 — network is best-effort
            last = e
    raise last


def norm_title(s):
    return re.sub(r"[^a-z0-9]+", " ", (s or "").lower()).strip()


def ipt_sig(url):
    """Signature for an IPT resource URL, shared between GBIF endpoints and OBIS
    `url` for the same dataset, e.g.
      http://ipt.iobis.org/mbon/archive.do?r=helmuthlab_  →  ipt.iobis.org/mbon|helmuthlab_
      http://ipt.iobis.org/mbon/resource?r=helmuthlab_    →  ipt.iobis.org/mbon|helmuthlab_
    """
    if not url:
        return None
    try:
        p = urllib.parse.urlparse(url)
        r = urllib.parse.parse_qs(p.query).get("r", [None])[0]
        if not r:
            return None
        base = p.netloc + "/".join(p.path.split("/")[:-1])  # drop archive.do / resource / eml.do
        return f"{base.rstrip('/')}|{r}"
    except Exception:
        return None


def clean_text(s):
    """Strip HTML tags / entities / whitespace from a description blob."""
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def first_sentences(s, limit=260):
    s = clean_text(s)
    if len(s) <= limit:
        return s
    cut = s[:limit]
    dot = cut.rfind(". ")
    return (cut[:dot + 1] if dot > 80 else cut.rstrip() + "…")


def iso_date(s):
    """Normalize a date-ish string to YYYY-MM-DD (Hugo-parsable), padding
    year-only/year-month forms. Returns None if not a recognizable date."""
    if not s:
        return None
    s = str(s).strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}", s):
        return s[:10]
    if re.match(r"^\d{4}-\d{2}$", s):
        return s + "-01"
    if re.match(r"^\d{4}$", s):
        return s + "-01-01"
    return None


def norm_doi(s):
    if not s:
        return None
    s = s.strip()
    s = re.sub(r"^https?://(dx\.)?doi\.org/", "", s, flags=re.I)
    s = re.sub(r"^doi:\s*", "", s, flags=re.I)
    return s or None


def slugify(s, maxlen=70):
    s = re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-")
    return s[:maxlen].rstrip("-") or "dataset"


# ----------------------------------------------------------------------------
# OBIS — build per-node index, resolve GBIF candidates
# ----------------------------------------------------------------------------
def build_obis_index(verbose=False):
    """Fetch the MBON-relevant OBIS nodes and index their datasets by normalized
    title and by IPT resource signature → canonical OBIS record dicts."""
    by_title, by_sig = {}, {}
    for node_id, node_name in MBON_OBIS_NODES.items():
        try:
            d = http_json(f"https://api.obis.org/v3/dataset?nodeid={node_id}&size=1000")
        except Exception as e:  # noqa: BLE001
            if verbose:
                print(f"  ! OBIS node {node_name}: {e}", file=sys.stderr)
            continue
        res = d.get("results", [])
        if verbose:
            print(f"  · OBIS {node_name}: {len(res)} datasets", file=sys.stderr)
        for ds in res:
            rec = {
                "id":       ds.get("id"),
                "title":    clean_text(ds.get("title")),
                "abstract": clean_text(ds.get("abstract")),
                "records":  ds.get("records") or 0,
                "doi":      norm_doi(ds.get("citation_id")),
                "url":      ds.get("url"),
                "node":     node_name,
                "published": (ds.get("published") or "")[:10] or None,
                "extent":   _obis_extent(ds),
            }
            t = norm_title(rec["title"])
            if t and t not in by_title:
                by_title[t] = rec
            sig = ipt_sig(ds.get("url"))
            if sig and sig not in by_sig:
                by_sig[sig] = rec
    return {"by_title": by_title, "by_sig": by_sig}


def _obis_extent(ds):
    """Best-effort bbox from an OBIS dataset's `extent` (GeoJSON-ish). Returns
    {north,south,east,west} or None."""
    ext = ds.get("extent")
    if not ext:
        return None
    try:
        # collect all coordinate pairs found anywhere in the structure
        lons, lats = [], []
        stack = [ext]
        while stack:
            cur = stack.pop()
            if isinstance(cur, dict):
                stack.extend(cur.values())
            elif isinstance(cur, (list, tuple)):
                if (len(cur) == 2 and all(isinstance(v, (int, float)) for v in cur)
                        and -180 <= cur[0] <= 180 and -90 <= cur[1] <= 90):
                    lons.append(cur[0]); lats.append(cur[1])
                else:
                    stack.extend(cur)
        if lons and lats:
            return {"north": round(max(lats), 3), "south": round(min(lats), 3),
                    "east": round(max(lons), 3), "west": round(min(lons), 3)}
    except Exception:
        pass
    return None


def resolve_obis(gbif_ds, obis_index):
    """Find the canonical OBIS record for a GBIF dataset by IPT signature, else
    by normalized title. Returns the OBIS record dict or None."""
    for ep in gbif_ds.get("endpoints", []):
        sig = ipt_sig(ep)
        if sig and sig in obis_index["by_sig"]:
            return obis_index["by_sig"][sig]
    return obis_index["by_title"].get(norm_title(gbif_ds.get("title")))


# ----------------------------------------------------------------------------
# GBIF — discovery + per-dataset enrichment
# ----------------------------------------------------------------------------
def discover_gbif(query, gbif_limit, verbose=False):
    """dataset/search?q= → candidate dataset stubs (paged)."""
    out, offset, page = [], 0, 100
    while len(out) < gbif_limit:
        url = (f"https://api.gbif.org/v1/dataset/search?q={urllib.parse.quote(query)}"
               f"&limit={page}&offset={offset}")
        d = http_json(url)
        res = d.get("results", [])
        if not res:
            break
        out.extend(res)
        offset += page
        if offset >= d.get("count", 0):
            break
    if verbose:
        print(f"  · GBIF q={query!r}: {len(out)} candidate datasets", file=sys.stderr)
    return out[:gbif_limit]


def enrich_gbif(stub):
    """Fetch a GBIF dataset's detail, occurrence count, and OBIS-network flag."""
    key = stub.get("key")
    detail = http_json(f"https://api.gbif.org/v1/dataset/{key}")
    try:
        cnt = http_json(f"https://api.gbif.org/v1/occurrence/search?dataset_key={key}&limit=0").get("count", 0)
    except Exception:
        cnt = 0
    try:
        nets = http_json(f"https://api.gbif.org/v1/dataset/{key}/networks")
        in_obis = any(n.get("key") == OBIS_NETWORK_GBIF for n in nets)
    except Exception:
        in_obis = False
    temporal = None
    for tc in detail.get("temporalCoverages", []) or []:
        if tc.get("start"):
            temporal = ((tc.get("start") or "")[:10], (tc.get("end") or "")[:10] or None)
            break
    return {
        "key":       key,
        "title":     clean_text(detail.get("title") or stub.get("title")),
        "abstract":  clean_text(detail.get("description")),
        "doi":       norm_doi(detail.get("doi")),
        "type":      detail.get("type"),
        "publisher": detail.get("publishingOrganizationTitle") or stub.get("publishingOrganizationTitle"),
        "homepage":  detail.get("homepage"),
        "endpoints": [e.get("url") for e in detail.get("endpoints", []) if e.get("url")],
        "records":   cnt,
        "in_obis":   in_obis,
        "temporal":  temporal,
        "published": (detail.get("created") or "")[:10] or None,
    }


# ----------------------------------------------------------------------------
# EDI — PASTA Solr search (cf. EDIutils::search_data_packages)
# ----------------------------------------------------------------------------
def discover_edi(query, limit, verbose=False):
    fl = ("packageid,title,doi,authors,pubdate,abstract,"
          "northBoundingCoordinate,southBoundingCoordinate,"
          "eastBoundingCoordinate,westBoundingCoordinate,begindate,enddate")
    url = (f"https://pasta.lternet.edu/package/search/eml?defType=edismax"
           f"&q={urllib.parse.quote(query)}&fl={fl}&rows={limit}&sort=score,desc")
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=40) as r:
            xml = r.read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        if verbose:
            print(f"  ! EDI: {e}", file=sys.stderr)
        return []

    out = []
    for doc in re.findall(r"<document>(.*?)</document>", xml, re.S):
        def field(tag):
            m = re.search(rf"<{tag}>(.*?)</{tag}>", doc, re.S)
            return html.unescape(m.group(1).strip()) if m else None
        pid = field("packageid")
        if not pid:
            continue
        ext = None
        try:
            n, s = field("northBoundingCoordinate"), field("southBoundingCoordinate")
            e, w = field("eastBoundingCoordinate"), field("westBoundingCoordinate")
            if all(v not in (None, "") for v in (n, s, e, w)):
                ext = {"north": round(float(n), 3), "south": round(float(s), 3),
                       "east": round(float(e), 3), "west": round(float(w), 3)}
        except Exception:
            ext = None
        out.append({
            "packageid": pid,
            "title":     clean_text(field("title")),
            "abstract":  clean_text(field("abstract")),
            "doi":       norm_doi(field("doi")),
            "publisher": clean_text(field("authors")) or "Environmental Data Initiative",
            "published": (field("pubdate") or "")[:10] or None,
            "temporal":  ((field("begindate") or "")[:10] or None, (field("enddate") or "")[:10] or None),
            "extent":    ext,
            "url":       f"https://portal.edirepository.org/nis/mapbrowse?packageid={pid}",
        })
    if verbose:
        print(f"  · EDI q={query!r}: {len(out)} packages", file=sys.stderr)
    return out


# ----------------------------------------------------------------------------
# ERDDAP — multi-server search over the awesome-erddap registry
# ----------------------------------------------------------------------------
def discover_erddap(query, verbose=False):
    try:
        reg = http_json(ERDDAP_REGISTRY, timeout=30)
    except Exception as e:  # noqa: BLE001
        if verbose:
            print(f"  ! ERDDAP registry: {e}", file=sys.stderr)
        return []
    bases = [s.get("url", "").rstrip("/") for s in reg if s.get("url")]

    def search(base):
        url = f"{base}/search/index.json?searchFor={urllib.parse.quote(query)}&page=1&itemsPerPage=1000"
        try:
            d = http_json(url, timeout=15, retries=0)
            cols = d["table"]["columnNames"]; rows = d["table"]["rows"]
            ti, di = cols.index("Title"), cols.index("Dataset ID")
            ii = cols.index("Institution") if "Institution" in cols else None
            si = cols.index("Summary") if "Summary" in cols else None
            return [{
                "datasetID": r[di],
                "title":     clean_text(r[ti]),
                "publisher": (r[ii] if ii is not None else None),
                "abstract":  clean_text(r[si]) if si is not None else "",
                "server":    base,
                "url":       f"{base}/info/{r[di]}/index.html",
            } for r in rows]
        except Exception:
            return []

    out = []
    with cf.ThreadPoolExecutor(max_workers=12) as ex:
        for rows in ex.map(search, bases):
            out.extend(rows)
    if verbose:
        print(f"  · ERDDAP: {len(out)} datasets across {len(bases)} servers", file=sys.stderr)
    return out


# ----------------------------------------------------------------------------
# merge → unified dataset records
# ----------------------------------------------------------------------------
PORTAL_RANK = {"OBIS": 0, "EDI": 1, "GBIF": 2, "ERDDAP": 3}  # OBIS-first primary


def infer_methods(text):
    t = (text or "").lower()
    return [m for m, kws in METHOD_KEYWORDS if any(k in t for k in kws)]


def merge_records(gbif_enriched, obis_index, edi, erddap, verbose=False):
    """Fold all sources into unified dataset dicts keyed by normalized title.
    OBIS wins as the canonical/primary source when present."""
    unified = {}
    dropped = 0

    def slot(title):
        k = norm_title(title)
        return unified.setdefault(k, {"sources": [], "tags": set(), "_methods": ""})

    # 1) GBIF candidates, each resolved to OBIS where possible (OBIS canonical).
    #    Require a real MBON signal — text OR the MBON IPT. Being merely in the
    #    OBIS *network* is NOT enough (that's all 3,400+ OBIS datasets), which
    #    would otherwise admit noise like "Royal Ontario Museum - Ichthyology"
    #    or the literal "Ambon, Indonesia" match.
    for g in gbif_enriched:
        if not g:
            continue
        o = resolve_obis(g, obis_index)
        if not (has_mbon_signal(g["title"], g["abstract"], g["publisher"])
                or via_mbon_ipt(o["url"] if o else None, *g.get("endpoints", []))):
            dropped += 1
            continue
        rec = slot((o or g)["title"])
        rec["sources"].append({"portal": "GBIF", "url": f"https://www.gbif.org/dataset/{g['key']}",
                               "records": g["records"]})
        rec["_methods"] += " " + g["title"] + " " + g["abstract"]
        if o:
            rec["sources"].append({"portal": "OBIS", "url": f"https://obis.org/dataset/{o['id']}",
                                   "records": o["records"]})
            _fill(rec, "OBIS", o["title"], o["abstract"], o["records"], o["doi"],
                  o.get("node"), o.get("published"), o.get("extent"), None, None)
            rec["_methods"] += " " + o["abstract"]
        else:
            _fill(rec, "GBIF", g["title"], g["abstract"], g["records"], g["doi"],
                  g["publisher"], g["published"], None, g["homepage"], g["temporal"])
            if g["in_obis"]:
                rec["not_in_obis"] = True  # in OBIS network, not yet ingested

    # 2) EDI packages — add to an existing record by title, else new (if relevant)
    for e in edi:
        if norm_title(e["title"]) not in unified and not has_mbon_signal(
                e["title"], e["abstract"], e["publisher"]):
            dropped += 1
            continue
        rec = slot(e["title"])
        rec["sources"].append({"portal": "EDI", "url": e["url"]})
        rec["_methods"] += " " + e["title"] + " " + e["abstract"]
        _fill(rec, "EDI", e["title"], e["abstract"], 0, e["doi"], e["publisher"],
              e["published"], e["extent"], None, e["temporal"])

    # 3) ERDDAP datasets — add to an existing record by title, else new (if relevant)
    for x in erddap:
        if norm_title(x["title"]) not in unified and not has_mbon_signal(
                x["title"], x["abstract"], x["datasetID"], x["publisher"]):
            dropped += 1
            continue
        rec = slot(x["title"])
        rec["sources"].append({"portal": "ERDDAP", "url": x["url"]})
        rec["_methods"] += " " + x["title"] + " " + x["abstract"]
        _fill(rec, "ERDDAP", x["title"], x["abstract"], 0, None, x["publisher"],
              None, None, None, None)

    # finalize: pick primary source, dedupe source list, build tags
    finished = []
    for rec in unified.values():
        if "title" not in rec:
            continue
        # dedupe sources by portal, keeping the first (richest) seen, max records
        by_portal = {}
        for s in rec["sources"]:
            p = s["portal"]
            if p not in by_portal or (s.get("records", 0) or 0) > (by_portal[p].get("records", 0) or 0):
                by_portal[p] = s
        srcs = sorted(by_portal.values(), key=lambda s: PORTAL_RANK.get(s["portal"], 9))
        primary = srcs[0]["portal"]
        for s in srcs:
            s["primary"] = (s["portal"] == primary)
        rec["sources"] = srcs
        rec["portal_primary"] = primary

        tags = set()  # content type is structural (the data section), not a tag
        for s in srcs:
            tags.add(f"portal.{s['portal']}")
        for m in infer_methods(rec.pop("_methods", "")):
            tags.add(f"method.{m}")
        place = NODE_PLACE.get(rec.get("_node"))
        if place:
            tags.add(f"place.{place}")
        rec["tags"] = sorted(tags)
        rec.pop("_node", None)
        # canonical record count = primary source's count, else max across sources
        rec["records"] = by_portal[primary].get("records") or max(
            (s.get("records", 0) or 0 for s in srcs), default=0)
        rec["records_label"] = "occurrence records" if primary in ("OBIS", "GBIF") else "dataset"
        finished.append(rec)
    if verbose:
        print(f"  · merged → {len(finished)} unique datasets "
              f"({dropped} off-topic candidates dropped)", file=sys.stderr)
    return finished


def _fill(rec, portal, title, abstract, records, doi, node_or_pub, published, extent, homepage, temporal):
    """Populate canonical fields, but never overwrite a higher-ranked portal's."""
    incoming = PORTAL_RANK.get(portal, 9)
    if rec.get("_rank", 99) <= incoming and "title" in rec:
        return
    rec["_rank"]     = incoming
    rec["title"]     = title
    rec["summary"]   = first_sentences(abstract) or title
    rec["abstract"]  = abstract
    rec["publisher"] = node_or_pub
    rec["_node"]     = node_or_pub if portal == "OBIS" else rec.get("_node")
    if doi:        rec["doi"] = doi
    d = iso_date(published)
    if d:          rec["date"] = d
    if homepage:   rec["homepage"] = homepage
    if extent:     rec["extent"] = extent
    if temporal and temporal[0]:
        rec["temporal_start"], rec["temporal_end"] = temporal[0], temporal[1]


# ----------------------------------------------------------------------------
# write content files
# ----------------------------------------------------------------------------
def write_dataset(rec, harvested, used_slugs):
    slug = slugify(rec["title"])
    if slug in used_slugs:
        n = 2
        while f"{slug}-{n}" in used_slugs:
            n += 1
        slug = f"{slug}-{n}"
    used_slugs.add(slug)

    fm = {
        "title":   rec["title"],
        "summary": rec["summary"],
    }
    if rec.get("date"):           fm["date"] = rec["date"]
    fm["records"] = rec["records"]
    fm["records_label"] = rec["records_label"]
    fm["portal_primary"] = rec["portal_primary"]
    if rec.get("publisher"):      fm["publisher"] = rec["publisher"]
    if rec.get("doi"):            fm["doi"] = rec["doi"]
    if rec.get("homepage"):       fm["homepage"] = rec["homepage"]
    if rec.get("temporal_start"): fm["temporal_start"] = rec["temporal_start"]
    if rec.get("temporal_end"):   fm["temporal_end"] = rec["temporal_end"]
    if rec.get("extent"):         fm["extent"] = rec["extent"]
    if rec.get("not_in_obis"):    fm["not_in_obis"] = True
    fm["tags"] = rec["tags"]
    fm["sources"] = rec["sources"]
    fm["harvested"] = harvested
    fm["generator"] = GENERATOR

    body = rec.get("abstract") or rec["summary"]
    front = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=100).strip()
    text = f"---\n{front}\n---\n\n{body}\n"
    with open(os.path.join(OUT_DIR, f"{slug}.md"), "w", encoding="utf-8") as f:
        f.write(text)
    return slug


# ----------------------------------------------------------------------------
# main
# ----------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser(description="Harvest MBON datasets into content/datasets/*.md")
    ap.add_argument("--query", default="MBON", help="free-text query (default: MBON)")
    ap.add_argument("--limit", type=int, default=150, help="max dataset files to write")
    ap.add_argument("--gbif-limit", type=int, default=300, help="GBIF candidates to consider")
    ap.add_argument("--edi-limit", type=int, default=60, help="EDI packages to consider")
    ap.add_argument("--no-edi", action="store_true")
    ap.add_argument("--no-erddap", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="discover + report; write nothing")
    ap.add_argument("--clean", action="store_true", help="delete existing harvested files first")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args()

    v = args.verbose
    print(f"Harvesting datasets (q={args.query!r}) …", file=sys.stderr)

    print("→ OBIS node index", file=sys.stderr)
    obis_index = build_obis_index(verbose=v)

    print("→ GBIF discovery + enrichment", file=sys.stderr)
    stubs = discover_gbif(args.query, args.gbif_limit, verbose=v)
    gbif_enriched = []
    with cf.ThreadPoolExecutor(max_workers=10) as ex:
        for r in ex.map(lambda s: _safe(enrich_gbif, s), stubs):
            if r:
                gbif_enriched.append(r)

    edi = [] if args.no_edi else discover_edi(args.query, args.edi_limit, verbose=v)
    erddap = [] if args.no_erddap else discover_erddap(args.query, verbose=v)

    print("→ merge", file=sys.stderr)
    records = merge_records(gbif_enriched, obis_index, edi, erddap, verbose=v)
    # rank: most records first, then datasets carrying an OBIS record
    records.sort(key=lambda r: (r["records"], "portal.OBIS" in r["tags"]), reverse=True)

    capped = records[:args.limit]
    dropped = len(records) - len(capped)

    # report
    n_obis = sum(1 for r in capped if "portal.OBIS" in r["tags"])
    n_gap  = sum(1 for r in capped if r.get("not_in_obis"))
    by_portal = {}
    for r in capped:
        by_portal[r["portal_primary"]] = by_portal.get(r["portal_primary"], 0) + 1
    print(f"\n{len(capped)} datasets to write "
          f"(canonical by portal: {by_portal}); {n_obis} carry an OBIS record, "
          f"{n_gap} in OBIS-network-but-not-OBIS.", file=sys.stderr)
    if dropped:
        print(f"NOTE: capped at --limit {args.limit}; {dropped} more discovered but not written "
              f"(raise --limit to include them).", file=sys.stderr)

    if args.dry_run:
        for r in capped[:25]:
            print(f"  [{r['portal_primary']:6}] {r['records']:>7}  {r['title'][:70]}", file=sys.stderr)
        print("(dry-run: no files written)", file=sys.stderr)
        return

    os.makedirs(OUT_DIR, exist_ok=True)
    if args.clean:
        for fn in os.listdir(OUT_DIR):
            if fn.endswith(".md") and fn != "_index.md":
                p = os.path.join(OUT_DIR, fn)
                if "generator: harvest_datasets.py" in open(p, encoding="utf-8").read():
                    os.remove(p)

    harvested = date.today().isoformat()
    used = set()
    for r in capped:
        write_dataset(r, harvested, used)
    print(f"✓ wrote {len(used)} files to {os.path.relpath(OUT_DIR, REPO)}/", file=sys.stderr)


def _safe(fn, *a):
    try:
        return fn(*a)
    except Exception:  # noqa: BLE001
        return None


if __name__ == "__main__":
    main()
