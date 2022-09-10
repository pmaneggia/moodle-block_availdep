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
 * Module for functions that manipulate the graph.
 *
 * @copyright  2022 Paola Maneggia
 * @author     Paola Maneggia <paola.maneggia@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @module     block/availdep
 */

/**
 * Given a list of dependencies, remove the isolated nodes
 * and return the remaining list.
 *
 * @param {{id, name, depend, predecessor}[]} dependencies
 * @returns {{id, name, depend, predecessor}[]}
 */
export function removeDisconnectedNodes(dependencies) {
    let notIsolatedNodes = computeNotIsolatedNodes(dependencies);
    return dependencies.filter(n => notIsolatedNodes.has(n.id));
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function computeNotIsolatedNodes(dependencies) {
    let notIsolatedNodes = new Set();
    dependencies.forEach(node => {
        if (hasPredecessor(node)) {
            notIsolatedNodes.add(node.id);
            addAllPredecessors(node, notIsolatedNodes);
        }
    });
    return notIsolatedNodes;
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function hasPredecessor(node) {
    return node.depend && computePredecessors(node).length > 0;
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function computePredecessors(node) {
    return node.depend.c.filter(x => x.type === 'completion');
}

/* eslint-disable-next-line jsdoc/require-jsdoc */
function addAllPredecessors(node, notIsolatedNodes) {
    computePredecessors(node).forEach(x => notIsolatedNodes.add(x.cm === -1 ? x.predecessor : x.cm));
}
