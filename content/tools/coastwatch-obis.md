---
image: img/tools/coastwatch-obis.png
links:
- label: Open CoastWatch OBIS Explorer
  primary: true
  url: https://cwcgom.aoml.noaa.gov/OBIS/
summary: Server-side tool that co-locates satellite remote sensing products, gridded
  model outputs, and OBIS field observations to generate biodiversity indicators for
  any polygon.
tags:
- tool.App
- place.Global
- topic.Seascapes
- topic.Ecosystem-Assessment
- topic.Species-Distribution-Modeling
title: CoastWatch OBIS Indicator Explorer
weight: 8
aliases:
- /products/explorer-coastwatch/
---

The CoastWatch OBIS Indicator Explorer (developed by J. Trinanes, NOAA CoastWatch) provides a server-side approach for extracting co-located satellite remote sensing products, gridded numerical model results, and field observations — including records from OBIS, NCEI, and Seascapes — for any user-defined polygon.

Rather than requiring users to download and align large satellite datasets locally, the tool does the heavy lifting on the server and returns pre-processed, co-located data for the target area. This makes it practical to generate biodiversity indicators for coastal management units, marine protected areas, EEZ boundaries, or any custom region.

## Inputs and outputs

- **Satellite products:** SST, chlorophyll-a, CDOM, and other VIIRS/MODIS-derived variables
- **Gridded models:** numerical oceanographic model outputs (velocity, mixed layer depth, etc.)
- **Field observations:** species occurrence records from [OBIS](https://obis.org/) and [NCEI](https://www.ncei.noaa.gov/)
- **Seascapes:** dynamic habitat classification layer from MBON

For each polygon, the tool returns co-located time series that can be used directly for indicator development, species distribution modeling, or condition reporting.
