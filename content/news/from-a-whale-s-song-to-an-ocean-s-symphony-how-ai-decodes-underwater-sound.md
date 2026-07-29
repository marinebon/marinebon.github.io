---
title: 'From a Whale’s Song to an Ocean’s Symphony: How AI Decodes Underwater Sound'
date: '2026-07-08'
summary: Explore how SECOORA-funded research is using AI and machine learning to decode
  ocean soundscapes, detect boat noise, and support coral reef restoration efforts.
tags:
- topic.Monitoring
- topic.Research
- method.Acoustics
- place.South-Florida
- org.FWRI
---

**Original post**: [From a Whale’s Song to an Ocean’s Symphony: How AI Decodes Underwater Sound - SECOORA](https://secoora.org/from-a-whales-song-to-an-oceans-symphony-how-ai-decodes-underwater-sound/)

At the peak of the pandemic in late 2020, the University of South Florida’s (USF) College of Marine Science hosted the virtual conference _Acoustic Anthropogenic-Biological Indicators Workshop_. The event gathered a multidisciplinary, highly specialized group of oceanographers, bioacoustic engineers, and data scientists to examine a looming crisis in ocean observation: how to translate terabytes of passive acoustic monitoring (PAM) raw audio into automated, manageable metrics for measuring ecosystem health.

The scientists had access to a massive amount of acoustic data from NOAA and [Ocean Observatories Initiative](https://oceanobservatories.org/) hydrophone arrays in the Gulf of America and the Pacific Northwest. The raw audio had been captured using different sound recording systems with inconsistent sampling rates. The researchers set a deceptively simple objective: develop an algorithm capable of automatically isolating boat noise across thousands of hours of underwater recordings originally captured to monitor marine life.

Instead of building a Machine Learning (ML) model from scratch, the research team built a boat engine detection workflow on Google DeepMind’s Perch 1.0, a bioacoustic foundational framework trained primarily on bird sounds. Researchers leveraged transfer learning by feeding the model cross-domain, reef, and unrelated audio to build a highly adaptable, localized classifier. When the framework flags ambiguous or unrecognized audio segments, it requests a human to manually verify the segment as “Boat” or “No Boat”. This process quickly trains the customized classifier to detect vessel noise, enabling it to process thousands of hours of recordings with 88-90% accuracy. And most importantly, it eliminates the traditionally exhaustive manual labeling of audio files.

This early predictive model laid the foundation for an ambitious SECOORA-funded project, _Augmenting Ocean Observing through Artificial Intelligence: Annotation, Data Standards, and Applications._ This innovative blend of marine ecology, bioacoustics, and computational modeling aimed to “standardize regional passive acoustic monitoring (PAM) databases into a benchmark dataset; train machine learning (ML) models for automatic biological and anthropogenic sound detection; deploy a real-time edge application; and create standards and cloud resources for future PAM databases.”

Luke McEachron, PhD, the project’s principal investigator and then-Research Administrator for the Florida Fish & Wildlife Conservation Commission (FWC), spearheaded the regional effort. Alongside co-investigators from USF’s Institute for Marine Remote Sensing, the University of South Carolina Beaufort’s Marine Sensory and Neurobiology Lab, and the University of Colorado Boulder’s Cooperative Institute for Research in Environmental Science, the team established a standardized framework to help marine scientists and other stakeholders train AI and deploy ML models effectively.

“To start from scratch and train a model like Perch, you need massive resources,” explained Dr. McEachron. “Instead, the existing model can be refined to your needs.” Google Perch was trained on 1.5 million source recordings covering nearly 15,000 species, including birds, mammals, amphibians, and insects. It relied on crowdsourced, curated data from platforms such as Xeno-Canto and iNaturalist, with labeling by thousands of field biologists and community experts.

“Perch is trained to look for patterns and build spectrograms,” says Dr. McEachron, “and this can work well for fish too—or boats—if you can identify them.” A spectrogram is the visual representation of an audio file. Ironically, AI isn’t “listening” to the song of a whale or the low-frequency vibrations of a boat passing. Instead, AI is “seeing” a cluster of pixels on a screen.

“It’s a visualization of sound,” explains Dr. McEachron: “A picture of silence.”
