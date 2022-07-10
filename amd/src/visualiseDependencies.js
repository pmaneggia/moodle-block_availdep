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
 * @module     block/availdep
 */

/* global d3 */
/* eslint-disable no-nested-ternary */

import Ajax from 'core/ajax';

let full = 'no';

export const init = (courseid, fullparam) => {
    full = fullparam;
    var promises = Ajax.call([{
        methodname: 'block_availdep_fetch_course_modules_with_names_and_dependencies',
        args: {courseid: courseid}
    }
]);

/* eslint-disable promise/always-return */
promises[0]
    .then(dependencies => {
        let dimensions = determineSvgSize();
        setupSvg(dimensions);
        dependencies.forEach(d => {
            d.depend = JSON.parse(d.depend);
        });
        let simulation;
        if (full === 'no') {
            simulation = generateSimplifiedSimulation(dependencies);
            displaySimplifiedGraph(simulation);
        } else {
            simulation = generateFullSimulation(dependencies);
            displayFullGraph(simulation);
        }
        rememberD3Selections();
        storeAncestorEdgesAndNodesInAllNodes(edges);
        simulation.on('tick', tick);
        makeDraggable(simulation);
        makeDoubleClickable(simulation);
    }).catch();
};
/* eslint-enable promise/always-return */

let toggleHighlight = 0;

let nodeColour = '#AEDAEA';
let textColour = '#364958';
let arrowColour = '#516E84';
let andColour = '#FFB400';
let orColour = '#CEFF1A';
let notAndColour = '#F9CFF2';
let notOrColour = '#D1FAFF';
let otherOperatorColour = '#D1FAFF';
let notColour = '#EA7B5D';

let fullNodeRadius = 50;
let operatorRadius = 20;

let arrowWidth = 2;

let svgWidth;

/**
 * Set width, height and viewBox of the svg element of class 'availdep'.
 * @param {Object} dimensions
 * @param {number} dimensions.width
 * @param {number} dimensions.height
 */
function setupSvg(dimensions) {
    d3.select('svg.availdep')
        .attr('width', dimensions.width)
        .attr('height', dimensions.height)
        .attr('viewBox', -dimensions.width / 2 + ' ' + -dimensions.height / 2
            + ' ' + dimensions.width + ' ' + dimensions.height);
    addMarker();
    addFilterDropShadow();
}

/**
 * Add marker elements to display arrows.
 */
function addMarker() {
    let dev = d3.select('g.availdep').append('defs');
    dev.append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', "0 0 10 10")
      .attr('refX', 23)
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
      .attr('refX', 52)
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
      .attr('refX', 27)
      .attr('refY', 5)
      .attr('markerUnits', 'strokeWidth')
      .attr('markerWidth', 6)
      .attr('markerHeight', 8)
      .attr('orient', 'auto')
    .append('path')
      .attr('fill', arrowColour)
      .attr('d', 'M 0 0 L 10 5 L 0 10 z');
}

/**
 * Add feDropShadow to improve contrast.
 */
function addFilterDropShadow() {
    let dev = d3.select('g.availdep defs');
    dev.append('filter')
      .attr('id', 'textShadow')
    .append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 0)
      .attr('stdDeviation', 2)
      .attr('flood-color', 'white')
      .attr('flood-opacity', 1);
}

/**
 * Compute the width and height for the svg of class 'availdep'
 * element reading the ones of the parent.
 * @returns {{width: number, height: number}}
 */
function determineSvgSize() {
    let svg = document.querySelector('svg.availdep');
    let width = svg.parentNode.clientWidth;
    let orientation = screen.orientation?.type;
    let height = orientation === "portrait-primary" ? width * 1.3 : width * 0.6;
    svgWidth = width;
    return {width, height};
}

/**
 * Generate a simulation, using the nodes and edges (links)
 * extracted from the dependencies between course modules.
 * The nodes are indexed by the course module id.
 * @param {{id, name, depend, predecessor}[]} dependencies
 * @returns {Object} d3 simulation object
 */
function generateSimplifiedSimulation(dependencies) {
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
 * @param {{id, name, depend, predecessor}[]} dependencies
 * @returns {Object} d3 simulation object
 */
function generateFullSimulation(dependencies) {
    let {edges, nodes} = computeEdgesAndNodesFullDependencies(dependencies);
    return d3.forceSimulation(nodes)
        .force('x0', d3.forceX())
        .force('y0', d3.forceY())
        .force('isSource', d3.forceX(-svgWidth / 3).strength(n => n.isSource))
        .force('isTarget', d3.forceX(svgWidth / 3).strength(n => n.isTarget))
        .force('collide', d3.forceCollide(100).radius(n => (n.genus === 'activity' ? fullNodeRadius : operatorRadius) + 30))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('link', d3.forceLink(edges).distance(50).id(d => d.id));
}

/**
 * For a simplified representation, flatten any nesting.
 * @param {{id, name, depend, predecessor}[]} dependencies
 * @return {Object[]}
 */
function computeEdgesSimplifiedDependencies(dependencies) {
    // For an array of nested dependencies
    // extract all the cm.id of leaves of type 'completion'
    let leaves = (depend => // TODO fix small bug here d.op && !d.type
        depend.c.flatMap(d => d.op ? leaves(d) : (d.type === 'completion' ? d.cm : [])));
    return dependencies
        .filter(({depend}) => (depend !== null))
        .map(({id, name, depend, predecessor}) =>
            leaves(depend).map(cm => {
                return {
                    target: id,
                    source: cm === -1 ? predecessor : cm,
                    name: name
                };
            }))
        .flat();
}

/**
 * For a full representation we need nodes for the operators besides the nodes
 * representing the activities. For each node we use fields id, name, genus (activity or operator),
 * isSource and isTarget (the last two are for the layout - sort of extenden fuzzy logic,
 * they are a quantity instead of a boolean).
 * An activity node has as id its course module id and as name its name.
 * An operator node has as id the a uniquely generated id.
 *
 * For each completion of an activity there is a flag 'e' which
 * can have value 0, 1, 2 or 3 (meaning: activity (0) should not be completed; (1) must be completed;
 * (2) must be completed an passed; (3) must be completed and failed).
 * TODO Add a node with that flag between the activity and the previous node.
 * @param {{id, name, depend, predecessor}[]} dependencies
 * @return {{edges: Object[], nodes: Object[]}}
 */
function computeEdgesAndNodesFullDependencies(dependencies) {

    let onlyNonCompletionConditionsIn = function(dependList) {
        return dependList.filter(c => (c.type && c.type == 'completion' || (!c.type && c.op))).length === 0;
    };

    let uid = 0;

    let getNextUID = function() {
        return 'uid_' + uid++;
    };

    let extractActivityNodes = function(dependencies) {
        return dependencies.map(d => {
            return {
                id: d.id,
                name: d.name,
                genus: 'activity',
                isSource: 0,
                isTarget: 0,
            };
        });
    };

    let edges = [];
    let nodes = extractActivityNodes(dependencies);

    // 'id' is the id field of the target node, of genus 'operator' after the first call.
    // toGenus: genus of the target node ('activity' or 'operator')
    // dependList the list of dependencies that have the node with id id as target
    // predecessor is the cmid of the activity node for which we are extracting the information,
    // to be used if in the nesting of dependencies there will be one with {type: 'completion', cm:-1}
    // An edge has the same genus as its target.
    let extractEdgesAndNodes = function(id, toGenus, dependList, predecessor) {
        dependList.forEach(el => {
            if (!el.type && el.op && !onlyNonCompletionConditionsIn(el.c)) {
                // Generate node
                let newNode = {
                    id: getNextUID(),
                    name: el.op,
                    genus: 'operator',
                    isTarget: 0.1,
                    isSource: 0.1
                };
                nodes.push(newNode);
                // Generate edge
                let newEdge = {
                    target: id,
                    source: newNode.id,
                    toGenus: toGenus
                };
                edges.push(newEdge);
                // Recursive call
                extractEdgesAndNodes(newNode.id, 'operator', el.c, predecessor);
            } else if (el.type === 'completion' && el.e > 0) {
                // Generate edge
                let newEdge = {
                    target: id,
                    source: el.cm === -1 ? predecessor : el.cm,
                    toGenus: toGenus
                };
                // Increase isSource of the source node to a max of 1.5
                let sn = nodes.find(n => n.id === newEdge.source);
                sn.isSource = (sn.isSource + 0.6 > 1.5 ? 1.5 : sn.isSource + 0.6);
                edges.push(newEdge);
            } else if (el.type === 'completion' && el.e === 0) {
                // Connect with two edges a 'not' node in between
                let newNode = {
                    id: getNextUID(),
                    name: 'not',
                    genus: 'operator',
                    isTarget: 0.1,
                    isSource: 0.1
                };
                let newEdgeFromNot = {
                    target: id,
                    source: newNode.id,
                    toGenus: toGenus
                };
                let newEdgeToNot = {
                    target: newNode.id,
                    source: el.cm === -1 ? predecessor : el.cm,
                    toGenus: 'operator'
                };
                nodes.push(newNode);
                edges.push(newEdgeFromNot);
                edges.push(newEdgeToNot);
                // Increase isSource of the source node to a max of 1.5
                let sn = nodes.find(n => n.id === newEdgeToNot.source);
                sn.isSource = (sn.isSource + 0.6 > 1.5 ? 1.5 : sn.isSource + 0.6);
            }
        });
    };

    dependencies.forEach(a => {
        if (a.depend !== null) {
            // If an activity has some availability conditions, set the value for isTarget in its node.
            // For the moment I am not checking if the conditions are of the wrong type
            nodes.find(n => n.id === a.id).isTarget = 0.9;
            extractEdgesAndNodes(a.id, 'activity', [a.depend], a.predecessor);
        }
    });

    return {edges, nodes};
}

/**
 * Use d3 to display nodes and edges (links).
 * @param {Object} simulation - d3 simulation object
 */
function displaySimplifiedGraph(simulation) {
    displaySimplifiedEdges(simulation.force('link').links());
    displaySimplifiedNodesAndLabels(simulation.nodes());
}

/**
 * Add the graphical elements to display the edges.
 * @param {Object[]} sEdges - Edges (links) in the d3 simulation.
 */
 function displaySimplifiedEdges(sEdges) {
    d3.select('g.availdep').append('g').selectAll('line').data(sEdges)
        .enter().append('line')
        .attr('stroke', arrowColour)
        .attr('stroke-width', arrowWidth + 'px')
        .attr("stroke-linecap", "round")
        .attr('marker-end', 'url(#arrow)');
}

/**
 * Use d3 to display nodes and edges (links).
 * @param {Object} simulation - d3 simulation object
 */
 function displayFullGraph(simulation) {
    displayFullEdges(simulation.force('link').links());
    displayFullNodesAndLabels(simulation.nodes());
}

/**
 * Add the graphical elements to display the edges.
 * @param {Object[]} sEdges - Edges (links) in the d3 simulation.
 */
function displayFullEdges(sEdges) {
    d3.select('g.availdep').append('g').selectAll('line').data(sEdges)
        .enter().append('line')
        .attr('stroke', textColour)
        .attr('stroke-opacity', 0.7)
        .attr('stroke-width', arrowWidth + 'px')
        .attr("stroke-linecap", "round")
        .attr('marker-end', e => e.toGenus === 'activity' ?
            'url(#arrowToActivity' :
            'url(#arrowToOperator');
}

/**
 * Add the graphical elements to display the nodes and labels.
 * @param {Object[]} sNodes - Nodes in the d3 simulation.
 */
 function displaySimplifiedNodesAndLabels(sNodes) {
    d3.select('g.availdep').append('g').selectAll('circle').data(sNodes)
        .join('circle')
        .attr('fill', nodeColour)
        .attr('stroke', 'white')
        .attr('r', 16);
    d3.select('g.availdep').append('g').selectAll('text').data(sNodes)
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
 * @param {Object[]} sNodes - Nodes in the d3 simulation.
 */
 function displayFullNodesAndLabels(sNodes) {
    d3.select('g.availdep').append('g').selectAll('circle').data(sNodes)
        .join('circle')
        .attr('fill', n => n.genus === 'activity' ? nodeColour
            : n.name === '&' ? andColour
            : n.name === '|' ? orColour
            : n.name === '!&' ? notAndColour
            : n.name === '!|' ? notOrColour
            : n.name === 'not' ? notColour
            : otherOperatorColour)
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .attr('r', n => n.genus === 'activity' ? fullNodeRadius : operatorRadius);
    d3.select('g.availdep').append('g').selectAll('text').data(sNodes)
        .join('text')
        .attr('fill', textColour)
        .attr('font-family', 'sans-serif')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'middle')
        .attr('dx', -5)
        .attr('dominant-baseline', 'middle')
        .attr('dy', 5)
        .attr('filter', 'url(#textShadow)');
}

let edges, nodes, labels;

/**
 * Save the graphical representation of edges, nodes and labals.
 */
function rememberD3Selections() {
    edges = d3.select('g.availdep').selectAll('line');
    nodes = d3.select('g.availdep').selectAll('circle');
    labels = d3.select('g.availdep').selectAll('text');
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
 * @param {Object} simulation - d3 simulation object
 */
function makeDraggable(simulation) {
    nodes
        .call(d3.drag()
        .on('start', (event, n) => {
            if (!event.active) {
                simulation.alphaTarget(0.3).restart();
            }
            n.fx = event.x;
            n.fy = event.y;
        })
        .on('drag',
            (event, n) => {
                n.fx = event.x;
                n.fy = event.y;
            })
        .on('end', (event) => {
            if (!event.active) {
                simulation.alphaTarget(0);
            }
        })
        );
}

/**
 * Add callback for click event to each node.
 */
function makeDoubleClickable() {
    nodes.on('click', highlightDependencies);
}

/**
 * Stores ancestors of each node as an additional property.
 * We need this for the highlight function.
 * @param {Object[]} allEdges
 * @returns {Object[]}
 */
function storeAncestorEdgesAndNodesInAllNodes(allEdges) {
    return nodes.data().forEach(n => computeAndStoreAncestorEdgesAndNodes(n, allEdges));
}

/**
 * Compute the ancestor edges and nodes for a given node and stores then in an
 * additional property 'ancestors' of the node.
 * Even if it would be logically absurd to build a cycle in the directed graph of dependencies,
 * there is no guarantee that this does not happen. Moreover a cycle per se does not mean that
 * some activites are unreachable, since they can be negated.
 * @param {Object} node a d3 (circle) node from a simulation
 * @param {Object[]} allEdges
 */
function computeAndStoreAncestorEdgesAndNodes(node, allEdges) {
    let aNodes = new Set();
    let aEdges = new Set();
    let toBeExaminedNodes = [node];
    while (toBeExaminedNodes.length) {
        // Each time one element of the queue of nodes to be examined is moved to the set aNodes
        let currentNode = toBeExaminedNodes.shift();
        aNodes.add(currentNode);
        // Iterate over the edges and look for the ones that have the current node as target
        allEdges.data().forEach(ed => {
            if (ed.target.id === currentNode.id) {
                aEdges.add(ed);
                if (!aNodes.has(ed.source)) {
                    toBeExaminedNodes.push(ed.source);
                }
            }
        });
    }
    node.ancestors = [...aNodes].concat([...aEdges]);
}

/**
 * Check if an edge is ancestor of node
 * @param {*} edgeOrNode the edge or node to check
 * @param {*} node
 * @return {Object[]} the list of ancestor nodes
 */
function isAncestor(edgeOrNode, node) {
    return node.ancestors.includes(edgeOrNode);
}

/**
 * Toggle highlight function. The opacity of all nodes that are not
 * ancestory of a given node is reduced or set back to normal.
 */
function highlightDependencies() {
    if (toggleHighlight === 0) {
        // Reduce the opacity of all but the ancestor nodes
        let d = d3.select(this).data()[0];
        nodes.style("opacity", function(o) {
            return isAncestor(o, d) ? 1 : 0.1;
        });
        edges.style("opacity", function(o) {
            return isAncestor(o, d) ? 1 : 0.1;
        });
        // Mark hightlighting as on
        toggleHighlight = 1;
    } else {
        // Put opacity back to 1 for all nodes and links
        nodes.style("opacity", 1);
        edges.style("opacity", 1);
        // Mark highlighting as off
        toggleHighlight = 0;
    }
}

/* eslint-enable no-nested-ternary */
