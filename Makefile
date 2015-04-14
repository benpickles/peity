VERSION = $(shell head -1 jquery.peity.js | awk '{print $$(NF)}')

first: test

%.json: jquery.peity.js
	sed -i '' 's/\"version":.*,/"version": "$(VERSION)",/' $@

jquery.peity.min.js: jquery.peity.js
	head -6 $< > $@
	ruby -rbundler/setup -rclosure-compiler -e "puts Closure::Compiler.new.compile(File.new('$<'))" >> $@

jquery.peity.min.js.gz: jquery.peity.min.js
	gzip -9f < $< > $@

clean:
	rm jquery.peity.min.js*

docs: jquery.peity.min.js.gz
	bin/update_docs $(VERSION)

fixtures:
	rm -f test/fixtures/*
	node test/fixtures.js

release: test docs bower.json package.json
	@printf '\e[0;32m%-6s\e[m\n' "Happy days, everything passes. Make sure CHANGELOG.md is already up-to-date, commit everything, and tag it:"
	@echo '  $$ git commit -m "Version $(VERSION)."'
	@echo '  $$ git tag v$(VERSION)'
	@echo '  $$ npm publish'

server:
	node test/server.js

test:
	rm -f test/comparisons/*
	rm -f test/images/*
	./node_modules/.bin/mocha -R spec -t 30000 $(ARGS) ./test/index.js

.PHONY: clean fixtures release server test
