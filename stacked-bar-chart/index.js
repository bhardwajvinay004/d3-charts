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

const categories = d3.keys(data);

const groups = d3
  .keys(data[categories[0]])
  .filter((g) => g.indexOf("Group ") !== -1);

const groupData = categories.map((key) => {
  return {
    quarter: key,
    ...data[key],
  };
});

console.log(categories, groups, groupData);

const tooltip = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

const chartDiv = d3
  .select("#stacked-bar-chart")
  .attr("style", "background-color: #ffffff;");

const svg = chartDiv
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const legends = svg
  .selectAll(".legend")
  .data(groups)
  .enter()
  .append("g")
  .attr("transform", "translate(-60,-70)");

legends
  .append("rect")
  .attr("x", (d, i) => {
    return width / 4 + i * 120;
  })
  .attr("y", 0)
  .attr("width", 18)
  .attr("height", 18)
  .attr("stroke", "black")
  .attr("fill", "#69a3b2");

legends
  .append("text")
  .attr("x", (d, i) => {
    return 30 + width / 4 + i * 120;
  })
  .attr("y", 12)
  .attr("dy", ".18em")
  .text((d) => d);

const xBarChart = d3
  .scaleBand()
  .domain(categories)
  .range([0, chartWidth])
  .padding([0.6]);

svg
  .append("g")
  .attr("transform", "translate(0," + chartHeight + ")")
  .call(d3.axisBottom(xBarChart).tickSize(0).tickPadding(15));

const yBarChart = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(groupData, (d) => {
      const tmpObj = { ...d };
      delete tmpObj.quarter;
      // delete tmpObj["Revenue Growth"];
      return d3.sum(d3.values(tmpObj));
    }),
  ])
  .range([chartHeight, 0]);

svg
  .append("g")
  .call(
    d3
      .axisLeft(yBarChart)
      .tickSize(0)
      .tickPadding(15)
      .tickFormat(d3.format("$.2s"))
  );

const barColors = d3
  .scaleOrdinal()
  .domain(groups)
  .range(["#fc0072", "#71e95e", "#ffd05b", "#4d69fe", "#ef7434"]);

const lineColor = "#3a91bf";

const stackedData = d3.stack().keys(groups)(groupData);

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
    return xBarChart(d.data.quarter);
  })
  .attr("y", (d) => {
    return yBarChart(d[1]);
  })
  .attr("height", (d) => {
    return yBarChart(d[0]) - yBarChart(d[1]);
  })
  .attr("width", xBarChart.bandwidth())
  .on("mouseover", (e, d) => onBarMouseOver(e, d))
  .on("mouseout", () => onMouseOut());

svg
  .append("path")
  .datum(groupData)
  .attr("fill", "none")
  .attr("stroke", lineColor)
  .attr("stroke-width", 2)
  .style("z-index", 999)
  .attr(
    "d",
    d3
      .line()
      .x(function (d) {
        return xBarChart(d.quarter) + xBarChart.bandwidth() / 2;
      })
      .y(function (d) {
        return yBarChart(d["Revenue Growth"]);
      })
  );

svg
  .selectAll(".dot")
  .data(groupData)
  .enter()
  .append("circle")
  .attr("fill", "#ffffff")
  .attr("stroke", "none")
  .style("z-index", 9999)
  .attr("cx", function (d) {
    return xBarChart(d.quarter) + xBarChart.bandwidth() / 2;
  })
  .attr("cy", function (d) {
    return yBarChart(d["Revenue Growth"]);
  })
  .attr("r", 4)
  .on("mouseover", (e, d) => onDotMouseOver(e, d))
  .on("mouseout", () => onMouseOut());

function onBarMouseOver(e, d) {
  tooltip.transition().duration(200).style("opacity", 0.9);
  const f = d3.format("$.2s");
  tooltip.html(`${d["data"]["quarter"]}<br>${f(d[1] - d[0])}`);
}

function onMouseOut() {
  tooltip.transition().duration(300).style("opacity", 0);
}

function onDotMouseOver(e, d) {
  console.log(d);
  tooltip.transition().duration(200).style("opacity", 0.9);
  const f = d3.format("$.2s");
  tooltip.html(`${d["quarter"]}<br>${f(d["Revenue Growth"])}`);
}
