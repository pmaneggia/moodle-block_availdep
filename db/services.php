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
 * Services for block availability dependencies.
 *
 * @package    block_availability_dependencies
 * @copyright  2022 Paola Maneggia
 * @author     Paola Maneggia <paola.maneggia@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$services = array(
    'block_availability_dependencies_service'   => array( 
        'functions' => array (
            'block_availability_dependencies_fetch_course_modules_with_names_and_dependencies',
        ),
        'restrictedusers'   => 0,
        'enabled'           => 1,
        'shortname'         => 'block_availability_dependencies_service',
        'downloadfiles'     => 0,
        'uploadfiles'       => 0
    )
);

$functions = array(
    'block_availability_dependencies_fetch_course_modules_with_names_and_dependencies' => array(
        'classname'     => 'block_availability_dependencies\external\fetch_course_data',
        'methodname'    => 'fetch_course_modules_with_names_and_dependencies',
        'classpath'     => 'blocks/availability_dependencies/classes/external/fetch_course_data.php',
        'description'   => 'Retrieve course modules with ids and names.',
        'type'          => 'read',
        'ajax'          => true,
        'loginrequired' => false
    )
);