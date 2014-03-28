var Backbone = require("backbone");
var _ = require("underscore");

AudioCurves = {
  linear: {
    fun: function (x) { return x },
    inv: function (y) { return y }
  },
  quad: {
    fun: function (x) { return x*x },
    inv: function (y) { return Math.sqrt(y) }
  },
  quadOut: {
    fun: function (x) { return x*(2-x) },
    inv: function (y) { return 1-Math.sqrt(1-y) }
  },
  quadCenter: {
    fun: function (x) { var a = x-0.5; return (x > 0.5 ? 1 : -1)*2*a*a+0.5 },
    inv: function (y) { var m = y > 0.5 ? 1 : -1; var a = m*(8*y-4); return 0.5+m*0.25*Math.sqrt(a) }
  },
  cubic: {
    fun: function (x) { return x*x*x },
    inv: function (y) { return Math.pow(y, 1/3) }
  }
};

Parameter = Backbone.Model.extend({
  defaults: {
    from: 0,
    to: 1,
    value: 0,
    curve: "linear",
    title: "",
    fixed: 2,
    granularity: 1000,
    getText: function () {
      return this.get("value").toFixed(this.get("fixed"));
    }
  },
  initialize: function (opts) {
    if (opts.values) {
      this.set({
        from: 0,
        granularity: opts.values.length-1,
        to: opts.values.length-1,
        getText: opts.getText || function () {
          return this.get("values")[this.get("value")];
        }
      });
    }
    this.set("id", this.get("id")||this.cid);
    this.on("change:curve", this.syncCurve);
    if (!this.get("name")) this.set("name", this.get("id"));
    this.syncCurve();
  },
  syncCurve: function () {
    this.curve = AudioCurves[this.get("curve")];
  },
  setPercent: function (percent) {
    var from = this.get("from");
    var to = this.get("to");
    var value = from+this.curve.fun(percent)*(to-from);
    this.set("value", value);
  },
  getText: function () {
    return this.get("getText").call(this);
  },
  getPercent: function () {
    var value = this.get("value");
    var from = this.get("from");
    var to = this.get("to");
    return this.curve.inv((value-from)/(to-from));
  }
});

ParameterSlider = Backbone.View.extend({
  tagName: "p",
  attributes: {
    style: "clear:both"
  },
  tmpl: _.template('<label style="float:left" for="<%= id %>"><%= title %></label>'+
    '<span class="value" style="float:right"></span>'+
    '<input style="clear:both;width:100%;font:normal 1em monospace" id="<%= id %>" type="range" min="0" max="<%= granularity %>" />'
    ),
  initialize: function (opts) {
    this.render();
    if ('width' in opts) {
      this.$el.css({
        width: opts.width,
        display: "inline-block"
      });
    }
    this.listenTo(this.model, "change:value", this.onValueChange);
  },
  getRangeValueFromModel: function () {
    return Math.round(this.model.get("granularity")*this.model.getPercent());
  },
  render: function () {
    this.$el.html(this.tmpl(this.model.attributes));
    this.$range = this.$el.find("input");
    this.$valueText = this.$el.find(".value");
    this.$range.on("change", _.bind(function (e) {
      this._dontSetInputValue = true;
      this.model.setPercent(parseInt(this.$range.val(), 10)/this.model.get("granularity"));
      this._dontSetInputValue = false;
    }, this));
    this.onValueChange.call(this, this.model, this.model.get("value"));
  },
  onValueChange: function (model) {
    var value = this.getRangeValueFromModel();
    if (!this._dontSetInputValue) {
      this.$range.val(value);
    }
    this.$valueText.text( this.model.getText() );
  }
});


