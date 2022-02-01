# Block availability_dependencies

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

There is a similar plugin in the Moodle plugin directory: [Activitymap](https://moodle.org/plugins/mod_activitymap "mod_activitymap, Moodle plugin directory"). This uses Graphviz to display the directed graph and has some pros and cons in comparison.