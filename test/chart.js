class Chart {
  constructor(id, props) {
    this.id = id
    this.opts = props.opts
    this.text = props.text
    this.type = props.type
  }

  optionsString() {
    switch (typeof this.opts) {
      case 'object':
        return JSON.stringify(this.opts)
      case 'string':
        return this.opts
      default:
        return '{}'
    }
  }
}

module.exports = Chart
