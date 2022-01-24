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

const full = 'no';

export const init = (courseid, full) => {
    full = full;
    var promises = Ajax.call([{
        methodname: 'block_availability_dependencies_fetch_course_modules_with_names_and_dependencies',
        args: {courseid: courseid}
    }
]);

promises[0].fail(ex => console.log(ex))
    .then(dependencies => {
        let dimensions = determineSvgSize();
        setupSvg(dimensions);
        dependencies.forEach(d => {d.depend = JSON.parse(d.depend)});
        let simulation;
        if (full === 'no') {
            simulation = generateSimplifiedSimulation(dependencies, dimensions);
            displaySimplifiedGraph(simulation);
        } else {
            simulation = generateFullSimulation(dependencies);
            displayFullGraph(simulation);
        }
        rememberD3Selections();
        simulation.on('tick', tick);
        makeDraggable(simulation);
    });
};

let nodeColour = '#9BD1E5'; //'#C3E19F';
let textColour = '#364958'; //'#4E5166';
let arrowColour = '#516E84'; //'#989FB0';
let andColour = '#FFB400'; //'#FFB273';
let orColour = '#CEFF1A'; //'#70E1CA';
let otherOperatorColour = '#D1FAFF'; //'#FACED6';

let fullNodeRadius = 50;
let operatorRadius = 20;

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

function addMarker() { // TODO differentiate between simplified and full
    let dev = d3.select('svg.availability_dependencies').append('defs');
    dev.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', "0 0 10 10")
      .attr('refX', 15)
      .attr('refY', 5)
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', 6)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
    .append('path')
      .attr('fill', arrowColour)
      .attr('d', 'M 0 0 L 10 5 L 0 10 z');
    
    dev.append('marker')
      .attr('id', 'arrowToActivity')
      .attr('viewBox', "0 0 10 10")
      .attr('refX', 30)
      .attr('refY', 5)
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', 6)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
    .append('path')
      .attr('fill', arrowColour)
      .attr('d', 'M 0 0 L 10 5 L 0 10 z');

    dev.append('marker')
      .attr('id', 'arrowToOperator')
      .attr('viewBox', "0 0 10 10")
      .attr('refX', 18)
      .attr('refY', 5)
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', 6)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
    .append('path')
      .attr('fill', arrowColour)
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
 * extracted from the dependencies between course modules.
 * The nodes are indexed by the course module id.
 * @param {json} dependencies
 * @returns d3 simulation object
 */
function generateSimplifiedSimulation(dependencies, dimensions) {
    return d3.forceSimulation(dependencies)
        .force('x0', d3.forceX())
        .force('y0', d3.forceY())
        .force('collide', d3.forceCollide().radius(20))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('link', d3.forceLink(computeEdgesSimplifiedDependencies(dependencies)).distance(200).id(d => d.id));
}

/**
 * Generate a simulation, using the nodes and edges (links)
 * extracted from the dependencies between course modules.
 * The activity nodes are indexed by the course module id,
 * the operator nodes are indexed by a generated unique id.
 * @param {json} dependencies
 * @returns d3 simulation object
 */
function generateFullSimulation(dependencies) {
    return d3.forceSimulation(computeEdgesAndNodesFullDependencies(dependencies).nodes)
        .force('x0', d3.forceX())
        .force('y0', d3.forceY())
        .force('collide', d3.forceCollide().radius(fullNodeRadius + 40))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('link', d3.forceLink(computeEdgesAndNodesFullDependencies(dependencies).edges).distance(100).id(d => d.id));
}

/**
 * For a simplified representation, flatten any nesting.
 * @param {} dependencies 
 */
function computeEdgesSimplifiedDependencies(dependencies) {
    // for an array of nested dependencies
    // extract all the cm.id of leaves of type 'completion'
    let leaves = (depend =>
        depend.c.flatMap(d => d.op ? leaves(d) : (d.type === 'completion' ? d.cm : [])));
    return dependencies
        .filter(({id, name, depend, predecessor}) => (depend !== null))
        .map(({id, name, depend, predecessor}) => 
            leaves(depend).map(cm => {return {
                target: id,
                source: cm === -1 ? predecessor : cm,
                name: name
            }}))
        .flat();
}

/**
 * For a full representation, generate a node for each leaf (condition without any further
 * nesting and for each operator. For each completion of an activity there is a flag 'e' which
 * can have value 0, 1, 2 or 3 meaning. Add a done with that flag between the activity and the next
 * node.
 * For a full representation we need nodes for the operators besides the nodes
 * representing the activities. For each node we use a field id and a field name.
 * An activity node has as id its course module id and as name its name.
 * An operator node has as id the number obtained concatenating the ids of the source and target
 * @param {} dependencies 
 */
 function computeEdgesAndNodesFullDependencies(dependencies) {
    let uid = 0;

    function getNextUID() {
        return 'uid_' + uid++;
    }

    function extractActivityNodes(dependencies) {
        return dependencies.map(d => {
            return {
                id: d.id,
                name: d.name,
                genus: 'activity'
            }
        });
    }

    let edges = [];
    let nodes = extractActivityNodes(dependencies);

    // id is the id field of the target node, of genus 'operator' after the first call.
    // genus of the target node ('activity' or 'operator')
    // dependList the list of dependencies that have the above node as target
    // predecessor is the cmid of the activity node for which we are extracting the informations,
    // to be used if in the nesting of dependencies there will be one with {type: 'completion', cm:-1}
    // An edge has the same genus as its target.
    function extractEdgesAndNodes(id, genus, dependList, predecessor) {
        dependList.forEach(el => {
            if (el.op) {
                // generate node
                let newNode = {
                    id: getNextUID(),
                    name: el.op,
                    genus: 'operator'
                };
                nodes.push(newNode);
                // generate edge
                let newEdge = {
                    target: id,
                    source: newNode.id,
                    genus: genus
                };
                edges.push(newEdge);
                //recursive call
                extractEdgesAndNodes(newNode.id, 'operator', el.c, predecessor);
            } else if (el.type === 'completion') {
                // generate edge
                let newEdge = {
                    target: id,
                    source: el.cm === -1 ? predecessor : el.cm,
                    genus: genus
                };
                edges.push(newEdge);
            } else {
                // make edge to node of other dependencies
            }
        })
    }

    dependencies.forEach(a => {if(a.depend !== null) extractEdgesAndNodes(a.id, 'activity', [a.depend], a.predecessor)});

    return {edges, nodes};
}

/**
 * Use d3 to display nodes and edges (links).
 * @param simulation
 */
 function displaySimplifiedGraph(simulation) {
    displaySimplifiedEdges(simulation.force('link').links());
    displaySimplifiedNodesAndLabels(simulation.nodes());
}

/**
 * Use d3 to display nodes and edges (links).
 * @param simulation
 */
 function displayFullGraph(simulation) {
    displayFullEdges(simulation.force('link').links());
    displayFullNodesAndLabels(simulation.nodes());
}

/**
 * Add the graphical elements to display the edges.
 * @param s_edges Edges (links) in the d3 simulation.
 */
 function displaySimplifiedEdges(s_edges) {
    d3.select('svg').append('g').selectAll('line').data(s_edges)
        .enter().append('line')
        .attr('stroke', arrowColour)
        .attr('stroke-width', '3px')
        .attr("stroke-linecap", "round")
        .attr('marker-end', 'url(#arrow)');
}

/**
 * Add the graphical elements to display the edges.
 * @param s_edges Edges (links) in the d3 simulation.
 */
 function displayFullEdges(s_edges) {
    d3.select('svg').append('g').selectAll('line').data(s_edges)
        .enter().append('line')
        .attr('stroke', textColour)
        .attr('stroke-opacity', 0.7)
        .attr('stroke-width', '4px')
        .attr("stroke-linecap", "round")
        .attr('marker-end', e => e.genus === 'activity' ?
            'url(#arrowToActivity' :
            'url(#arrowToOperator');
}

/**
 * Add the graphical elements to display the nodes and labels.
 * @param s_nodes Nodes in the d3 simulation.
 */
 function displaySimplifiedNodesAndLabels(s_nodes) {
    d3.select('svg').append('g').selectAll('circle').data(s_nodes)
        .join('circle')
        .attr('fill', nodeColour)
        .attr('stroke', 'white')
        .attr('r', 10);
    d3.select('svg').append('g').selectAll('text').data(s_nodes)
        .join('text')
        .attr('fill', textColour)
        .attr('font-family', 'sans-serif')
        .attr('font-weight', 'bold')
      .clone().lower()
        .attr('stroke', 'white')
        .attr('stroke-width', 4)
        .attr('stroke-opacity', 0.5);
}

/**
 * Add the graphical elements to display the nodes and labels.
 * @param s_nodes Nodes in the d3 simulation.
 */
 function displayFullNodesAndLabels(s_nodes) {
    d3.select('svg').append('g').selectAll('circle').data(s_nodes)
        .join('circle')
        .attr('fill', n => n.genus === 'activity' ? nodeColour : n.name === '&' ? andColour : n.name === '|' ? orColour : otherOperatorColour)
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .attr('r', n => n.genus === 'activity' ? fullNodeRadius : operatorRadius);
    d3.select('svg').append('g').selectAll('text').data(s_nodes)
        .join('text')
        .attr('fill', textColour)
        .attr('font-family', 'sans-serif')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .attr('dx', -5)
        .attr('dominant-baseline', 'middle')
        .attr('dy', 5);
}

let edges, nodes, labels;

/**
 * Save the graphical representation of edges, nodes and labals.
 */
function rememberD3Selections() {
    edges = d3.select('svg').selectAll('line');
    nodes = d3.select('svg').selectAll('circle');
    labels = d3.select('svg').selectAll('text');
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

