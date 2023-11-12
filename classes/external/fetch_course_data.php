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

defined('MOODLE_INTERNAL') || die;

global $CFG;
require_once("$CFG->libdir/externallib.php");

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use external_multiple_structure;
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
        $context = \context_course::instance($courseid);
        self::validate_context($context);
        require_login($courseid);

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
                    'depend' => $cm->availability,
                    'predecessor' => $predecessors[$cm->id],
                ];
            }, $cmsnotdeletioninprogress);
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
