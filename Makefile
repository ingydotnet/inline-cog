.PHONY: doc test

TEMPDIR    := tmp
HTMLDIR    := tmp/html
BRANCHES   := bootstrap build cog cogdb gh-pages
SUBDIRS    := $(BRANCHES:%=$(TEMPDIR)/%)
REPO_URL   := git@github.com:ingydotnet/inline-cog
SITE_INDEX := ./index.html

COG_ROOT   := $(TEMPDIR)/cog
BUILD_ROOT   := $(TEMPDIR)/build

default: help

help:
	@echo 'Makefile targets:'
	@echo ''
	@echo '    update       - Sync for build'
	@echo '    build        - Rebuild website'
	@echo '    clean        - Delete generated content'
	@echo ''

update: $(SUBDIRS)

build: update $(SITE_INDEX)

clean purge:
	rm -fr $(TEMPDIR)

#------------------------------------------------------------------------------
$(SUBDIRS):
	git clone -b $(@:$(TEMPDIR)/%=%) \
	  $(REPO_URL) \
	  $(TEMPDIR)/$(@:$(TEMPDIR)/%=%)

posts: $(HTMLDIR)
	swim --to=html $(COG_ROOT)/node/y5yq.cog \
	  > $(HTMLDIR)/inline-grant-accepted.html

template:
	mkdir $@

$(SITE_INDEX): posts
	tt-render \
	  --path="$(BUILD_ROOT)/template:$(HTMLDIR)" \
	  --data=$(BUILD_ROOT)/config.yaml \
	  --post-chomp index.html \
	  > $@

$(HTMLDIR):
	mkdir -p $@
