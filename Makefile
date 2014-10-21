SITE_DIR := gh-pages
SITE_INDEX := $(SITE_DIR)/index.html

default: all

all: $(SITE_INDEX) clean

posts:
	swim --to=html node/y5yq.cog > inline-grant-accepted.html

template:
	mkdir $@

$(SITE_INDEX): posts
	tt-render --path=.:template --data=config.yaml --post-chomp index.html > $@

clean:
	rm inline-grant-accepted.html
