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

require_once('../../config.php');

//$blockid = required_param('blockid', PARAM_INT);
$courseid  = required_param('courseid', PARAM_INT);
$context = context_course::instance($courseid, MUST_EXIST);

$PAGE->set_course($COURSE);
$PAGE->set_url(new moodle_url('/block/availability_dependencies/view.php', ['courseid' => $courseid]));

require_login($courseid);

$PAGE->set_pagelayout('base'); //TODO try also 'standard' and 'course' or 'incourse'
$PAGE->set_title(get_string('pluginname','block_availability_dependencies'));
$PAGE->set_heading('Display completion -> availability dependencies for course ' . $courseid);
$PAGE->navbar->add(get_string('pluginname','block_availability_dependencies'));
//$PAGE->set_pagetype($strpagetype); TODO see if I nee is

echo $OUTPUT->header();
$renderable = new block_availability_dependencies\output\view_page($COURSE);
$renderer = $PAGE->get_renderer('block_availability_dependencies');
echo $renderer->render($renderable);
echo $OUTPUT->footer();