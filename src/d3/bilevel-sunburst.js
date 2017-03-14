jQuery(document).ready(function($) {

//var margin = {top: 350, right: 480, bottom: 350, left: 480};
//var radius = Math.min(margin.top, margin.right, margin.bottom, margin.left) - 10;
var width = 600;
var height = 600;
var margin = 10;
var radius = Math.min(width / 2, height / 2) - margin;

var formatNumber = d3.format(",d");

var hue = d3.scale.category20();

var luminance = d3.scale.sqrt()
    .domain([0, 1e6])
    .clamp(true)
    .range([90, 20]);

var svg = d3.select("body").append("svg")
    .attr("id", "svgid")
    //.attr("width", margin.left + margin.right)
    .attr('width', width)
    //.attr("height", margin.top + margin.bottom)
    .attr('height', height)
  .append("g")
    //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

var partition = d3.layout.partition()
    .sort(function(a, b) { return d3.ascending(a.name, b.name); })
    .size([2 * Math.PI, radius]);

var arc = d3.svg.arc()
    .startAngle(function(d) { return d.x; })
    .endAngle(function(d) { return d.x + d.dx ; })
    .padAngle(.01)
    .padRadius(radius / 3)
    .innerRadius(function(d) { return radius / 3 * d.depth; })
    .outerRadius(function(d) { return radius / 3 * (d.depth + 1) - 1; });

// calculate the position for the explanation overlay.
// we need wait the svg is create.
var offset = $('#svgid').offset();
var labelTop = offset['top'] + height / 2 - 50;
var labelLeft = offset['left'] + width / 2 - 90;
$('#explanation').css('left', labelLeft).css('top', labelTop);

d3.json("../google/data/2017-03-13-sunburst.json", function(error, root) {
  if (error) throw error;

  // Compute the initial layout on the entire tree to sum sizes.
  // Also compute the full name and fill color for each node,
  // and stash the children so they can be restored as we descend.
  partition
      .value(function(d) { return d.size; })
      .nodes(root)
      .forEach(function(d) {
        d._children = d.children;
        d.sum = d.value;
        d.key = key(d);
        d.fill = fill(d);
      });

  //console.log("root.value = " + root.value);
  // date only need set once.
  $("#date").text('2017-03-08');
  $("#pageviews").text(formatNumber(root.value));
  $("#group").text('All OPSpedia');

  // Now redefine the value function to use the previously-computed sum.
  partition
      .children(function(d, depth) { return depth < 2 ? d._children : null; })
      .value(function(d) { return d.sum; });

  var center = svg.append("circle")
      .attr("r", radius / 3)
      .on("click", zoomOut);

  center.append("title")
      //.text(function(d) {return d.name + "\n" + formatNumber(d.value);});
      .text("zoom out");

  var path = svg.selectAll("path")
      .data(partition.nodes(root).slice(1))
    .enter().append("path")
      .attr("d", arc)
      .style("fill", function(d) { return d.fill; })
      .each(function(d) { this._current = updateArc(d); })
      .on("click", zoomIn);
  // add the tooltip
  path.append("title")
      .text(function(d) {
          return d.name + "\n" + formatNumber(d.value) + " Pageviews";
      });

  function zoomIn(p) {
    if (p.depth > 1) p = p.parent;
    if (!p.children) return;

    //console.log("zoom in p.value = " + p.value);
    //console.log("zoom in p.name = " + p.name);
    $("#pageviews").text(formatNumber(p.value));
    $("#group").text(p.name);

    zoom(p, p);
  }

  function zoomOut(p) {
    if (!p) return;
    if (!p.parent) return;

    //console.log("zoom out p.value = " + p.parent.value);
    //console.log("zoom out p.name = " + p.parent.name);
    //console.log(p.parent);
    $("#pageviews").text(formatNumber(p.parent.sum));
    $("#group").text(p.parent.name);

    zoom(p.parent, p);
  }

  // Zoom to the specified new root.
  function zoom(root, p) {
    if (document.documentElement.__transition__) return;

    // Rescale outside angles to match the new layout.
    var enterArc,
        exitArc,
        outsideAngle = d3.scale.linear().domain([0, 2 * Math.PI]);

    function insideArc(d) {
      return p.key > d.key
          ? {depth: d.depth - 1, x: 0, dx: 0} : p.key < d.key
          ? {depth: d.depth - 1, x: 2 * Math.PI, dx: 0}
          : {depth: 0, x: 0, dx: 2 * Math.PI};
    }

    function outsideArc(d) {
      return {depth: d.depth + 1, x: outsideAngle(d.x), dx: outsideAngle(d.x + d.dx) - outsideAngle(d.x)};
    }

    center.datum(root);

    // When zooming in, arcs enter from the outside and exit to the inside.
    // Entering outside arcs start from the old layout.
    if (root === p) enterArc = outsideArc, exitArc = insideArc, outsideAngle.range([p.x, p.x + p.dx]);

    path = path.data(partition.nodes(root).slice(1), function(d) { return d.key; });

    // When zooming out, arcs enter from the inside and exit to the outside.
    // Exiting outside arcs transition to the new layout.
    if (root !== p) enterArc = insideArc, exitArc = outsideArc, outsideAngle.range([p.x, p.x + p.dx]);

    d3.transition().duration(d3.event.altKey ? 7500 : 750).each(function() {
      path.exit().transition()
          .style("fill-opacity", function(d) { return d.depth === 1 + (root === p) ? 1 : 0; })
          .attrTween("d", function(d) { return arcTween.call(this, exitArc(d)); })
          .remove();

      path.enter().append("path")
          .style("fill-opacity", function(d) { return d.depth === 2 - (root === p) ? 1 : 0; })
          .style("fill", function(d) { return d.fill; })
          .on("click", zoomIn)
          .each(function(d) { this._current = enterArc(d); });
  // add the tooltip
  path.append("title")
      .text(function(d) {
          return d.name + "\n" + formatNumber(d.value) + " Pageviews";
      });

      path.transition()
          .style("fill-opacity", 1)
          .attrTween("d", function(d) { return arcTween.call(this, updateArc(d)); });
    });
  }
});

function key(d) {
  var k = [], p = d;
  while (p.depth) k.push(p.name), p = p.parent;
  return k.reverse().join(".");
}

function fill(d) {
  var p = d;
  while (p.depth > 1) p = p.parent;
  var c = d3.lab(hue(p.name));
  c.l = luminance(d.sum);
  return c;
}

function arcTween(b) {
  var i = d3.interpolate(this._current, b);
  this._current = i(0);
  return function(t) {
    return arc(i(t));
  };
}

function updateArc(d) {
  return {depth: d.depth, x: d.x, dx: d.dx};
}

//d3.select(self.frameElement).style("height", margin.top + margin.bottom + "px");
d3.select(self.frameElement).style("height", height + "px");
});
