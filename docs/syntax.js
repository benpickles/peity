CodeHighlighter.addStyle("html", {
  comment: {
    exp: /&lt;!\s*(--([^-]|[\r\n]|-[^-])*--\s*)&gt;/
  },
  tag: {
    exp: /(&lt;\/?)([a-zA-Z]+\s?)/,
    replacement: "$1<span class=\"$0\">$2</span>"
  },
  string: {
    exp: /'[^']*'|"[^"]*"/
  },
  attribute: {
    exp: /\b([a-zA-Z-:]+)(=)/,
    replacement: "<span class=\"$0\">$1</span>$2"
  },
  doctype: {
    exp: /&lt;!DOCTYPE([^&]|&[^g]|&g[^t])*&gt;/
  }
});

CodeHighlighter.addStyle("javascript",{
  comment: {
    exp: /(\/\/[^\n]*(\n|$))|(\/\*[^*]*\*+([^\/][^*]*\*+)*\/)/
  },
  brackets: {
    exp: /\(|\)/
  },
  string: {
    exp: /'[^'\\]*(\\.[^'\\]*)*'|"[^"\\]*(\\.[^"\\]*)*"/
  },
  keywords: {
    exp: /\b(arguments|break|case|continue|default|delete|do|else|false|for|function|if|in|instanceof|match|new|null|return|switch|this|true|typeof|var|void|while|with)\b/
  },
  global: {
    exp: /\b(toString|valueOf|window|element|prototype|constructor|document|escape|unescape|parseInt|parseFloat|setTimeout|clearTimeout|setInterval|clearInterval|NaN|isNaN|Infinity)\b/
  },
  regexp: {
    exp: /\/.+\//
  }
});
