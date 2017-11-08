

 
d3.csv('./data.csv', function(d, i, headers) {

// forming nodes
  var markers = headers.slice(2).filter(h => d[h] === '1');     
  return {
    name: d.name,
    gender: d.gender,
    markers: markers
  }
}, function(error, nodes) {
  if (error) throw error;


  var links = makeLinks(nodes);
  var width = 750;
  var height = 750;
  var svg = d3.select("svg")
                  .attr("width", width)
                  .attr("height", height);

  var linkGp = svg.append('g')
                   .classed("links", true);

  var nodeGp = svg.append('g')
                   .classed("nodes", true);



  var simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-100))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("link", d3.forceLink(links)
                     .distance(d => {
                      var count1 = d.source.markers.length;
                      var count2 = d.target.markers.length;
                      return 25 * Math.max(count1, count2);        
                     })
                     .id(d => d.name))
    .on("tick", () => {                                         // for node and link placement       
      linkGp
        .selectAll("line")
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y)
          .attr("stroke-width",3);

      nodeGp
        .selectAll("circle")
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);
    });

  graph(nodes, links);
  setUpCheckboxes(nodes.columns.slice(2));


  function graph(nodeData, linkData) {
    var genderScale = d3.scaleOrdinal()
                       .domain(["M", "F"])
                       .range(["orange", "pink"]);

    var nodeUpdate = nodeGp
      .selectAll("circle")
      .data(nodeData, d => d.name);

    nodeUpdate
      .exit()
      .remove();

    nodeUpdate
      .enter()
      .append("circle")
        .attr("r", 10)
        .attr("fill", d => genderScale(d.gender))
        .attr("stroke", "black")
        .attr("stroke-width", 3)
        .call(d3.drag()
                .on("start", dragStart)
                .on("drag", drag)
                .on("end", dragEnd))
        .on("mousemove touchmove", showTooltip)
        .on("mouseout touchend", hideTooltip);




    var linkUpdate = linkGp
      .selectAll("line")
      .data(linkData, d => d.source.name + d.target.name);   // for unique link id

    linkUpdate
      .exit()
      .remove();

    linkUpdate
      .enter()
      .append("line");
  }



  function setUpCheckboxes(markers) {
    var boxAreas = d3.select("#checkboxes")
      .selectAll("div")
      .data(markers)
      .enter()
      .append("div");

    boxAreas
      .append("label")
      .property("for", d => d)
      .text(d => d+" ");

    boxAreas
      .append("input")
        .property("type", "checkbox")
        .property("name", "marker")
        .property("value", d => d)
        .property("checked", true)
        .on("click", () => {
          var activemarkers = markers.filter(c => d3.select(`input[value="${c}"]`)
                  .property("checked"));
          var newNodes = nodes.map(n => {
            return {
              name: n.name,
              gender: n.gender,
              markers: n.markers.filter(c => activemarkers.includes(c)),
              x: n.x,
              y: n.y,
              vx: n.vx,
              vy: n.vy
            }
          }).filter(n => n.markers.length > 0);
          var newLinks = makeLinks(newNodes);
          graph(newNodes, newLinks);
          simulation.nodes(newNodes)
                    .force("link")
                      .links(newLinks);

          simulation.alpha(0.5).restart();
        });
  }


  function showTooltip(d) {
    var tooltip = d3.select(".tooltip");
    tooltip
        .style("opacity", 1)
        .style("left", (d3.event.x - tooltip.node().offsetWidth / 2) + "px")
        .style("top", (d3.event.y+100) + "px")
        .html(() => {
          var markers = d.markers.map(c => `<li>${c}</li>`).join('')
          return `
            <p>${d.name} (${d.gender})</p>
            <p>MARKERS</p>
            <ol>${markers}</ol>
          `
        });
  }

  function hideTooltip() {
    d3.select(".tooltip")
        .style("opacity", 0);
  }

  function dragStart(d) {
    simulation.alphaTarget(0.5).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function drag(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragEnd(d) {
    simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }



//forming links - between any two persons who have the same marker
  function makeLinks(nodes) {
    var links = [];
    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var s1 = nodes[i];
        var s2 = nodes[j];
        for (var k = 0; k < s1.markers.length; k++) {
          var marker = s1.markers[k];
          if (s2.markers.includes(marker)) {
            links.push({
              source: s1.name,
              target: s2.name
            });
            break;
          }
        }
      }
    }
    return links;
  }

});
  
