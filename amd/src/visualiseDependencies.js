// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Visualise dependencies.
 *
 * @copyright  2022 Paola Maneggia, Mathias Kegelmann
 * @author     Paola Maneggia <paola.maneggia@gmail.com>, Mathias Kegelmann <mathias.kegelmann@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @module     block/availability_dependencies
 */

import Ajax from 'core/ajax';

export const init = (params) => {
    var promises = Ajax.call([{
        methodname: 'block_availability_dependencies_fetch_course_modules_with_names_and_dependencies',
        args: {courseid: params}
    }]);

    promises[0].fail(ex => console.log(ex))
        .then(dependencies => {
            let dimensions = determineSvgSize();
            setupSvg(dimensions);
            dependencies.forEach(d => {d.dep = JSON.parse(d.dep)});
            let simulation = generateSimulation(dependencies);
            displayGraph(simulation);
            rememberD3Selections();
            simulation.on('tick', tick);
            makeDraggable(simulation);
        });
};

/**
 * Make the svg as wide as the parent, height is width * 0.6, center viewBox.
 */
function setupSvg(dimensions) {
    d3.select('svg.availability_dependencies')
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)
        .attr('viewBox', -dimensions.width/2 + ' ' + -dimensions.height/2
            + ' ' + dimensions.width + ' ' + dimensions.height);
    addMarker();
}

function addMarker() {
    d3.select('svg.availability_dependencies').select('g').append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', "0 0 10 10")
      .attr('refX', 13.5)
      .attr('refY', 5)
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', 6)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
    .append('path')
      .attr('fill', 'lightgray')
      .attr('d', 'M 0 0 L 10 5 L 0 10 z');
}

function determineSvgSize() {
    let svg = document.querySelector('svg.availability_dependencies');
    let width = svg.parentNode.clientWidth;
    let height = width * 0.6;
    return {width, height};
}

/**
 * Generate a simulation, using the nodes and edges (links)
 * extracted from json string representing the dependencies between course modules.
 * The nodes are indexed by the course module id.
 * @param {json} dependencies
 * @returns d3 simulation object
 */
function generateSimulation(dependencies) {
    return d3.forceSimulation(dependencies)
        .force('x0', d3.forceX())
        .force('y0', d3.forceY())
        .force('charge', d3.forceManyBody().strength(-300))
        .force('link', d3.forceLink(computeEdges(dependencies)).distance(80).id(d => d.id));
}

/**
 * Compute the edges (links) for d3-force
 * as an array of objects {source: cm_id, target: cm_id}.
 * 1) filter out all elements with no dependencies;
 * 2) filter out all dependencies that are not type: completion
 * 3) for each remaining produce an edge with source and target, collecting also the operator.
 * 4) the operator is changed to 'negLit' if the literal is negated i.e. dep.c.e is 0 (activity must not be completed) 
 */ 
function computeEdges(dependencies) {
    return dependencies.filter(({id, name, dep}) => (dep !== null))
        .flatMap(({id, name, dep}) => {
            return dep.c.filter(x => x.type == 'completion').map(x => {return {target: id, source: x.cm, op: x.e ? dep.op : 'negLit'}})
        });
}

/**
 * Use d3 to display nodes and edges (links).
 * @param simulation
 */
function displayGraph(simulation) {
    displayEdges(simulation.force('link').links());
    displayNodesAndLabels(simulation.nodes());
}

/**
 * Add the graphical elements to display the edges.
 * The stroke-dasharray distingushes between the operator:
 * '&' (solid) - '|' dotted and all other cases dashdotted.
 * @param s_edges Edges (links) in the d3 simulation.
 */
function displayEdges(s_edges) {
    d3.select('svg').select('g').append('g').selectAll('line').data(s_edges)
        .enter().append('line')
        .attr('stroke', 'lightgray')
        .attr('stroke-width', '2px')
        .attr("stroke-linecap", "round")
        .attr('stroke-dasharray', x => (x.op == '&' ? '0 0' : (x.op == '|' ? '1 4' : '9 4 1 4')))
        .attr('marker-end', 'url(#arrow)');
}

/**
 * Add the graphical elements to display the nodes and labels.
 * @param s_nodes Nodes in the d3 simulation.
 */
function displayNodesAndLabels(s_nodes) {
    d3.select('svg').select('g').append('g').selectAll('circle').data(s_nodes)
        .join('circle')
        .attr('fill', '#00a8d5')
        .attr('stroke', 'white')
        .attr('r', 5);
    d3.select('svg').select('g').append('g').selectAll('text').data(s_nodes)
        .join('text')
        .attr('fill', 'darkgray')
        .attr('font-family', 'sans-serif')
        .attr('font-weight', 'bold')
        .attr('font-size', 'small')
      .clone().lower()
        .attr('stroke', 'white')
        .attr('stroke-width', 4)
        .attr('stroke-opacity', 0.5);
}

let edges, nodes, labels;

/**
 * Save the graphical representation of edges, nodes and labals.
 */
function rememberD3Selections() {
    edges = d3.select('svg g').selectAll('line');
    nodes = d3.select('svg g').selectAll('circle');
    labels = d3.select('svg g').selectAll('text');
}

/**
 * Update the simulation.
 */
function tick() {
    nodes
        .attr('cx', n => n.x)
        .attr('cy', n => n.y);
    edges
        .attr('x1', e => e.source.x)
        .attr('y1', e => e.source.y)
        .attr('x2', e => e.target.x)
        .attr('y2', e => e.target.y);
    labels
        .attr('x', n => n.x + 5)
        .attr('y', n => n.y - 5)
        .text(n => n.name);

}

/**
 * Make nodes draggable.
 * Once dragged a node is fixed to its assigned position in the simulation.
 * @param simulation
 */
function makeDraggable(simulation) {
    nodes
        .call(d3.drag()
        .on('start', (event, n) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            n.fx = event.x;
            n.fy = event.y;
        })
        .on('drag',
            (event, n) => {
                n.fx = event.x;
                n.fy = event.y;
            })
        .on('end', (event) => {if (!event.active) simulation.alphaTarget(0);})
        );
}

