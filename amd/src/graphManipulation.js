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

/* eslint-disable jsdoc/require-jsdoc */
/* eslint-disable require-jsdoc */

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

function hasPredecessor(node) {
    return node.depend && computePredecessors(node).length > 0;
}

function computePredecessors(node) {
    return node.depend.c.filter(x => x.type === 'completion');
}

function addAllPredecessors(node, notIsolatedNodes) {
    computePredecessors(node).forEach(x => notIsolatedNodes.add(x.cm === -1 ? x.predecessor : x.cm));
}

/* eslint-enable jsdoc/require-jsdoc */
/* eslint-enable require-jsdoc */

/**
 * Fix dangling references to missing course modules.
 *
 * @param {{id, name, depend, predecessor}[]} dependencies is modified by this function:
 * Dangling references are replaced by -2 and if any is found a "missing" node with id -2 is added.
 * @param {string} missingString lang string for a missing course module
 */
 export function fixDanglingReferences(dependencies, missingString) {
    const ids = dependencies.map(x => x.id).concat([-1]);
    let danglingReferenceFound = false;
    dependencies.forEach(
        node => {
            if (node.depend) {
                let found = handleDanglingReferencesInNode(node.depend, ids);
                danglingReferenceFound ||= found;
            }
        }
    );
    if (danglingReferenceFound) {
        dependencies.push({id: -2, name: missingString, depend: null, predecessor: null});
    }
}

/**
 * Recursively fix dangling references in depend expression.
 * @param {object} depend objects expressing the conditions for the availability of this node, is modified by the function call
 * @param {int[]} ids the list of valid ids
 * @return {boolean} was a dangling reference found and replaced
 */
function handleDanglingReferencesInNode(depend, ids) {
    if (depend.op) {
        let danglingReferenceFound = false;
        depend.c.forEach(
            d => {
                let found = handleDanglingReferencesInNode(d, ids);
                danglingReferenceFound ||= found;
            }
        );
        return danglingReferenceFound;
    } else {
        if (depend.type === 'completion' && !ids.includes(depend.cm)) {
            depend.cm = -2;
            return true;
        } else {
            return false;
        }
    }
}
