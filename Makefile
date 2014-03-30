jquery.peity.min.js: jquery.peity.js
	head -6 $< > $@
	ruby -rbundler/setup -rclosure-compiler -e "puts Closure::Compiler.new.compile(File.new('$<'))" >> $@

jquery.peity.min.js.gz: jquery.peity.min.js
	gzip -9f < $< > $@

clean:
	rm jquery.peity.min.js*

fixtures:
	rm -f test/fixtures/*
	node test/fixtures.js

server:
	node test/server.js

sizes: jquery.peity.min.js.gz
	ls -lh jquery.peity.* | awk '{print $$5}'

test:
	rm -f test/comparisons/*
	rm -f test/images/*
	./node_modules/.bin/mocha -R spec -t 30000 $(ARGS) ./test/index.js

.PHONY: clean fixtures server test
