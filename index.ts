import axios from "axios";
import * as d3 from "d3";
import { format as formatDate } from 'date-fns';
import './index.scss';

const PLOT_DATA_PATH: string = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/cyclist-data.json";
const CHART_WIDTH: number = 1024;
const CHART_HEIGHT: number = 600;
const CHART_PADDING: number = 55;

document.addEventListener("DOMContentLoaded", function(): void {
  initPlot();
});

async function initPlot(): Promise<void> {
  let data: any = await getPlotData();
  let dataset = parseServerPlotData(data);
  createScatterPlot(dataset);
}

async function getPlotData(): Promise<any> {
  let response;

  try {
    response = await axios.get(PLOT_DATA_PATH);
  } catch (error) {
    console.error(error);
  }

  if (response && response.data) {
    return response.data;
  } else {
    console.error(new Error('no data in response'));
  }
}

function parseServerPlotData(data) {
  return data.map((dataItem) => ({
      year: new Date(dataItem.Year, 0, 1),
      time: new Date(dataItem.Seconds * 1000),
      doping: dataItem.Doping,
      name: dataItem.Name,
      nationality: dataItem.Nationality,
      place: dataItem.Place,
      url: dataItem.URL,
    })
  );
}

function createScales(dataset) {
  let xScale = d3
    .scaleTime()
    .domain([
      d3.min(dataset, (d) => d.year),
      d3.max(dataset, (d) => d.year),
    ])
    .range([CHART_PADDING, CHART_WIDTH - CHART_PADDING]);
  let yScale = d3
    .scaleTime()
    .domain([
      d3.max(dataset, (d) => d.time),
      d3.min(dataset, (d) => d.time),
    ])
    .range([CHART_HEIGHT - CHART_PADDING, CHART_PADDING]);

  return {
    xScale,
    yScale,
  };
}

function createAxes(svg, {xScale, yScale}) {
  let xAxis = d3.axisBottom(xScale);
  let yAxis = d3
    .axisLeft(yScale)
    .ticks(d3.timeSecond.filter((d) => d.getSeconds() % 15 === 0))
    .tickFormat(d3.timeFormat('%M:%S'));

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0)
    .attr("x", 0 - (CHART_HEIGHT / 2))
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Time in minutes");
  svg.append("text")
    .attr("y", CHART_HEIGHT)
    .attr("x", CHART_WIDTH / 2)
    .attr("dy", "-1em")
    .style("text-anchor", "middle")
    .text("Years");

  svg
    .append('g')
    .attr('id', 'x-axis')
    .attr('transform', `translate(0, ${CHART_HEIGHT - CHART_PADDING})`)
    .call(xAxis);
  svg
    .append('g')
    .attr('id', 'y-axis')
    .attr('transform', `translate(${CHART_PADDING}, 0)`)
    .call(yAxis);

  return {
    xAxis,
    yAxis,
  }
}

function createScatterPlot(dataset) {
  let svg = d3
    .select('#plot-scatter')
    .append('svg')
    .attr('width', CHART_WIDTH)
    .attr('height', CHART_HEIGHT);

  let scales = createScales(dataset);
  createAxes(svg, scales);

  let dotsD3 = svg
    .selectAll('circle')
    .data(dataset)
    .enter()
    .append('circle')
    .attr('cx', (d) => scales.xScale(d.year))
    .attr('cy', (d) => scales.yScale(d.time))
    .attr('r', 5)
    .attr('data-xvalue', (d) => d.year)
    .attr('data-yvalue', (d) => d.time);
  dotsD3.each(function(d) {
    this.classList.add('dot');
    if (d.doping) this.classList.add('dot_background_red');
  });

  let tooltip: HTMLElement = document.getElementById('tooltip');
  let tooltipPerson: HTMLElement = tooltip.querySelector('.plot-tooltip__person');
  let tooltipRaceInfo: HTMLElement = tooltip.querySelector('.plot-tooltip__race-info');
  let tooltipDoping: HTMLElement = tooltip.querySelector('.plot-tooltip__doping');

  dotsD3.on('mouseenter', ({year, time, name, nationality, doping}) => {
    tooltip.classList.add('tooltip_visibility_visible');
    tooltip.style.left = `${scales.xScale(year) / (CHART_WIDTH / 100)}%`;
    tooltip.style.top = `${scales.yScale(time) / (CHART_HEIGHT / 100)}%`;
    tooltip.dataset.year = year;
    tooltipPerson.textContent = `${name}: ${nationality}`;
    tooltipRaceInfo.textContent = `Year: ${year.getFullYear()}, Time: ${formatDate(time, 'MM:SS')}`;
    tooltipDoping.textContent = doping;
  });
  dotsD3.on('mouseleave', () => {
    tooltip.classList.remove('tooltip_visibility_visible');
    tooltip.style.left = null;
    tooltip.style.top = null;
    delete tooltip.dataset.dataYear;
    tooltipPerson.textContent = null;
    tooltipRaceInfo.textContent = null;
    tooltipDoping.textContent = null;
  });

  return svg;
}
