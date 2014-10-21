.PHONY: doc test

default: help

help:
	@echo 'Makefile targets:'
	@echo ''
	@echo '    doc          - Rebuild doc and ReadMe.pod'
	@echo '    build        - Rebuild website'
	@echo '    update       - Sync all the branches'
	@echo ''

doc: ReadMe.pod

ReadMe.pod: doc/overview.swim
	swim --to=pod --complete=1 --wrap=1 $< > $@

update: branches
	@for dir in build cog cogdb gh-pages; do \
	  ( \
	    set -x; \
	    cd $$dir; \
	    [ -z "$$(git status -s)" ] || \
	      { echo "$$dir unclean"; exit 1; }; \
	    git fetch; git rebase origin/$$dir; \
	  ) || exit $$?; \
	done

branches:
	@for dir in build cog cogdb gh-pages; do \
	  ( \
	    set -x; \
	    [ -d $$dir ] || git clone -b $$dir \
	      git@github.com:ingydotnet/inline-cog $$dir; \
	  ) || exit $$?; \
	done
