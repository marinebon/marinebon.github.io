---
title: OceanMetrics Atlas
image: img/tools/oceanmetrics-atlas.jpg
summary: A browser map of species distribution and biodiversity model outputs, read
  from a STAC catalog. It opens on the AquaMaps EOV share and hosts the MBON BioTrack
  indicators (species richness and uncertainty from telemetry and OBIS).
links:
- label: Open the atlas
  url: https://oceanmetrics.io/atlas/
  primary: true
- label: Source code
  url: https://github.com/oceanmetrics/atlas
- label: BioTrack indicators
  url: https://oceanmetrics.io/atlas/?c=biotrack_indicators
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
- topic.EOV
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

**AquaMaps EOV share.** The atlas opens on it: a 0-100 score per 0.05° cell for each
Essential Ocean Variable (fish, hard corals, mangroves, marine mammals, seabirds, seagrasses,
sea turtles). For each EOV it sums every species' share of its global AquaMaps habitat
suitability in the cell, clipped to its IUCN range and weighted by Red List category; the
composite is the mean of the EOVs with data. Click a cell for a flower plot of the EOVs and the
list of species with habitat there, each linked to its own distribution. The method is a
[rendered notebook](https://oceanmetrics.io/workflows/aquamaps_eov.html).

**MBON BioTrack indicators.** One pick away
([open them](https://oceanmetrics.io/atlas/?c=biotrack_indicators)), the atlas hosts the
[BioTrack](/working-groups/biotrack/) indicator layers (PI Neil Hammerschlag, funded by NOAA IOOS
MBON). They give ecoregion-weighted species richness and cumulative uncertainty for the US
Atlantic, the Gulf of Mexico and the Caribbean, on 27,841 10-km hexagons, in summer and winter.
Layers cover all species, fish, rays, sharks, turtles and red-listed species. They come from
integrated spatial occupancy models that combine acoustic telemetry with OBIS records for 66
species, from 2000 to 2023. Cite them as:

> Couto, T. B. A., Zulian, V., D'Antonio, B., ... & Hammerschlag, N. (under review). Unlocking
> the potential of acoustic telemetry to scale up marine biodiversity assessment. *Frontiers in
> Ecology and the Environment*.

The atlas also carries AquaMaps habitat suitability per species (native 0.5° and global 0.05°) and, by
reference, the [Marine Sensitivity Toolkit](/tools/marine-sensitivity-toolkit/) SDM
collections. The atlas is built by Ocean Metrics, with support from the Marine Minerals
Administration and MBON.
