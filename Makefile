# Local build & preview for the MBON Hugo site.
#
#   make preview   # production-style build + Pagefind index, served at http://localhost:8000
#   make serve     # live-reloading dev server (search stays as-is) at http://localhost:1313
#   make build     # build ./public exactly like CI (no server)
#   make check     # build + link check (what deploy.yml runs)
#   make clean     # remove ./public and the local search index
#
# Requires Hugo extended >= 0.163, Python 3, and Node/npx (for Pagefind).

HUGO      ?= hugo
PUBLIC    ?= public
PORT      ?= 8000
HUGOFLAGS ?= --gc --minify

# unset by default: `build` uses hugo.yaml's production baseURL (as CI does).
# `preview` overrides it with the local address so absolute URLs resolve locally.
BASEURL   ?=

.PHONY: preview build serve reindex check clean help

## Build a production-style site and host it locally for testing.
preview: BASEURL = http://localhost:$(PORT)/
preview: build
	@echo ""
	@echo "Serving $(PUBLIC)/ at $(BASEURL)  (Ctrl-C to stop)"
	@echo ""
	@cd $(PUBLIC) && python3 -m http.server $(PORT) --bind 127.0.0.1

## Build ./public exactly like CI, including the Pagefind search index.
build:
	rm -rf $(PUBLIC)
	$(HUGO) $(HUGOFLAGS) $(if $(BASEURL),--baseURL "$(BASEURL)")
	npx --yes pagefind --site $(PUBLIC)

## Live-reloading dev server (content/layouts live; search index is not rebuilt).
serve:
	$(HUGO) server

## Rebuild the Pagefind index that `make serve` reads from static/pagefind/.
reindex:
	./scripts/reindex.sh

## Build and fail on broken internal links, like deploy.yml.
check: build
	python3 scripts/check_links.py $(PUBLIC)

## Remove build output and the local search index.
clean:
	rm -rf $(PUBLIC) static/pagefind

## Show available targets.
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/^## /  /'
