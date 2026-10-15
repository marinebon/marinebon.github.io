---
title: places gazetteer
summary: One STAC catalog of marine place layers (sanctuaries, MPAs, EEZs, leases,
  planning areas) as GeoParquet and PMTiles, with stable place ids, per-feature licence
  and H3 membership for joining hexagon data by place.
links:
- label: Browse the catalog
  url: https://storage.oceanmetrics.io/gazetteer/catalog.json
  primary: true
- label: Source code
  url: https://github.com/oceanmetrics/places
tags:
- tool.Package
- place.US
- org.Ocean-Metrics
- method.Indicators
- topic.Marine-Protected-Areas
- topic.Standards
- topic.Interoperability
related:
- /working-groups/indicators
- /tools/obis-hex
- /tools/erddap-places
weight: 99
---

**places** is the gazetteer behind [erddap-places](/tools/erddap-places/) and the place filter
in [OBIS hex](/tools/obis-hex/): one [STAC](https://stacspec.org) catalog of marine place layers,
such as National Marine Sanctuaries, MPAs, EEZs, BOEM leases and planning areas, aquaculture
opportunity areas and stations. It covers places that are missing from the standard registries
as well as those that are in them.

- **Stable ids.** Every place is `<authority>:<source_id>` (for example `NMS:FKNMS`); ids never
  change, geometry versions do.
- **Cloud-native files.** Each collection is a GeoParquet file (queryable straight from DuckDB
  with bbox pushdown) plus a PMTiles archive for maps, with a style, README and provenance.
- **Licence and attribution per feature**, so derived products can credit sources correctly.
- **H3 membership.** For every polygon collection, the H3 cells (res 1–7) each place covers and
  the share of each cell inside it, so hexagon data such as the OBIS H3 indicators can be
  summarised by place with a join and no geometry.

Built by the [Indicators working group](/working-groups/indicators/) for place-based indicator
reporting: dataset · place · method · delivery as configuration.
