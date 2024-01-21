/* eslint-disable no-undef */
const width = 500;
const height = 500;
const radius = 200;
const centerX = width / 2;
const centerY = height / 2;

const svg = d3
  .select('body')
  .append('svg')
  .attr('width', width)
  .attr('height', height)
  .attr('viewBox', `0 0 ${width} ${height}`);

let data = [
  {
    name: 'Deposits',
    value: 23_000,
  },
  {
    name: 'Withdrawals',
    value: 114_650,
  },
  {
    name: 'Balance',
    value: 70_248,
  },
];

const total = d3.sum(data, (d) => d.value);
data.forEach((d, i) => {
  d.accumulated = (data[i - 1]?.accumulated || 0) + d.value;
});

// create masks
const masks = svg
  .append('defs')
  .append('g')
  .attr('transform-origin', `${width / 2} ${height / 2}`)
  .attr('transform', `rotate(-90)`)
  .selectAll('mask')
  .data(data)
  .join('mask')
  .attr('id', (d) => `mask-${d.name.toLowerCase()}`)
  .attr('maskUnits', 'userSpaceOnUse');

masks
  .append('rect')
  .attr('width', width)
  .attr('height', height)
  .attr('fill', 'white');
masks
  .append('circle')
  .attr('r', '15')
  .attr('fill', 'black')
  .attr('cx', (d) => getMaskPoint(d).x)
  .attr('cy', (d) => getMaskPoint(d).y);

// the actual paths
svg
  .append('g')
  .attr('transform-origin', `${width / 2} ${height / 2}`)
  .attr('transform', `rotate(-90)`)
  .selectAll('path.arc')
  .data(data)
  .join('path')
  .attr('class', 'arc')
  .attr('stroke-width', 25)
  .attr('stroke', (_, i) => d3.interpolateRainbow(i / data.length))
  .attr('fill', 'none')
  .attr('stroke-linecap', 'round')
  .attr('mask', (d) => `url(#mask-${d.name.toLowerCase()})`)
  .attr('d', (d) => drawArc(d))
  .each(function () {
    const pathLength = this.getTotalLength();
    this.setAttribute('stroke-dasharray', `${pathLength} ${pathLength}`);
    this.setAttribute('stroke-dashoffset', `${pathLength}`);
  })
  .transition()
  .duration(1500)
  .attr('stroke-dashoffset', 0);

//   .transition()

function getMaskPoint(d, angle) {
  angle =
    angle === undefined
      ? ((d.accumulated - d.value) / total) * 2 * Math.PI
      : angle;

  return {
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

function drawArc(d) {
  const startAngle = ((d.accumulated - d.value) / total) * 2 * Math.PI;
  const endAngle = (d.accumulated / total) * 2 * Math.PI;

  console.log(startAngle, endAngle);
  const { x: startX, y: startY } = polarToCartesian(radius, startAngle);

  const { x: endX, y: endY } = polarToCartesian(radius, endAngle);

  return `M${startX},${startY} A${radius},${radius} ${endAngle} ${
    endAngle - startAngle > Math.PI ? 1 : 0
  } 1 ${endX} ${endY}`;
}

function polarToCartesian(radius, angleInRadians) {
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}
