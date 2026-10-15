---
title: SEUS MBON cruise CTD processing
summary: Quarto notebooks that pull SEUS MBON / South Florida cruise CTD casts from
  GCOOS ERDDAP, apply QA/QC and align station ids, and publish cleaned profiles and
  reports.
links:
- label: Reports
  url: https://usf-imars.github.io/seus-mbon-cruise-ctd-processing/
  primary: true
- label: Source code
  url: https://github.com/USF-IMARS/seus-mbon-cruise-ctd-processing
tags:
- tool.Workflow
- place.South-Florida
- portal.ERDDAP
- topic.Data-Publishing
related:
- /network/southeast-mbon
weight: 99
---

CTD casts from the South Florida / Southeast US MBON research cruises, aboard the R/V Walton
Smith and R/V W. T. Hogarth, are published on GCOOS ERDDAP. These notebooks download them,
clean them further, align station ids with the FRESCA standard names, and render cleaned
profiles and a report site. To add a cruise, add its ERDDAP dataset ids to a mapping table.
