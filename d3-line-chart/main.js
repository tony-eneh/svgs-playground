/**
 * COLORS
 */
const COLORS = {
  withdrawals: '#DF4A40',
  deposits: '#50528B',
  balance: '#5BB92B',
};

/**
 * SIZE DEFINITIONS
 */
const documentWidth = document.documentElement.clientWidth - 20;
const width = documentWidth > 1200 ? 1200 : documentWidth;
const height = (width * 2) / 5;
const radius = 200;
const centerX = width / 2;
const centerY = height / 2;
const margin = {
  top: 100,
  right: 20,
  bottom: 20,
  left: 40,
};

const svg = d3
  .select('.line-chart svg#chart')
  .attr('width', width)
  .attr('height', height)
  .attr('viewBox', `0 0 ${width} ${height}`);

/**
 * DATA
 */

function range(min, max) {
  return Math.random() * (max - min) + min;
}

const STARTING_DATE = new Date('2023-01-01').getTime();

const A_DAY = 24 * 60 * 60 * 1000;

const data = Array(10).fill();

for (let i = 0; i < data.length; i++) {
  data[i] = {
    date: new Date(STARTING_DATE + A_DAY * i),
    withdrawals: range(600_000_000, 1_000_000_000),
    deposits: range(600_000_000, 1_000_000_000),
    balance: range(600_000_000, 1_000_000_000),
  };
}

/**
 * SCALES
 */
const yScale = d3
  .scaleLinear()
  .domain([500_000_000, 1000_000_000])
  .range([height - margin.bottom, margin.top]);

// console.log({extent: d3.extent(data, d => d.x)})
const xScale = d3
  .scaleTime()
  .domain(d3.extent(data, (d) => d.date))
  .nice()
  .range([margin.left, width - margin.right]);

// custom easing function
function customEase(t) {
  return t < 0.6 ? d3.easeCircleIn(t) : d3.easeBackOut.overshoot(3)(t);
}

/**
 * CURVES (THE PATHS)
 */

const gCurves = svg.append('g').classed('curves', true);

const withdrawalsCurve = d3
  .line()
  .curve(d3.curveNatural)
  .x((d) => xScale(d.date))
  .y((d) => yScale(d.withdrawals));

const depositsCurve = d3
  .line()
  .curve(d3.curveNatural)
  .x((d) => xScale(d.date))
  .y((d) => yScale(d.deposits));

const balanceCurve = d3
  .line()
  .curve(d3.curveNatural)
  .x((d) => xScale(d.date))
  .y((d) => yScale(d.balance));

const lineCurvesStart = d3
  .line()
  .curve(d3.curveNatural)
  .x((d) => xScale(d.date))
  .y(200);

gCurves
  .append('path')
  .attr('id', 'withdrawals')
  .attr('d', lineCurvesStart(data))
  .transition()
  .duration(1000)
  .ease(customEase)
  .attr('d', withdrawalsCurve(data))
  .attr('stroke', COLORS.withdrawals)
  .attr('stroke-width', 3)
  .attr('fill', 'none');

gCurves
  .append('path')
  .attr('id', 'deposits')
  .attr('d', lineCurvesStart(data))
  .transition()
  .duration(1000)
  .ease(customEase)
  .attr('d', depositsCurve(data))
  .attr('stroke', COLORS.deposits)
  .attr('stroke-width', 3)
  .attr('fill', 'none');

gCurves
  .append('path')
  .attr('id', 'balance')
  .attr('d', lineCurvesStart(data))
  .transition()
  .duration(1000)
  .ease(customEase)
  .attr('d', balanceCurve(data))
  .attr('stroke', COLORS.balance)
  .attr('stroke-width', 3)
  .attr('fill', 'none');

/**
 * AXES
 */
const xAxis = d3.axisBottom(xScale);

const gXAxis = svg
  .append('g')
  .classed('x-axis', true)
  .attr('transform', 'translate(0, ' + (height - margin.bottom) + ')')
  .call(xAxis);

// hide x axis lines
gXAxis.select('path').attr('stroke', null);
gXAxis.selectAll('.tick line').attr('stroke', null);

const yAxis = d3
  .axisLeft(yScale)
  .ticks(4)
  .tickFormat((value) => {
    const ONE_BILLION = 1_000_000_000;
    const ONE_MILLION = 1_000_000;

    if (value >= ONE_BILLION) return Math.floor(value / ONE_BILLION) + 'B';

    return Math.floor(value / ONE_MILLION) + 'M';
  });

const gYAxis = svg
  .append('g')
  .classed('y-axis', true)
  .attr('transform', `translate(${margin.left}, 0)`)
  .call(yAxis);

// make y axis tick lines span chart width
gYAxis.select('path').attr('stroke', null);
gYAxis.selectAll('.tick line').attr('x2', '100%');

/**
 * ACTIVE DATE (on hover)
 */
const gBars = svg.append('g').classed('bars', true);
const bars = gBars.selectAll('g.bar').data(data).join('g').classed('bar', true);

// set bar widths
const barWidth = (width - margin.right - margin.left) / data.length - 10;

// rect for catching hover events
bars
  .append('rect')
  .attr('x', (d) => xScale(d.date) - barWidth / 2)
  .attr('height', '100%')
  .attr('width', barWidth)
  .attr('opacity', 0);

bars
  .append('line')
  .attr('x1', (d) => xScale(d.date))
  .attr('y1', height - margin.bottom)
  .attr('x2', (d) => xScale(d.date))
  .attr('y2', (d) => yScale(d3.max([d.withdrawals, d.deposits, d.balance])))
  .attr('stroke', '#bbb')
  .attr('stroke-width', 1)
  .attr('stroke-dasharray', '5 5');

['withdrawals', 'deposits', 'balance'].forEach((dataType) =>
  bars
    .append('circle')
    .attr('r', 7)
    .attr('cx', (d) => xScale(d.date))
    .attr('cy', (d) => yScale(d[dataType]))
    .attr('fill', COLORS[dataType])
    .attr('stroke', 'white')
    .attr('stroke-width', 3)
);

/**
 * DETAILS CALLOUT
 */
const callout = bars.append('g').classed('callout', true);

const gTexts = callout
  .append('g')
  .classed('texts', true)
  .attr('fill', 'black')
  .html(
    (d) => `
    <text>${formatTooltipAmount(d.withdrawals)}</text>
    <text y='20'>${formatTooltipAmount(d.deposits)}</text>
    <text y='40'>${formatTooltipAmount(d.balance)}</text>
    <text y='60' font="7" class="date">${d3.timeFormat('%d-%m-%y')(
      d.date
    )}</text>
  `
  );

gTextsBBox = gTexts.node().getBBox();
const pb = 10;
const p = 10;

callout.attr(
  'transform',
  (d, i, nodes) =>
    `translate(${xScale(d.date) - nodes[i].getBBox().width / 2}, ${
      yScale(d3.max([d.withdrawals, d.deposits, d.balance])) -
      gTextsBBox.height -
      2 * pb
    })`
);

const path = callout
  .insert('path', 'g')
  .attr('fill', 'white')
  .attr('filter', 'url(#drop-shadow)')
  .attr('transform', 'translate(0, -10)')
  .attr('d', generateCalloutPath(gTextsBBox.width, gTextsBBox.height));
// .attr('x', gTextsBBox.x - m - p)
// .attr('y', gTextsBBox.y - m - p);

// g.attr('width', pathWidth + 2 * p + 2 * m + 20).attr('height', 80);

svg.append('defs').html(`
<filter id="drop-shadow" x="-5" y="-5" width="${
  gTextsBBox.width + 2 * p + 10
}" height="${gTextsBBox.width + 4 * p + 20}">
    <feGaussianBlur in="SourceAlpha" stdDeviation="10"/> 
    <feOffset dx="0" dy="5"/>
    <feComponentTransfer>
        <feFuncA type="linear" slope="0.2"/>
    </feComponentTransfer>
    <feMerge> 
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/> 
    </feMerge>
</filter>`);

function generateCalloutPath(width, height) {
  return `m${-p} ${0} s${0} ${-p} ${p} ${-p} h${width} s${p} ${0} ${p} ${p} v${height} s${0} ${p} ${-p} ${p} h${
    -width / 2 + pb
  } l${-pb} ${pb} l${-pb} ${-pb} h${-width / 2 + pb} s${-p} ${0} ${-p} ${-p} z`;
}

function formatTooltipAmount(amount) {
  return `CA$ ${amount.toLocaleString()}`;
}
