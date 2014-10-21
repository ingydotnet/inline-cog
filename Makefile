.PHONY: doc test

BRANCHES := bootstrap build cog cogdb gh-pages
REPO_URL := ingydotnet/inline-cog

default: help

help:
	@echo 'Makefile targets:'
	@echo ''
	@echo '    build        - Rebuild website'
	@echo '    publish      - Make website changes go live'
	@echo '    update       - Sync repo and generate docs'
	@echo '    clean        - Delete generated content'
	@echo ''
	@echo '    doc          - Generate docs'
	@echo '    subdirs      - Fetch branches as subdirs'
	@echo ''

build: gh-pages
	make -C gh-pages $@

publish:
	@echo STUB

update: doc

clean:
	rm -fr $(BRANCHES)

#------------------------------------------------------------------------------
doc: ReadMe.pod

ReadMe.pod: doc/overview.swim
	swim --to=pod --complete=1 --wrap=1 $< > $@

subdirs:
	@for dir in $(BRANCHES); do \
	  ( \
	    set -x; \
	    [ -d $$dir ] || \
	      git clone -b $$dir git@github.com:$(REPO_URL) $$dir; \
	  ) || exit $$?; \
	done

gh-pages:
	git clone -b gh-pages git@github.com:$(REPO_URL) gh-pages

# update: branches
# 	@for dir in $(BRANCHES); do \
# 	  ( \
# 	    set -x; \
# 	    cd $$dir; \
# 	    [ -z "$$(git status -s)" ] || \
# 	      { echo "$$dir unclean"; exit 1; }; \
# 	    git fetch; git rebase origin/$$dir; \
# 	  ) || exit $$?; \
# 	done

