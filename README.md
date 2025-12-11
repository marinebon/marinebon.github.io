## Adding News
1. create a new `.md` file in `content/blog/`
    * `cp content/blog/2017-08-seascapes.md content/blog/new-post.md`
2. edit file
    * set header data
    * add content in markdown format
    * any images should be uploaded to `static/img/blog/`


### Content Directory
location | description
---------|------------------------------------------------------------
content  | .md files for blogs, project pages, etc
data     | information for the custom widget partials (carousel, etc)
static   | raw files to be hosted (images, pdf, etc)
layouts  | hugo html templates


--------------------------------------------------------------

## Technical Information
This website uses the static-site generator hugo to translate `.md` (markdown) and `.html` templates into files for hosting as a static site.

Static-site hosting has several benefits including page fetch speed and ease of hosting.
For testing the site is hosted using the free service GitHub pages.
Deployment and rendering of the `.md` and `.html` templates is performed by a GitHub action.
This makes it possible for files to be edited directly on GitHub.com and changes will appear on the site within a few minutes. 

----------------------------------------------------------------

## Development Server
gh-actions is set up to build & deploy the site upon commit push.
A local server can be run for testing changes before pushing to GitHub:

```bash
hugo server -w
```

# TODO:
walk through [config steps](https://github.com/devcows/hugo-universal-theme?tab=readme-ov-file#configuration)

