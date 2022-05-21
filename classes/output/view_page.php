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
 * Renderable for view.php page of block availability dependencies.
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
class view_page implements renderable, templatable {

    private $courseid;
    private $full;

    public function __construct(int $courseid, string $full) {
        $this->courseid = $courseid;
        $this->full = $full;
    }

    /**
     * Export this data so it can be used as the context for a mustache template.
     * @return stdClass
     */
    public function export_for_template(renderer_base $output) {
        $data = new stdClass();
        $data->toggleurl = (new moodle_url('/blocks/availdep/view.php', ['courseid' => $this->courseid, 'full' => ($this->full === 'no' ? 'yes' : 'no')]))->out(false);
        $data->d3src = '/blocks/availdep/thirdparty/d3.min.js';
        return $data;
    }
}
