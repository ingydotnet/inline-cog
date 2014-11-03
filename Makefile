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
COGNODES := \
	ecf6 \
	se9g \
	v3e7 \
	y5yq \
	y6ut \

ALL_SWIM := $(COGNODES:%=tmp/swim/%.swim)
ALL_YAML := $(COGNODES:%=tmp/yaml/%.yaml)
ALL_HTML := $(COGNODES:%=tmp/html/%.html)
ALL_NODE := $(COGNODES:%=node/%.html)

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

# foreach node in COGNODES
#   make tmp/swim/id.swim
#   make tmp/yaml/id.yaml
#   use swim + yaml to make
#     tmp/html/id.html template
#   render node/id.html
# make index.html
# make css

build: $(SUBDIRS) \
	$(ALL_SWIM) \
	$(ALL_YAML) \
	$(ALL_HTML) \
	$(ALL_NODE) \
	permapages \
	$(SITE_INDEX) \
	$(SITE_JS) \
	$(ALL_JSON) \
	css/blog.css \
	css/cog.css \

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
$(SUBDIRS):
	git clone -b $(@:$(BRANCHDIR)/%=%) \
	  $(REPO_URL) \
	  $(BRANCHDIR)/$(@:$(BRANCHDIR)/%=%)

$(TEMPDIR)/swim/%.swim: $(COG_ROOT)/node/%.cog $(TEMPDIR)/swim
	$(BUILD_ROOT)/bin/cog2swim $< > $@

$(TEMPDIR)/yaml/%.yaml: $(COG_ROOT)/node/%.cog $(TEMPDIR)/yaml
	$(BUILD_ROOT)/bin/cog2yaml $< > $@

$(HTMLDIR)/%.html: $(TEMPDIR)/swim/%.swim $(HTMLDIR)
	swim --to=html $< > $@

node/%.html: node
	tt-render \
	  --path="$(BUILD_ROOT)/template:$(HTMLDIR)" \
	  --data=$(@:node/%.html=$(TEMPDIR)/yaml/%.yaml) \
	  --post-chomp page.html \
	  > $@

# Need to figure out a good Makefile abstraction for this:
permapages: page
	cp node/ecf6.html page/inline-grant-weekly-report-2.html
	cp node/se9g.html page/inline-grant-weekly-report-1.html
	cp node/v3e7.html page/inline-module-spec.html
	cp node/y5yq.html page/inline-grant-accepted.html
	cp node/y6ut.html page/ingy-and-david-bio.html

$(SITE_INDEX):
	tt-render \
	  --path="$(BUILD_ROOT)/template:$(HTMLDIR)" \
	  --data=$(ALL_JSON) \
	  --post-chomp home.html \
	  > $@

#------------------------------------------------------------------------------

$(ALL_JSON):
	$(BUILD_ROOT)/bin/all-json > $@

$(SITE_JS): js $(TEMPDIR)/jemplates force
	jemplate --runtime --compile $(TEMPDIR)/jemplates > $@

$(TEMPDIR)/jemplates: $(TEMPDIR) force
	mkdir -p $@
	@for j in $(COGNODES); do ( \
	  set -x; \
	  swim --to=html $(COG_ROOT)/node/$$j.cog > $@/$$j.html; \
	); done

$(TEMPDIR) $(TEMPDIR)/yaml $(TEMPDIR)/swim $(HTMLDIR) js template node page css:
	mkdir -p $@

force:
	@# no-op

css/blog.css css/cog.css: css
	cp branch/bootstrap/$(@:css/%=%) $@
