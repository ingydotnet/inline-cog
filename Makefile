.PHONY: doc test

BRANCHDIR := _branch
BRANCHES := bootstrap build cog cogdb gh-pages
SUBDIRS  := $(BRANCHES:%=$(BRANCHDIR)/%)
REPO_URL := ingydotnet/inline-cog

default: help

help:
	@echo 'Makefile targets:'
	@echo ''
	@echo '    build        - Rebuild website'
	@echo '    publish      - Make website changes go live'
	@echo '    clean        - Delete generated content'
	@echo ''

build: $(SUBDIRS)
	ls -l $(SUBDIRS)

publish:
	@echo STUB

clean:
	rm -fr $(BRANCHDIR)

#------------------------------------------------------------------------------
$(SUBDIRS): $(BRANCHDIR)
	git clone -b $(@:$(BRANCHDIR)/%=%) \
	  git@github.com:$(REPO_URL) \
	  $(BRANCHDIR)/$(@:$(BRANCHDIR)/%=%)

$(BRANCHDIR):
	mkdir $@
