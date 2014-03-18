jquery.peity.min.js: jquery.peity.js
	head -6 $< > $@
	ruby -rbundler/setup -rclosure-compiler -e "puts Closure::Compiler.new.compile(File.new('$<'))" >> $@

jquery.peity.min.js.gz: jquery.peity.min.js
	gzip -9f < $< > $@

clean:
	rm jquery.peity.min.js*

server:
	node test/server.js

sizes: jquery.peity.min.js.gz
	ls -lh jquery.peity.* | awk '{print $$5}'

.PHONY: clean server
