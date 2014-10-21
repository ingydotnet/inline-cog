.PHONY: doc test

default: help

help:
	@echo 'Makefile targets:'
	@echo ''
	@echo '    doc          - Generate docs'
	@echo ''

#------------------------------------------------------------------------------
doc: ReadMe.pod

ReadMe.pod: doc/overview.swim
	swim --to=pod --complete=1 --wrap=1 $< > $@
