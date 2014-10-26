.PHONY: doc test

TEMPDIR    := tmp
HTMLDIR    := tmp/html
BRANCHES   := bootstrap build cog cogdb gh-pages
SUBDIRS    := $(BRANCHES:%=$(TEMPDIR)/%)
REPO_URL   := git@github.com:ingydotnet/inline-cog
SITE_INDEX := ./index.html
SITE_JS    := js/all.js

JEMPLATES  := y6ut y5yq

COG_ROOT   := $(TEMPDIR)/cog
BUILD_ROOT := $(TEMPDIR)/build

default: help

help:
	@echo 'Makefile targets:'
	@echo ''
	@echo '    sub-dirs     - Clone branches into subdirs'
	@echo '    build        - Rebuild website'
	@echo '    clean        - Delete generated content'
	@echo ''
	@echo '    sub-status   - Check subrepo/branch statuses'
	@echo ''

sub-dirs: $(SUBDIRS)

build: sub-dirs $(SITE_INDEX) page/v3e7.html $(SITE_JS)

clean purge:
	rm -fr $(TEMPDIR)

#------------------------------------------------------------------------------
$(SUBDIRS):
	git clone -b $(@:$(TEMPDIR)/%=%) \
	  $(REPO_URL) \
	  $(TEMPDIR)/$(@:$(TEMPDIR)/%=%)

page/v3e7.html: page pages
	tt-render \
	  --path="$(BUILD_ROOT)/template:$(HTMLDIR)" \
	  --data=$(BUILD_ROOT)/config.yaml \
	  --post-chomp v3e7.html \
	  > $@

pages: $(HTMLDIR)
	swim --to=html $(COG_ROOT)/node/v3e7.cog \
	  > $(HTMLDIR)/inline-module-spec.html

posts: $(HTMLDIR)
	swim --to=html $(COG_ROOT)/node/se9g.cog \
	  > $(HTMLDIR)/inline-grant-weekly-report-1.html
	swim --to=html $(COG_ROOT)/node/y5yq.cog \
	  > $(HTMLDIR)/inline-grant-accepted.html

$(SITE_INDEX): posts
	tt-render \
	  --path="$(BUILD_ROOT)/template:$(HTMLDIR)" \
	  --data=$(BUILD_ROOT)/config.yaml \
	  --post-chomp index.html \
	  > $@

$(SITE_JS): js $(TEMPDIR)/jemplates force
	jemplate --runtime --compile $(TEMPDIR)/jemplates > $@

$(TEMPDIR)/jemplates: force
	mkdir -p $@
	@for j in $(JEMPLATES); do ( \
	  set -x; \
	  swim --to=html $(COG_ROOT)/node/$$j.cog > $@/$$j.html; \
	); done

$(HTMLDIR) js template page:
	mkdir -p $@

force:
	@# no-op

sub-status:
	@for d in $(TEMPDIR)/*; do \
	  [ -d $$d/.git ] && \
	  echo "== $$d ==" && \
	  (cd $$d; git status; echo); \
	  true; \
	done
