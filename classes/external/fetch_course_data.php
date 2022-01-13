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
 * External services for block availability dependencies.
 *
 * @package    block_availability_dependencies
 * @copyright  2022 Paola Maneggia
 * @author     Paola Maneggia <paola.maneggia@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace block_availability_dependencies\external;

defined('MOODLE_INTERNAL') || die;

global $CFG;
require_once("$CFG->libdir/externallib.php");

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use external_multiple_structure;

class fetch_course_data extends external_api  {

    /**
     * Returns description of method parameters.
     * @return external_function_parameters
     */
    public static function fetch_course_modules_with_names_and_dependencies_parameters() {
        return new external_function_parameters([
            'courseid'    => new external_value(PARAM_INT, 'course id')
        ]);
    }

    /**
     * Fetch course modules with module names.
     *
     * @param int $courseid
     * @return //json {{id: cm_id_1, name: name_1, dep: {dep_1}, ... }
     */
    public static function fetch_course_modules_with_names_and_dependencies($courseid) {

        $modinfo = get_fast_modinfo($courseid);
        $modules = [];

        foreach ($modinfo->cms as $cm) {
            $module = [];
            $module['id'] = $cm->id;
            $module['name'] = $cm->get_name();
            $module['dep'] = $cm->availability;
            array_push($modules, $module);
        }

        return $modules;
    }

    /**
     * Returns description of method result value.
     * @return external_multiple_structure// external_value
     */
    public static function fetch_course_modules_with_names_and_dependencies_returns() {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'course module id'),
            'name' => new external_value(PARAM_TEXT, 'module name', VALUE_OPTIONAL),
            'dep' => new external_value(PARAM_TEXT, 'availability conditions as json string', VALUE_OPTIONAL)
        ]));
    }
}
