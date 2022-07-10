# Block Availability Dependencies (`block_availdep`)

Do you need to see a graphical summary of the dependencies between completion and availability of activities in your course? Just add this block to it!

Instead of keeping track of these dependencies, let the block generate a graphical representation in svg format. The resulting graph is generated with the `d3-force` library of `d3.js` (`https://d3js.org/`) and it can be adjusted per drag and drop to a satisfactory layout.

Essentially the generated representation is a directed graph whose nodes are the activities (course modules) labelled with their names.

There is a simplified and a full version of the representation.

In the simplified version an arrow from activity A to activity B is drawn if the availability of B depends in any way from the completion state of activity A, regardless of operators (and, or, not) and nesting.
All other availability conditions are disregarded.
Since the representation is targeted to teachers, all activities are displayed, also the ones that are non visible or hidden but available.

In the full version additional operator nodes between the arrows display the whole information, including nesting and negation.

`d3.js` (`https://d3js.org/`) is packaged as third party component in the plugin itself.

The user can drag and drop the nodes. Nodes that have been moved once will not be affected by the automatic displaying function anymore, but can still be dragged further at any time. A page reload will go back to the original display of the graph.

A block added to a course provides a small preview and two buttons linking to full pages with the two versions of the graphical representation.

__New: Highlight function__: clicking on an activity node highlights the dependencies of that one activity by fading out all the information that is not relevant for its availability. Clicking another time returns to the full view.
#### Similar Plugins

There is a similar plugin in the Moodle plugin directory: [Activitymap](https://moodle.org/plugins/mod_activitymap "mod_activitymap, Moodle plugin directory"). This uses Graphviz to layout the directed graph and has some pros and cons in comparison. Maybe the biggest difference is that block activity_dependencies is of type block instead of type activity and as such it is a much more lightweight plugin. It does not require any backup and restore routine and any database table.

#### Installation
1. Copy the content of this directory into the folder `blocks/availdep` inside your moodle installation.
1. Go to the _Site administration -> Notifications_ to start the install process.

#### Supported Moodle versions
The block supports Moodle 3 (at least from 3.10) and Moodle 4.
* Use branch `master_400` with Moodle 4
* Use branch `master_311` with Moodle 3 (at least from 3.10)

#### License
2022 Paola Maneggia

This program is free software: you can redistribute it and/or modify it under
the terms of the GNU General Public License as published by the Free Software
Foundation, either version 3 of the License, or (at your option) any later
version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY
WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
PARTICULAR PURPOSE.  See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with
this program.  If not, see <https://www.gnu.org/licenses/>.
