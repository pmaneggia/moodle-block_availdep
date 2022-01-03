export const init = (content) => {
    let simulation = generateSimulation(content);
    display(simulation);
    simulation.on('tick', tick);
};

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
        .attr('cx', n => n.x * 5 + 100)
        .attr('cy', n => n.y * 5 + 100);
}

function displayEdges(edges) {
    d3.select('svg').selectAll('line').data(edges)
        .enter().append('line')
        .attr('stroke', 'black')
        .attr('x1', e => e.source.x * 5 + 100)
        .attr('y1', e => e.source.y * 5 + 100)
        .attr('x2', e => e.target.x * 5 + 100)
        .attr('y2', e => e.target.y * 5 + 100);   
}

function tick() {
    d3.select('svg').selectAll('circle')
        .attr('r', 5)
        .attr('cx', n => n.x * 5 + 100)
        .attr('cy', n => n.y * 5 + 100);
    d3.select('svg').selectAll('line')
        .attr('stroke', 'black')
        .attr('x1', e => e.source.x * 5 + 100)
        .attr('y1', e => e.source.y * 5 + 100)
        .attr('x2', e => e.target.x * 5 + 100)
        .attr('y2', e => e.target.y * 5 + 100);      
}



