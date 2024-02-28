# marinebon.org re-build

## ⚠️ deprecated ⚠️
This version of marinebon.org was replaced by a a wowchemy website (see [www_marinebon](https://github.com/marinebon/www_marinebon), [www_marinebon2](https://github.com/marinebon/www_marinebon2), and [www_marinebon3](https://github.com/marinebon/www_marinebon3]) and then migrated to the latest form a wordpress website (details [here](https://github.com/marinebon/marinebon_wordpress_website)).

--------------------------------------
This is a rebuild of the marinebon.org website using jekyll based on the Jekyll theme for IOOS github pages.

With this rebuild the following MBON web pages will be updated (and merged where appropriate):
* http://www.marinebon.org/
* https://ioos.noaa.gov/project/bio-data/  
* marinebon.github.io

The jekyll theme used ([mbon_jekyll_theme](https://github.com/marinebon/mbon_jekyll_theme)) is a modified fork of the IOOS theme, and the `src` branch contains the actual content of the website.

The `master` branch is used by Travis.CI to deploy the website to GitHub's servers as a static website.
The workflow is to edit the `src` branch and then Travis will modify the `master` branch.
Do not edit the `master` branch or Travis will get upset with you.

## dev
### setup
0. `git clone -b src https://github.com/marinebon/marinebon.github.io` to clone website source
1. [install ruby & jekyll](https://jekyllrb.com/)
2. `cd marinebon.github.io` to enter the repo directory
3. `bundle install` to set up ruby dependencies
4. `git submodule update --init --recursive` to install the theme
5. `bundle exec jekyll serve` to build & host the site at localhost:4000

### manual build & push
In the event that the automated build is not working you may build the site from your PC and push the new build.
Once things are installed do this:

```bash
# build site
bundle exec jekyll build
# website files are now in ./_site/
# (these are not tracked by git (see ./.gitignore file))

# this is a workaround for some wierdness
rm -rf ./_theme/

# switch git branches
git checkout master
git pull origin master

# cp files from _site into master root 
# (the slash before cp avoids the common alias cp='cp -i')
\cp -r -f _site/* .

# now you must add any new files (images, etc) needed
# to view what is new and untracked use `git status`
git add images/my_new_image.png images/my_other_new_image.png

# commit & push files to github
git commit -a -m 'put_a_useful_commit_message_here'
git push origin master

# switch back to src branch and restore
git checkout src
git submodule update --init --recursive
# that last part is an undo for the `rm -rf _theme` we did earlier
```

------------------------------------------------------------

## Jekyll theme for IOOS GitHub pages

This repo holds the common Jekyll theme code for IOOS GitHub.io documentation sites.  The IOOS theme is based on IOOS'
fork of the ['Minimal Mistakes'](https://github.com/mmistakes/minimal-mistakes)
Jekyll theme originally developed for the [IOOS Catalog documentation site](https://ioos.github.io/catalog/).

An example version of this template is available here: [https://ioos.github.io/ioos_jekyll_theme](https://ioos.github.io/ioos_jekyll_theme).

Instructions for downloading and creating your own documentation site based on this template code is available at the
[IOOS Jekyll Template Getting Started](https://ioos.github.io/ioos_jekyll_theme/pages/readme/) page.

These instructions outline two approaches available for developing a GitHub Pages site based on this template:

1. using a full Ruby/Jekyll development environment on your workstation (benefit is more rapid iteration of site content
  changes).
2. modifying markdown and template config files via text editor and pushing modifications to your repository 'gh-pages'
  branch to leverage GitHub Pages' Jekyll environment to render the results live (eg. https://ioos.github.io/your_repo_name).

Both approaches involve downloading/cloning the ['gh-pages'](https://github.com/ioos/ioos_jekyll_theme/tree/gh-pages)
branch of this repository, which is a mock-up documentation site based on the template code contained in the 'master' branch.
The 'gh-pages' branch has an internal git submodule reference to the master branch with the template code.

Updates to the IOOS GitHub Pages based documentation sites that use this template can be managed more easily due to the
submodule reference to a single template code base.  The workflow is to update the master branch template code,
followed by running git submodule update commands in each of the downstream repositories.
