---
title: OceanMetrics Atlas
image: img/tools/oceanmetrics-atlas.jpg
summary: A browser map of species distribution and biodiversity model outputs, read
  from a STAC catalog. It now hosts the MBON BioTrack indicators (species richness
  and uncertainty for the US Atlantic and Gulf, from telemetry and OBIS).
links:
- label: Open the atlas
  url: https://oceanmetrics.io/atlas/
  primary: true
- label: Source code
  url: https://github.com/oceanmetrics/atlas
- label: BioTrack indicators data
  url: https://s3.us-east-1.amazonaws.com/oceanmetrics.io-public/atlas/biotrack_indicators/collection.json
tags:
- tool.App
- place.US
- org.Ocean-Metrics
- method.Tracking
- method.Indicators
- portal.OBIS
- topic.Species-Distribution-Modeling
related:
- /working-groups/biotrack
- /working-groups/indicators
- /tools/biotrack-portal
- /tools/marine-sensitivity-toolkit
- /tools/stac-sdm
- /tools/places-gazetteer
weight: 99
---

The **[OceanMetrics Atlas](https://oceanmetrics.io/atlas/)** maps species distribution and
biodiversity model outputs from a [STAC](https://stacspec.org) catalog described with
[STAC-SDM](/tools/stac-sdm/). It runs entirely in the browser, with no server of its own, and
takes its places from the [places gazetteer](/tools/places-gazetteer/).

**MBON BioTrack indicators.** The atlas opens on them. It hosts the [BioTrack](/working-groups/biotrack/)
indicator layers from Couto, Hammerschlag et al. (in prep; PI Neil Hammerschlag, funded by NOAA IOOS MBON). They give ecoregion-weighted species
richness and cumulative uncertainty for the US Atlantic and Gulf of Mexico, on 27,841 10-km
hexagons, in summer and winter. Layers cover all species, fish, rays, sharks, turtles and
red-listed species. They come from integrated spatial occupancy models that combine acoustic
telemetry with OBIS records for 66 species, from 2000 to 2023, and are licensed CC BY 4.0.

The atlas also carries AquaMaps habitat suitability (native 0.5° and global 0.05°) and, by
reference, the [Marine Sensitivity Toolkit](/tools/marine-sensitivity-toolkit/) SDM
collections. The atlas is built by Ocean Metrics, with support from the Marine Minerals
Administration and MBON.
