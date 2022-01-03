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
 * Block to display completion -> availability dependencies between
 * activities in a course.
 *
 * @package    block_availability_dependencies
 * @copyright  2022 Paola Maneggia
 * @author     Paola Maneggia <paola.maneggia@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once("{$CFG->libdir}/modinfolib.php");

/**
 * Block to display completion -> availability dependencies between
 * activities in a course.
 */
class block_availability_dependencies extends block_base {

    public function init() {
        $this->title = get_string('pluginname', 'block_availability_dependencies');
    }

    public function applicable_formats() {
        return array('course' => true);
    }

    public function get_content() {
        global $OUTPUT, $CFG;
        // global $PAGE; // TODO try $this->page instead
        // $PAGE->requires->js_call_amd('block_availability_dependencies/test','init', array($this->get_dependencies()));

        // If content is cached.
        if ($this->content !== null) {
            return $this->content;
        }

        $data = new stdClass();
        $data->d3src = '/blocks/availability_dependencies/thirdparty/d3.min.js';
        $data->dependencies = $this->get_dependencies();

        // Create empty content.
        $this->content = new stdClass();
        $this->content->text = $OUTPUT->render_from_template('block_availability_dependencies/dependencies', $data);;
        $this->content->footer = '';

        return $this->content;
    }

    /**
     * Read the completion -> availability dependencies between activities.
     * @return string representing a json array of key value pairs
     * module_id: availability as in the table {course_modules}
     */
    public function get_dependencies() {
        $course = $this->page->course; // or global $COURSE

        $modinfo = get_fast_modinfo($course);
        $dependencies = [];

        foreach ($modinfo->cms as $cm) {
            $dependencies[$cm->id] = json_decode($cm->availability);
        }

        return json_encode($dependencies);
    }
}
