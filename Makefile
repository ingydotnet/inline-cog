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
PERMANODES := v3e7 se9g y5yq

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

build: sub-dirs $(SITE_INDEX) $(PERMANODES) permapages $(SITE_JS)

clean purge:
	rm -fr $(TEMPDIR)

#------------------------------------------------------------------------------
$(SUBDIRS):
	git clone -b $(@:$(TEMPDIR)/%=%) \
	  $(REPO_URL) \
	  $(TEMPDIR)/$(@:$(TEMPDIR)/%=%)

$(SITE_INDEX): nodes
	tt-render \
	  --path="$(BUILD_ROOT)/template:$(HTMLDIR)" \
	  --data=$(BUILD_ROOT)/config.yaml \
	  --post-chomp index.html \
	  > $@

$(PERMANODES): node nodes
	tt-render \
	  --path="$(BUILD_ROOT)/template:$(HTMLDIR)" \
	  --data=$(BUILD_ROOT)/config.yaml \
	  --post-chomp $@.html \
	  > $</$@.html

permapages: page nodes
	ln -fs ../node/v3e7.html page/inline-module-spec.html
	ln -fs ../node/se9g.html page/inline-grant-weekly-report-1.html
	ln -fs ../node/y5yq.html page/inline-grant-accepted.html

nodes: $(HTMLDIR)
	swim --to=html $(COG_ROOT)/node/v3e7.cog \
	  | tee $(HTMLDIR)/v3e7.html \
	  > $(HTMLDIR)/inline-module-spec.html
	swim --to=html $(COG_ROOT)/node/se9g.cog \
	  | tee $(HTMLDIR)/se9g.html \
	  > $(HTMLDIR)/inline-grant-weekly-report-1.html
	swim --to=html $(COG_ROOT)/node/y5yq.cog \
	  | tee $(HTMLDIR)/y5yq.html \
	  > $(HTMLDIR)/inline-grant-accepted.html

$(SITE_JS): js $(TEMPDIR)/jemplates force
	jemplate --runtime --compile $(TEMPDIR)/jemplates > $@

$(TEMPDIR)/jemplates: force
	mkdir -p $@
	@for j in $(JEMPLATES); do ( \
	  set -x; \
	  swim --to=html $(COG_ROOT)/node/$$j.cog > $@/$$j.html; \
	); done

$(HTMLDIR) js template node page:
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
