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

# TODO:
walk through [config steps](https://github.com/devcows/hugo-universal-theme?tab=readme-ov-file#configuration)

# !!!

gh-actions is set up to build & deploy the site upon commit push.




```bash
hugo server -w
```