# marinebon.org re-build
This is a WiP rebuild of the marinebon.org website using jekyll based on the Jekyll theme for IOOS github pages.

With this rebuild the following MBON web pages will be updated (and merged where appropriate):
* http://www.marinebon.org/
* https://ioos.noaa.gov/project/bio-data/  
* marinebon.github.io

The `theme` branch contains a modified fork of the IOOS theme, and the `website` branch contains the actual content of the website.
The `gh-pages` branch is used by Travis.CI to deploy the website to GitHub's servers.

------------------------------------------------------------

## Jekyll theme for IOOS GitHub pages

This repo holds the common Jekyll theme code for IOOS GitHub.io documentation sites.  The IOOS theme is based on IOOS'
fork of the ['Minimal Mistakes'](https://github.com/mmistakes/minimal-mistakes)
Jekyll theme originally developed for the [IOOS Catalog documentation site](https://ioos.github.io/catalog/).

An example version of this template is available here: [https://ioos.github.io/mbon_jekyll_theme](https://ioos.github.io/mbon_jekyll_theme).

Instructions for downloading and creating your own documentation site based on this template code is available at the
[IOOS Jekyll Template Getting Started](https://ioos.github.io/mbon_jekyll_theme/pages/readme/) page.

These instructions outline two approaches available for developing a GitHub Pages site based on this template:

1. using a full Ruby/Jekyll development environment on your workstation (benefit is more rapid iteration of site content
  changes).
2. modifying markdown and template config files via text editor and pushing modifications to your repository 'gh-pages'
  branch to leverage GitHub Pages' Jekyll environment to render the results live (eg. https://ioos.github.io/your_repo_name).

Both approaches involve downloading/cloning the ['gh-pages'](https://github.com/ioos/mbon_jekyll_theme/tree/gh-pages)
branch of this repository, which is a mock-up documentation site based on the template code contained in the 'master' branch.
The 'gh-pages' branch has an internal git submodule reference to the master branch with the template code.

Updates to the IOOS GitHub Pages based documentation sites that use this template can be managed more easily due to the
submodule reference to a single template code base.  The workflow is to update the master branch template code,
followed by running git submodule update commands in each of the downstream repositories.
