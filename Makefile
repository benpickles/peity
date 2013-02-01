jquery.peity.min.js: jquery.peity.js
	head -6 jquery.peity.js > jquery.peity.min.js
	ruby -rclosure-compiler -e "puts Closure::Compiler.new.compile(File.new('jquery.peity.js'))" >> jquery.peity.min.js
