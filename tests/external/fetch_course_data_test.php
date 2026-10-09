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

namespace block_availdep\external;

/**
 * Tests for the external function fetch_course_data of block_availdep.
 *
 * @package    block_availdep
 * @category   test
 * @copyright  2026 Paola Maneggia
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers     \block_availdep\external\fetch_course_data
 */
final class fetch_course_data_test extends \advanced_testcase {

    /**
     * Json of a completion condition.
     *
     * @return string
     */
    private function completion(): string {
        return '{"type":"completion","cm":1,"e":1}';
    }

    /**
     * Json of a date condition, which has to be removed.
     *
     * @return string
     */
    private function date(): string {
        return '{"type":"date","d":">=","t":1700000000}';
    }

    /**
     * Json of a profile condition, which has to be removed.
     *
     * @return string
     */
    private function profile(): string {
        return '{"type":"profile","op":"isequalto","cf":"email","v":"secret@example.com"}';
    }

    /**
     * Build the json of a root group.
     *
     * @param string $op operator of the group
     * @param string[] $children json strings of the children
     * @return string
     */
    private function group(string $op, array $children): string {
        $show = in_array($op, ['&', '!|']) ? '"show":true' : '"showc":' . json_encode(array_fill(0, count($children), true));
        return '{"op":"' . $op . '",' . $show . ',"c":[' . implode(',', $children) . ']}';
    }

    /**
     * Empty or invalid availability gives no dependencies.
     */
    public function test_reduce_empty_and_invalid(): void {
        $this->assertNull(fetch_course_data::reduce_availability(null));
        $this->assertNull(fetch_course_data::reduce_availability(''));
        $this->assertNull(fetch_course_data::reduce_availability('not json'));
        $this->assertNull(fetch_course_data::reduce_availability('[]'));
    }

    /**
     * Data provider for the reduction.
     *
     * @return array
     */
    public static function reduce_provider(): array {
        $c = '{"type":"completion","cm":1,"e":1}';
        $d = '{"type":"date","d":">=","t":1700000000}';
        $p = '{"type":"profile","op":"isequalto","cf":"email","v":"secret@example.com"}';
        $g = '{"type":"grade","id":5,"min":80}';
        return [
            'and keeps completion' => [
                '{"op":"&","show":true,"c":[' . $c . ',' . $d . ']}',
                '{"op":"&","show":true,"c":[' . $c . ']}',
            ],
            'not-or keeps negated completion' => [
                '{"op":"!|","show":true,"c":[' . $c . ',' . $p . ']}',
                '{"op":"!|","show":true,"c":[' . $c . ']}',
            ],
            'or with other condition is dropped' => [
                '{"op":"|","showc":[true,true],"c":[' . $c . ',' . $d . ']}',
                null,
            ],
            'not-and with other condition is dropped' => [
                '{"op":"!&","showc":[true,true],"c":[' . $c . ',' . $g . ']}',
                null,
            ],
            'or with only completion is kept' => [
                '{"op":"|","showc":[true,true],"c":[' . $c . ',' . $c . ']}',
                '{"op":"|","showc":[true,true],"c":[' . $c . ',' . $c . ']}',
            ],
            'only other conditions' => [
                '{"op":"&","show":true,"c":[' . $d . ',' . $p . ']}',
                null,
            ],
            'nested or is dropped, outer and kept' => [
                '{"op":"&","show":true,"c":[' . $c . ',{"op":"|","c":[' . $c . ',' . $d . ']}]}',
                '{"op":"&","show":true,"c":[' . $c . ']}',
            ],
            'nested and is reduced' => [
                '{"op":"&","show":true,"c":[{"op":"&","c":[' . $c . ',' . $d . ']},' . $g . ']}',
                '{"op":"&","show":true,"c":[{"op":"&","c":[' . $c . ']}]}',
            ],
            'nested group without completion disappears in and' => [
                '{"op":"&","show":true,"c":[' . $c . ',{"op":"&","c":[' . $d . ']}]}',
                '{"op":"&","show":true,"c":[' . $c . ']}',
            ],
            'nested dropped group drops outer or' => [
                '{"op":"|","showc":[true,true],"c":[' . $c . ',{"op":"&","c":[' . $d . ']}]}',
                null,
            ],
            'malformed group' => [
                '{"op":"&","show":true,"c":"x"}',
                null,
            ],
        ];
    }

    /**
     * Test the reduction to completion conditions.
     *
     * @dataProvider reduce_provider
     * @param string $availability input json
     * @param string|null $expected expected json or null
     */
    public function test_reduce_availability(string $availability, ?string $expected): void {
        $result = fetch_course_data::reduce_availability($availability);
        if ($expected === null) {
            $this->assertNull($result);
        } else {
            $this->assertJsonStringEqualsJsonString($expected, $result);
        }
    }

    /**
     * Reduced output never contains values of other conditions.
     */
    public function test_reduce_does_not_leak(): void {
        $json = $this->group('&', [$this->completion(), $this->profile(), $this->date()]);
        $result = fetch_course_data::reduce_availability($json);
        $this->assertStringNotContainsString('secret@example.com', $result);
        $this->assertStringNotContainsString('1700000000', $result);
    }

    /**
     * Create a course with a page whose availability mixes completion and date conditions.
     *
     * @return array course, id of the restricted cm
     */
    private function create_course_with_restriction(): array {
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $page1 = $generator->create_module('page', ['course' => $course->id, 'completion' => COMPLETION_TRACKING_MANUAL]);
        $availability = json_encode(\core_availability\tree::get_root_json([
            \availability_completion\condition::get_json($page1->cmid, COMPLETION_COMPLETE),
            \availability_date\condition::get_json(\availability_date\condition::DIRECTION_FROM, 1700000000),
        ], \core_availability\tree::OP_AND));
        $page2 = $generator->create_module('page', ['course' => $course->id, 'availability' => $availability]);
        return [$course, $page2->cmid];
    }

    /**
     * Users without the capability are rejected.
     */
    public function test_student_is_rejected(): void {
        $this->resetAfterTest();
        [$course] = $this->create_course_with_restriction();
        $student = $this->getDataGenerator()->create_and_enrol($course, 'student');
        $this->setUser($student);
        $this->expectException(\required_capability_exception::class);
        fetch_course_data::fetch_course_modules_with_names_and_dependencies($course->id);
    }

    /**
     * Teachers get the reduced availability.
     */
    public function test_teacher_gets_reduced_data(): void {
        $this->resetAfterTest();
        [$course, $cmid] = $this->create_course_with_restriction();
        $teacher = $this->getDataGenerator()->create_and_enrol($course, 'editingteacher');
        $this->setUser($teacher);
        $result = fetch_course_data::fetch_course_modules_with_names_and_dependencies($course->id);
        $this->assertArrayHasKey($cmid, $result);
        $this->assertStringContainsString('"completion"', $result[$cmid]['depend']);
        $this->assertStringNotContainsString('"date"', $result[$cmid]['depend']);
    }
}
