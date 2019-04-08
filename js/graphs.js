var vis = {}; //namespace
vis.data = []; //processed & filtered data
vis.dselection = new Set(); //selected data from pc chart
vis.yselection = "Surface temperature";
vis.graphlabel;

vis.pc_chart = function() {
  var margin = { top: 30, right: 10, bottom: 10, left: 10 },
    twidth = 960,
    width = twidth - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    x = d3.scale.ordinal().rangePoints([0, width], 1),
    y = {},
    line = d3.svg.line(),
    axis = d3.svg.axis().orient("left"),
    background,
    foreground,
    data = [];

  //Convert data, remove unnecessary dimensions
  vis.data.forEach(function(d, i) {
    data.push({
      name: d.id,
      "Planetary mass": d["Planetary mass"],
      Period: d.Period,
      "Surface temperature (K)": d["Surface temperature"],
      "Host star radius": d["Host star radius"],
      "Host star temperature": d["Host star temperature"]
    });
  });

  var div = d3
    .selectAll("#group1")
    .attr("class", "graphgroup")
    .attr("style", "max-width: " + twidth + "px");

  var resetButton = div
    .append("input")
    .style("margin-right", "20px")
    .attr("id", "reset")
    .attr("type", "button")
    .attr("value", "Reset!")
    .attr("onClick", "window.location.reload()");

  var svg = div
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  x.domain(
    (dimensions = d3.keys(data[0]).filter(function(d) {
      return (
        d != "name" &&
        (y[d] = d3.scale
          .linear()
          .domain(
            d3.extent(data, function(p) {
              return +p[d];
            })
          )
          .range([height, 0]))
      );
    }))
  );

  // Add grey background lines for context.
  background = svg
    .append("g")
    .attr("class", "background")
    .selectAll("path")
    .data(data)
    .enter()
    .append("path")
    .attr("d", path);

  // Add crimson foreground lines for focus.
  foreground = svg
    .append("g")
    .attr("class", "foreground")
    .selectAll("path")
    .data(data)
    .enter()
    .append("path")
    .attr("d", path);

  // Add a group element for each dimension.
  var g = svg
    .selectAll(".dimension")
    .data(dimensions)
    .enter()
    .append("g")
    .attr("class", "dimension")
    .attr("transform", function(d) {
      return "translate(" + x(d) + ")";
    });

  // Add an axis and title.
  g.append("g")
    .attr("class", "axis")
    .each(function(d) {
      d3.select(this).call(axis.scale(y[d]));
    })
    .append("text")
    .style("text-anchor", "middle")
    .attr("y", -9)
    .text(function(d) {
      return d;
    });

  // Add and store a brush for each axis.
  g.append("g")
    .attr("class", "brush")
    .each(function(d) {
      d3.select(this).call(
        (y[d].brush = d3.svg
          .brush()
          .y(y[d])
          .on("brush", brush))
      );
    })
    .selectAll("rect")
    .attr("x", -8)
    .attr("width", 16);

  // Returns the path for a given data point.
  function path(d) {
    return line(
      dimensions.map(function(p) {
        return [x(p), y[p](d[p])];
      })
    );
  }

  // Handles a brush event, toggling the display of foreground lines.
  function brush() {
    var actives = dimensions.filter(function(p) {
        return !y[p].brush.empty();
      }),
      extents = actives.map(function(p) {
        return y[p].brush.extent();
      });
    foreground.style("display", function(d) {
      return actives.every(function(p, i) {
        return extents[i][0] <= d[p] && d[p] <= extents[i][1];
      })
        ? null
        : "none";
    });

    vis.dselection.clear();
    svg
      .select(".foreground")
      .selectAll("path")
      .each(function(d, i) {
        if (d3.select(this).style("display") != "none") {
          vis.dselection.add(d.name);
        }
      });
    vis.bar_chart.update();
  }
};

vis.bar_chart = function() {
  var margin = { top: 30, right: 120, bottom: 70, left: 110 },
    twidth = 960,
    width = twidth - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    x = d3.scale.ordinal().rangeRoundBands([0, width], 0.05),
    y = d3.scale.linear().range([height, 0]),
    colour = d3.scale.category10(),
    data = vis.data;

  x.domain(
    data.map(function(d) {
      return d.id;
    })
  );

  vis.bar_chart.barMargin = function() {
    var dsMax = d3.max(data, function(d) {
      return d[vis.yselection];
    });

    var dsMin = d3.min(data, function(d) {
      return d[vis.yselection];
    });

    return (dsMax - dsMin) / 100;
  };

  var barMargin = vis.bar_chart.barMargin();

  y.domain([
    d3.min(data, function(d) {
      return d[vis.yselection];
    }) - barMargin,
    d3.max(data, function(d) {
      return d[vis.yselection];
    }) + barMargin
  ]).nice();

  var xAxis = d3.svg
    .axis()
    .scale(x)
    .orient("bottom");

  var yAxis = d3.svg
    .axis()
    .scale(y)
    .orient("left")
    .ticks(10);

  var div = d3
    .selectAll("#group2")
    .attr("class", "graphgroup")
    .style({ "max-width": twidth + "px", position: "relative" });

  var selectBox = div
    .append("select")
    //.attr("style", "margin-right: " + margin.right + "px")
    .style("margin-right", "20px")
    .style("margin-top", "20px")
    .attr("id", "opts")
    .selectAll("option")
    .data(
      Object.keys(data[0]).filter(function(d, i) {
        var undesirables = [
          "id",
          "Declination",
          "Age",
          "Last updated",
          "Binary flag",
          "Discovery year",
          "Discovery Method",
          "Planet Detection Status List",
          "Right ascension"
        ];

        return !undesirables.includes(d);
      })
    )
    .enter()
    .append("option")
    .text(function(d, i) {
      return d;
    })
    .attr("value", function(d, i) {
      return d;
    })
    .attr("selected", function(d) {
      return d == vis.yselection ? "selected" : null;
    });

  var tooltip = div
    .append("div")
    .attr("id", "tooltip")
    .attr("class", "hidden");

  var svg = div
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  svg
    .append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", "-.55em")
    .attr("transform", "rotate(-90)");

  svg
    .append("g")
    .attr("class", "y axis")
    .call(yAxis)
    .append("text")
    .attr("class", "y label")
    .attr("y", 0)
    .attr("dy", "-1em")
    .attr("dx", "1em")
    .style("text-anchor", "end")
    .text(vis.graphlabel[vis.yselection]);

  svg
    .selectAll("bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .style("fill", function(d, i) {
      return colour(i);
    })
    .on("mouseover", function(d) {
      var xPosition = parseFloat(d3.select(this).attr("x") + x.rangeBand / 2);
      var yPosition = parseFloat(d3.select(this).attr("y")) / 2 + height / 2;

      tooltip.style("left", xPosition + "px").style("top", yPosition + "px");

      tooltip.selectAll("p").remove();

      tooltip
        .append("p")
        .append("strong")
        .text(d.id + " (" + d["Discovery year"] + ")");

      if (vis.yselection == "Surface temperature") {
        tempConverted = parseFloat(d["Surface temperature"] - 272.15).toFixed(
          2
        );
        tooltip
          .append("p")
          .text(
            vis.yselection +
              ": " +
              parseFloat(d[vis.yselection]).toFixed(2) +
              "K, " +
              tempConverted +
              "℃"
          );
      } else {
        tooltip
          .append("p")
          .text(
            vis.yselection +
              ": " +
              parseFloat(d[vis.yselection]).toFixed(2) +
              " " +
              vis.graphlabel[vis.yselection]
          );
      }

      if (d["Declination"]) {
        tooltip.append("p").text("Declination: " + d["Declination"]);
      }

      if (d["Right ascension"]) {
        tooltip.append("p").text("Right ascension: " + d["Right ascension"]);
      }
      d3.select("#tooltip").classed("hidden", false);
    })
    .on("mouseout", function() {
      d3.select("#tooltip").classed("hidden", true);
    })
    .attr("x", function(d) {
      return x(d.id);
    })
    .attr("width", x.rangeBand())
    .attr("y", function(d) {
      return y(d[vis.yselection]);
    })
    .attr("height", function(d) {
      return height - y(d[vis.yselection]);
    });

  var key = function(d) {
    return d.id;
  };

  vis.bar_chart.update = function() {
    var dselection = vis.dselection;
    var yselection = vis.yselection;
    if (dselection.size == 0) {
      console.log("Empty selection, won't update barchart.");
    } else {
      console.log("Updating barchart...");
      var data = [];
      vis.data.forEach(function(d) {
        if (dselection.has(d.id)) {
          data.push(d);
        }
      });

      //recalculate domain
      x.domain(
        data.map(function(d) {
          return d.id;
        })
      );

      //recal margin
      barMargin = vis.bar_chart.barMargin();
      y.domain([
        d3.min(data, function(d) {
          return d[yselection];
        }) - barMargin,
        d3.max(data, function(d) {
          return d[yselection];
        }) + barMargin
      ]);

      //update axis
      svg
        .select(".x.axis")
        .transition()
        .duration(1000)
        .call(xAxis)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", "-.55em")
        .attr("transform", "rotate(-90)");

      svg
        .select(".y.axis")
        .transition()
        .duration(1000)
        .call(yAxis)
        .selectAll("text.y.label")
        .attr("y", 0)
        .attr("dy", "-1em")
        .attr("dx", "1em")
        .style("text-anchor", "end")
        .text(vis.graphlabel[vis.yselection]);

      //update bars
      var bars = svg.selectAll(".bar").data(data, key);

      //exit
      bars
        .exit()
        .transition()
        .duration(500)
        .attr("height", 0)
        .attr("y", height)
        .remove();

      //enter
      bars
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("y", function(d) {
          return y(d[yselection]);
        })
        .attr("x", function(d) {
          return y(d[yselection]);
        })
        .attr("width", x.rangeBand())
        .attr("height", function(d) {
          return height - y(d[yselection]);
        })
        .attr("fill", function(d, i) {
          return colour(i);
        });

      //update
      bars
        .transition()
        .duration(500)
        .attr("x", function(d) {
          return x(d.id);
        })
        .attr("y", function(d) {
          return y(d[yselection]);
        })
        .attr("width", x.rangeBand())
        .attr("height", function(d) {
          return height - y(d[yselection]);
        });
    }
  };

  d3.select("#opts").on("change", function() {
    vis.yselection = d3.select(this).property("value");
    vis.bar_chart.update();
  });
};

//load data & make charts; requies httpd to load csv in chrome
vis.load_data = function() {
  data_url =
    "https://raw.githubusercontent.com/OpenExoplanetCatalogue/oec_tables/master/comma_separated/open_exoplanet_catalogue.txt";

  //data_url = "dataset.csv";

  d3.xhr(data_url)
    .header("Accept", "*/*")
    .get(function(error, response) {
      if (error) throw error;

      var original = response.responseText
        .split("\n")
        .slice(31)
        .join("\n");
      var header =
        "id,Binary flag,Planetary mass,Radius,Period,Semi-major axis,Eccentricity,Periastron,Longitude,Ascending node,Inclination,Surface temperature,Age,Discovery Method,Discovery year,Last updated,Right ascension,Declination,Distance from sun,Host star mass,Host star radius,Host star metallicity,Host star temperature,Host star age,Planet Detection Status List\n";
      var lines = header.concat(original);
      var data = d3.csv.parse(lines, function(d) {
        return {
          id: d["id"],
          "Binary flag": +d["Binary flag"],
          "Planetary mass": +d["Planetary mass"],
          Radius: +d["Radius"],
          Period: +d["Period"],
          "Semi-major axis": +d["Semi-major axis"],
          Eccentricity: +d["Eccentricity"],
          Periastron: +d["Periastron"], //degree
          Longitude: +d["Longitude"],
          "Ascending node": +d["Ascending node"],
          Inclination: +d["Inclination"],
          "Surface temperature": +d["Surface temperature"],
          Age: +d["Age"],
          "Discovery Method": d["Discovery Method"],
          "Discovery year": +d["Discovery year"],
          "Last updated": +d["Last updated"],
          "Right ascension": d["Right ascension"],
          Declination: d["Declination"],
          "Distance from sun": +d["Distance from sun"],
          "Host star mass": +d["Host star mass"],
          "Host star radius": +d["Host star radius"],
          "Host star metallicity": +d["Host star metallicity"],
          "Host star temperature": +d["Host star temperature"],
          "Host star age": +d["Host star age"],
          "Planet Detection Status List": d["Planet Detection Status List"]
        };
      });

      console.log("Loaded " + data.length + " data points from CSV file.");

      vis.graphlabel = {
        //    "Surface temperature": "Temp ℃",
        "Surface temperature": "Temp. K",
        "Planetary mass": "Jupiter masses",
        "Semi-major axis": "Astronomical Units",
        Eccentricity: "",
        Periastron: "Degree",
        Longitude: "Degree",
        Inclination: "Degree",
        Age: "Gya",
        "Distance from sun": "Parsec",
        "Host star mass": "Solar masses",
        "Host star radius": "Solar radii",
        "Host star metallicity": "Log solar",
        "Host star temperature": "K",
        "Host star age": "Gya",
        Radius: "Jupiter radii",
        Period: "Days"
      };

      //unsupplied data
      data.forEach(function(d, i) {
        if (d.id == "Earth") d["Surface temperature"] = 297.15; //25 deg C
      });

      //filter data
      data = data
        .filter(d => d["Surface temperature"] > 240)
        .filter(d => d["Surface temperature"] < 330);

      console.log("Filter returned " + data.length + " data points.");

      //set data & chart
      vis.data = data;
      data.forEach(function(d, i) {
        vis.dselection.add(d.id);
      });
      vis.pc_chart(), vis.bar_chart();
    });
};

try {
  vis.load_data();
} catch (e) {
  console.log(
    "Exception on XMLHttpRequest, likely need to serve directory via a http server."
  );
}
