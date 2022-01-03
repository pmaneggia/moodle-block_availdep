export const init = (content) => {
    setupSvg();
    let simulation = generateSimulation(content);
    display(simulation);
    simulation.on('tick', tick);
    makeDraggable(simulation);
};

/**
 * Make the svg as wide as the parent, height is width * 0.6, center viewBox.
 */
function setupSvg() {
    let svg = document.querySelector('svg');
    let width = svg.parentNode.clientWidth;
    let height = width * 0.6;
    d3.select('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', -width/2 + ' ' + -height/2 + ' ' + width + ' ' + height);
}

function generateSimulation(dependencies) {
    return d3.forceSimulation(nodes(dependencies))
        .force('charge', d3.forceManyBody())
        .force('link', d3.forceLink(edges(dependencies)).id(d => d.id))
        .force('center', d3.forceCenter());
}

// Compute the nodes for d3-force as an array of objects {id: cm_id}
function nodes(dependencies) {
    return Object.keys(dependencies).map(x => {return {id: x}});
}

// Compute the edges (links) for d3-force.
function edges(data) {
    return Object.entries(data).filter(([key, value]) => value !== null)
        .flatMap(([key, value]) => {return value.c.map(x => {return {target: key, source: x.cm + ''}})});
}

function display(simulation) {
    displayNodes(simulation.nodes());
    displayEdges(simulation.force('link').links());
}

function displayNodes(nodes) {
    d3.select('svg').selectAll('circle').data(nodes)
        .enter().append('circle')
        .attr('r', 5)
        .attr('cx', n => n.x)
        .attr('cy', n => n.y);
}

function displayEdges(edges) {
    d3.select('svg').selectAll('line').data(edges)
        .enter().append('line')
        .attr('stroke', 'black')
        .attr('x1', e => e.source.x)
        .attr('y1', e => e.source.y)
        .attr('x2', e => e.target.x)
        .attr('y2', e => e.target.y);
}

function tick() {
    d3.select('svg').selectAll('circle')
        .attr('r', 5)
        .attr('cx', n => n.x)
        .attr('cy', n => n.y);
    d3.select('svg').selectAll('line')
        .attr('stroke', 'black')
        .attr('x1', e => e.source.x)
        .attr('y1', e => e.source.y)
        .attr('x2', e => e.target.x)
        .attr('y2', e => e.target.y);
}

function makeDraggable(simulation) {
    d3.select('svg').selectAll('circle')
        .call(d3.drag().on('drag',
            (event, n) => {
                n.fx = event.x;
                n.fy = event.y;
                simulation.alpha(1).restart();
            }))
}

