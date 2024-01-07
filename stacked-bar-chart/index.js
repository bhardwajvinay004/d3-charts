import data from "./data.json" assert { type: "json" };

const width = 800;
const height = 500;
const margin = {
  left: 70,
  top: 80,
  right: 20,
  bottom: 50,
};
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;
const colors = ["#fc0072", "#71e95e", "#ffd05b", "#4d69fe", "#ef7434"];

let categories;
let groups;
let groupData;
let stackedData;

let chartDiv;
let svg;

let barColors;
let legends;
let tooltip;

let xAxisScale;
let yAxisScale;

function createChart() {
  organizeJsonData();

  createChartSvg();
  createStackedBarColorsScale();
  createLegends();
  createTooltip();

  createXaxisScale();
  createYaxisScale();

  createStackedBarChart();
  createRevenueGrowthLineChart();
  createLineChartDots();
}

function organizeJsonData() {
  categories = d3.keys(data);
  groups = d3
    .keys(data[categories[0]])
    .filter((g) => g.indexOf("Group ") !== -1);
  groupData = categories.map((key) => {
    return {
      quarter: key,
      ...data[key],
    };
  });

  stackedData = d3.stack().keys(groups)(groupData);
}

function createChartSvg() {
  chartDiv = d3.select("#stacked-bar-chart");
  svg = chartDiv
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}

function createStackedBarColorsScale() {
  barColors = d3.scaleOrdinal().domain(groups).range(colors);
}

function createLegends() {
  legends = svg
    .selectAll(".legend")
    .data(groups)
    .enter()
    .append("g")
    .classed("legend", true)
    .attr("transform", "translate(-60,-60)");

  legends
    .append("rect")
    .attr("x", (d, i) => {
      return width / 4 + i * 110;
    })
    .attr("y", 0)
    .attr("width", 18)
    .attr("height", 18)
    .attr("fill", (d, i) => colors[i]);

  legends
    .append("text")
    .attr("x", (d, i) => {
      return 30 + width / 4 + i * 110;
    })
    .attr("y", 12)
    .attr("dy", ".18em")
    .text((d) => d);
}

function createTooltip() {
  tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);
}

function createXaxisScale() {
  xAxisScale = d3
    .scaleBand()
    .domain(categories)
    .range([0, chartWidth])
    .padding([0.6]);

  svg
    .append("g")
    .attr("transform", "translate(0," + chartHeight + ")")
    .call(d3.axisBottom(xAxisScale).tickSize(0).tickPadding(15));
}

function createYaxisScale() {
  yAxisScale = d3
    .scaleLinear()
    .domain([
      0,
      d3.max(groupData, (d) => {
        const tmpObj = { ...d };
        delete tmpObj.quarter;
        delete tmpObj["Revenue Growth"];
        return d3.sum(d3.values(tmpObj));
      }),
    ])
    .range([chartHeight, 0]);

  svg
    .append("g")
    .call(
      d3
        .axisLeft(yAxisScale)
        .tickSize(0)
        .tickPadding(15)
        .tickFormat(d3.format("$.2s"))
    );
}

function createStackedBarChart() {
  svg
    .append("g")
    .selectAll("g")
    .data(stackedData)
    .enter()
    .append("g")
    .attr("fill", (d) => {
      return barColors(d.key);
    })
    .selectAll("rect")
    .data((d) => {
      return d;
    })
    .enter()
    .append("rect")
    .attr("x", (d) => {
      return xAxisScale(d.data.quarter);
    })
    .attr("y", (d) => {
      return yAxisScale(d[1]);
    })
    .attr("height", (d) => {
      return yAxisScale(d[0]) - yAxisScale(d[1]);
    })
    .attr("width", xAxisScale.bandwidth())
    .on("mousemove", (e, d) => onBarMouseMove(e, d))
    .on("mouseout", (e) => onMouseOut(e));
}

function createRevenueGrowthLineChart() {
  svg
    .append("path")
    .datum(groupData)
    .classed("line", true)
    .attr(
      "d",
      d3
        .line()
        .x(function (d) {
          return xAxisScale(d.quarter) + xAxisScale.bandwidth() / 2;
        })
        .y(function (d) {
          return yAxisScale(d["Revenue Growth"]);
        })
    );
}

function createLineChartDots() {
  svg
    .selectAll(".dot")
    .data(groupData)
    .enter()
    .append("circle")
    .classed("dot", true)
    .attr("cx", function (d) {
      return xAxisScale(d.quarter) + xAxisScale.bandwidth() / 2;
    })
    .attr("cy", function (d) {
      return yAxisScale(d["Revenue Growth"]);
    })
    .on("mousemove", (e, d) => onDotMouseMove(e, d))
    .on("mouseout", (e) => onMouseOut(e));
}

function onBarMouseMove(e, d) {
  d3.select(e.target).transition().duration(100).style("opacity", 0.4);

  const f = d3.format("$.2s");
  tooltip.transition().duration(100).style("opacity", 1);
  tooltip
    .html(`${f(d[1] - d[0])}`)
    .style("left", `${e.layerX}px`)
    .style("top", `${e.layerY + 10}px`);
}

function onMouseOut(e) {
  d3.select(e.target).transition().duration(100).style("opacity", 1);

  tooltip.transition().duration(100).style("opacity", 0);
}

function onDotMouseMove(e, d) {
  const f = d3.format("$.2s");
  tooltip.transition().duration(100).style("opacity", 1);
  tooltip
    .html(`${f(d["Revenue Growth"])}`)
    .style("left", `${e.layerX}px`)
    .style("top", `${e.layerY + 10}px`);
}

createChart();
