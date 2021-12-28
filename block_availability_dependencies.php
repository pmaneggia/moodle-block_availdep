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

        // If content is cached.
        if ($this->content !== null) {
            return $this->content;
        }

        $course = $this->page->course;
        $context = context_course::instance($course->id);

        $modinfo = get_fast_modinfo($course);
        $cms = $modinfo->get_cms();
        $instances = $modinfo->get_instances();

        // Create empty content.
        $this->content = new stdClass();
        $this->content->text = 'Here we put together our content';
        $this->content->footer = '';

        return $this->content;
    }
}
