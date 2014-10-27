.PHONY: branch doc test

BRANCHDIR  := branch
TEMPDIR    := tmp
HTMLDIR    := $(TEMPDIR)/html
BRANCHES   := bootstrap build cog cogdb
SUBDIRS    := $(BRANCHES:%=$(BRANCHDIR)/%)
REPO_URL   := git@github.com:ingydotnet/inline-cog
SITE_INDEX := ./index.html
SITE_JS    := js/all.js
ALL_JSON   := js/all.json
COG_ROOT   := $(BRANCHDIR)/cog
BUILD_ROOT := $(BRANCHDIR)/build

# TODO Get COGNODES values from build/config.yaml→recent
COGNODES   := \
	se9g \
	v3e7 \
	y5yq \
	y6ut \

ALL_YAML := $(COGNODES:%=tmp/yaml/%.yaml)
ALL_SWIM := $(COGNODES:%=tmp/swim/%.swim)

default: help

help:
	@echo 'Makefile targets:'
	@echo ''
	@echo '    branch         - Clone branches into branch/'
	@echo '    build          - Rebuild website'
	@echo '    clean          - Delete generated content'
	@echo ''
	@echo '    branch-status  - Check subrepo/branch statuses'
	@echo ''

branch: $(SUBDIRS)

build: branch \
	$(TEMPDIR)/yaml \
	$(TEMPDIR)/swim \
	$(ALL_JSON) \
	$(ALL_YAML) \
	$(ALL_SWIM) \
	$(SITE_INDEX) \
	$(COGNODES) \
	permapages \
	$(SITE_JS) \

clean purge:
	rm -fr $(TEMPDIR) $(BRANCHDIR)

branch-status:
	@for d in $(BRANCHDIR)/*; do \
	  [ -d $$d/.git ] && \
	  echo "== $$d ==" && \
	  (cd $$d; git status; echo); \
	  true; \
	done

#------------------------------------------------------------------------------
$(ALL_JSON):
	$(BUILD_ROOT)/bin/all-json > $@

$(TEMPDIR)/yaml/%.yaml: $(COG_ROOT)/node/%.cog
	$(BUILD_ROOT)/bin/cog2yaml $< > $@

$(TEMPDIR)/swim/%.swim: $(COG_ROOT)/node/%.cog
	$(BUILD_ROOT)/bin/cog2swim $< > $@

$(SUBDIRS):
	git clone -b $(@:$(BRANCHDIR)/%=%) \
	  $(REPO_URL) \
	  $(BRANCHDIR)/$(@:$(BRANCHDIR)/%=%)

$(SITE_INDEX): nodes
	tt-render \
	  --path="$(BUILD_ROOT)/template:$(HTMLDIR)" \
	  --data=$(ALL_JSON) \
	  --post-chomp home.html \
	  > $@

$(COGNODES): node nodes
	tt-render \
	  --path="$(BUILD_ROOT)/template:$(HTMLDIR)" \
	  --data=$(ALL_JSON) \
	  --post-chomp $@.html \
	  > $</$@.html

permapages: page $(COGNODES)
	cp node/se9g.html page/inline-grant-weekly-report-1.html
	cp node/v3e7.html page/inline-module-spec.html
	cp node/y5yq.html page/inline-grant-accepted.html
	cp node/y6ut.html page/ingy-and-david-bio.html

nodes: $(HTMLDIR)
	swim --to=html $(COG_ROOT)/node/se9g.cog \
	  | tee $(HTMLDIR)/se9g.html \
	  > $(HTMLDIR)/inline-grant-weekly-report-1.html
	swim --to=html $(COG_ROOT)/node/v3e7.cog \
	  | tee $(HTMLDIR)/v3e7.html \
	  > $(HTMLDIR)/inline-module-spec.html
	swim --to=html $(COG_ROOT)/node/y5yq.cog \
	  | tee $(HTMLDIR)/y5yq.html \
	  > $(HTMLDIR)/inline-grant-accepted.html
	swim --to=html $(COG_ROOT)/node/y6ut.cog \
	  | tee $(HTMLDIR)/y6ut.html \
	  > $(HTMLDIR)/ingy-and-david-bio.html

$(SITE_JS): js $(TEMPDIR)/jemplates force
	jemplate --runtime --compile $(TEMPDIR)/jemplates > $@

$(TEMPDIR)/jemplates: $(TEMPDIR) force
	mkdir -p $@
	@for j in $(COGNODES); do ( \
	  set -x; \
	  swim --to=html $(COG_ROOT)/node/$$j.cog > $@/$$j.html; \
	); done

$(TEMPDIR) $(TEMPDIR)/yaml $(TEMPDIR)/swim $(HTMLDIR) js template node page:
	mkdir -p $@

force:
	@# no-op
