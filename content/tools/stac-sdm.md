---
title: STAC-SDM
summary: A STAC extension that describes species distribution models (range, habitat-suitability
  or density) — what the value means, how it was modeled, which taxon, and the month
  or season it predicts.
links:
- label: Specification
  url: https://github.com/MarineSensitivity/stac-sdm
  primary: true
tags:
- tool.Package
- place.Global
- org.Ocean-Metrics
- method.Indicators
- topic.Species-Distribution-Modeling
- topic.Standards
- topic.Interoperability
related:
- /working-groups/indicators
- /tools/marine-sensitivity-toolkit
- /tools/marine-sdms
weight: 99
---

**STAC-SDM** is a [SpatioTemporal Asset Catalog](https://stacspec.org) extension (prefix `sdm:`)
for species distribution models. It records the semantics that core STAC lacks: the response
type of each cell value and its unit, the modeling method, the source authority, the
predictors, the vintage of the environmental layers, and the prediction interval (static,
monthly or seasonal) that captures phenology. Everything else (projection, raster bands,
citation, versioning, lineage) is delegated to existing STAC extensions. It is the catalog
schema of the [Marine Sensitivity Toolkit](/tools/marine-sensitivity-toolkit/).
