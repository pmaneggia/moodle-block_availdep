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
 * Renderable for view.php page of block availdep.
 *
 * @package    block_availdep
 * @copyright  2022 Paola Maneggia
 * @author     Paola Maneggia <paola.maneggia@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace block_availdep\output;

use moodle_url;
use renderable;
use renderer_base;
use templatable;
use stdClass;
/**
 * Renderable for view.php page of block availdep.
 *
 * @package    block_availdep
 * @copyright  2022 Paola Maneggia
 * @author     Paola Maneggia <paola.maneggia@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class view_page implements renderable, templatable {

    /**
     * Courseid of the current course.
     * @var $courseid
     */
    private $courseid;

    /**
     * Parameter indicating if the graphical representation
     * has to be full (value 'yes') or simplified (value 'no').
     * @var $full
     */
    private $full;

    /**
     * Construct a renderable for the page relative to the current course.
     * @param int $courseid id of the current course.
     * @param string $fullparam additional paramenter, value 'yes' for full representation,
     * 'no' for simplified representation.
     */
    public function __construct(int $courseid, string $fullparam) {
        $this->courseid = $courseid;
        $this->full = $fullparam;
    }

    /**
     * Export this data so it can be used as the context for a mustache template.
     * @param renderer_base $output
     * @return stdClass
     */
    public function export_for_template(renderer_base $output) {
        $data = new stdClass();
        $data->toggleurl = (new moodle_url('/blocks/availdep/view.php',
            ['courseid' => $this->courseid, 'full' => ($this->full === 'no' ? 'yes' : 'no')]))->out(false);
        $data->d3src = new moodle_url('/blocks/availdep/thirdparty/d3.min.js');
        return $data;
    }
}
