require 'rubygems'
require 'closure-compiler'

task :default => :minify

desc 'Generate minified version.'
task :minify do
  file = File.new('src/jquery.peity.js')
  minified = Closure::Compiler.new.compile(file)
  file.rewind

  licence = file.inject('') { |total, line|
    break(total) unless line =~ %r{^//}
    total << line
    total
  }

  File.open('src/jquery.peity.min.js', 'w') do |f|
    f.write licence
    f.write minified
  end

  puts 'Done.'
end
