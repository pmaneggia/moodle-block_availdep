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
 * @package    block_availability_dependencies
 * @copyright  2022 Paola Maneggia
 * @author     Paola Maneggia <paola.maneggia@gmail.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace block_availability_dependencies\output;                                                                                                         
                                                                                                                                    
use renderable;                                                                                                                     
use renderer_base;                                                                                                                  
use templatable;                                                                                                                    
use stdClass; 

//require_once("{$CFG->libdir}/modinfolib.php");
class view_page implements renderable, templatable {
    var $course = null;

    public function __construct($course) {                                                                                        
        $this->course = $course;                                                                                                
    }

    /**                                                                                                                             
     * Export this data so it can be used as the context for a mustache template.                                                   
     *                                                                                                                              
     * @return stdClass                                                                                                             
     */                                                                                                                             
    public function export_for_template(renderer_base $output) {                                                                    
        $data = new stdClass(); 
        $data->d3src = '/blocks/availability_dependencies/thirdparty/d3.min.js';
        $data->dependencies = $this->get_dependencies();                                                                                                    
        return $data;                                                                                                               
    }

    /**
     * Read the completion -> availability dependencies between activities.
     * @return string representing a json array of key value pairs
     * module_id: availability as in the table {course_modules}
     */
    public function get_dependencies() {
        $modinfo = get_fast_modinfo($this->course);
        $dependencies = [];

        foreach ($modinfo->cms as $cm) {
            $dependencies[$cm->id] = json_decode($cm->availability);
        }

        return json_encode($dependencies);
    }
}