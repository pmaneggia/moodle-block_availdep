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

/**
 * Generate a simulation, using the nodes and edges (links)
 * extracted from json string representing the dependencies between course modules.
 * The nodes are indexed by the course module id.
 * @param {*} dependencies
 * @returns 
 */
function generateSimulation(dependencies) {
    return d3.forceSimulation(nodes(dependencies))
        .force('charge', d3.forceManyBody())
        .force('link', d3.forceLink(edges(dependencies)).id(d => d.id))
        .force('center', d3.forceCenter());
}

/**
 * Compute the nodes for d3-force as an array of objects {id: cm_id}
 * @param {*} dependencies
 * @returns 
 */
function nodes(dependencies) {
    return Object.keys(dependencies).map(x => {return {id: x}});
}

/**
 * Compute the edges (links) for d3-force
 * as an array of objects {source: cm_id, target: cm_id}.
 */ 
function edges(data) {
    return Object.entries(data).filter(([key, value]) => value !== null)
        .flatMap(([key, value]) => {return value.c.map(x => {return {target: key, source: x.cm + ''}})});
}

/**
 * Use d3 to display nodes and edges (links).
 * @param {*} simulation 
 */
function display(simulation) {
    displayEdges(simulation.force('link').links());
    displayNodes(simulation.nodes());
}

function displayEdges(edges) {
    d3.select('svg').selectAll('line').data(edges)
        .enter().append('line')
        .attr('stroke', 'lightgray')
        .attr('x1', e => e.source.x)
        .attr('y1', e => e.source.y)
        .attr('x2', e => e.target.x)
        .attr('y2', e => e.target.y);
}

function displayNodes(nodes) {
    d3.select('svg').selectAll('circle').data(nodes)
        .enter().append('circle')
        .attr('fill', '#00a8d5')
        .attr('stroke', 'lightgray')
        .attr('r', 5)
        .attr('cx', n => n.x)
        .attr('cy', n => n.y);
}

/**
 * Update the simulation.
 */
function tick() {
    d3.select('svg').selectAll('circle')
        .attr('cx', n => n.x)
        .attr('cy', n => n.y);
    d3.select('svg').selectAll('line')
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

