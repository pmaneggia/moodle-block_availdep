<?php
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
 * External function to fetch the course data for block_availdep.
 *
 * @package    block_availdep
 * @copyright  2022 Paola Maneggia
 * @author     Paola Maneggia <paola.maneggia@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace block_availdep\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_value;
use core_external\external_single_structure;
use core_external\external_multiple_structure;

/**
 * External function to fetch the course data for block_availdep.
 *
 * @package    block_availdep
 * @copyright  2022 Paola Maneggia
 * @author     Paola Maneggia <paola.maneggia@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class fetch_course_data extends external_api {
    /**
     * Returns description of method parameters.
     * @return external_function_parameters
     */
    public static function fetch_course_modules_with_names_and_dependencies_parameters() {
        return new external_function_parameters([
            'courseid'    => new external_value(PARAM_INT, 'course id'),
        ]);
    }

    /**
     * Fetch course modules with module names.
     *
     * @param int $courseid
     * @return //json {{id: cm_id_1, name: name_1, dep: {dep_1}, ... }
     */
    public static function fetch_course_modules_with_names_and_dependencies($courseid) {
        // Security checks.
        $params = self::validate_parameters(
            self::fetch_course_modules_with_names_and_dependencies_parameters(),
            ['courseid' => $courseid]
        );
        $courseid = $params['courseid'];
        $context = \context_course::instance($courseid);
        self::validate_context($context);

        // Activity names and availability conditions may reveal hidden settings.
        require_capability('block/availdep:view', $context);

        $modinfo = get_fast_modinfo($courseid);
        $predecessors = self::compute_predecessors($modinfo);
        // Issue #5 Support activity deletion:
        // We drop all cms that have the deletioninprogress flag set.
        $cmsnotdeletioninprogress = array_filter(
            $modinfo->cms,
            function ($cm) {
                return !$cm->deletioninprogress;
            }
        );
        return array_map(
            function ($cm) use ($predecessors) {
                return [
                    'id' => $cm->id,
                    'name' => $cm->get_name(),
                    'depend' => self::reduce_availability($cm->availability),
                    'predecessor' => $predecessors[$cm->id],
                ];
            },
            $cmsnotdeletioninprogress
        );
    }

    /**
     * Reduce an availability json string to its completion conditions.
     *
     * Conditions of other types are dropped, so that no hidden settings are disclosed.
     * In groups where all children must hold ("&" and "!|") a dropped child is
     * treated as fulfilled and simply removed. In groups where one child is enough
     * ("|" and "!&") a dropped child makes the whole group undecidable,
     * so the group is dropped as well.
     *
     * @param string|null $availability availability conditions as json string.
     * @return string|null reduced availability as json string or null if nothing is left.
     */
    public static function reduce_availability(?string $availability): ?string {
        if (empty($availability)) {
            return null;
        }
        $tree = json_decode($availability);
        if (!($tree instanceof \stdClass)) {
            return null;
        }
        $reduced = self::reduce_availability_node($tree);
        return $reduced === null ? null : json_encode($reduced);
    }

    /**
     * Reduce a single availability node (group or condition), see {@see reduce_availability()}.
     *
     * @param \stdClass $node availability node.
     * @return \stdClass|null reduced node or null if the node has to be dropped.
     */
    private static function reduce_availability_node(\stdClass $node): ?\stdClass {
        if (!isset($node->c)) {
            return (($node->type ?? '') === 'completion') ? $node : null;
        }
        if (!is_array($node->c) || !isset($node->op)) {
            return null;
        }

        $anyoneenough = in_array($node->op, ['|', '!&'], true);
        $children = [];
        foreach ($node->c as $child) {
            $reduced = ($child instanceof \stdClass) ? self::reduce_availability_node($child) : null;
            if ($reduced !== null) {
                $children[] = $reduced;
            } else if ($anyoneenough) {
                return null;
            }
        }
        if (empty($children)) {
            return null;
        }
        $node->c = $children;
        return $node;
    }

    /**
     * Compute the previous activity with completion
     * for every activity in the course.
     * @param course_modinfo $modinfo module information for course.
     * @return associative array assigning to each cmid the
     * cmid of its predecessor with completion.
     * The first activity has an invalid predecessor with id 0.
     */
    private static function compute_predecessors($modinfo): array {
        $predecessors = [];
        $lastcmid = 0;
        foreach ($modinfo->cms as $cm) {
            if ($cm->deletioninprogress) {
                continue;
            }
            $predecessors[$cm->id] = $lastcmid;
            if ($cm->completion != COMPLETION_TRACKING_NONE) {
                $lastcmid = $cm->id;
            }
        }
        return $predecessors;
    }

    /**
     * Returns description of method result value.
     * @return external_multiple_structure// external_value
     */
    public static function fetch_course_modules_with_names_and_dependencies_returns() {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'course module id'),
            'name' => new external_value(PARAM_TEXT, 'module name', VALUE_OPTIONAL),
            'depend' => new external_value(PARAM_TEXT, 'availability conditions as json string', VALUE_OPTIONAL),
            'predecessor' => new external_value(PARAM_INT, 'previous course module with completion'),
        ]));
    }
}
