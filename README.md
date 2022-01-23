# Block availability_dependencies

When a teacher develops a course with dependencies completion -> availability between activities, it could be useful to have a graphical representation of these dependencies.

Add this block to a course to display these dependencies graphically.

The generated representation is a graph whose nodes are the activities (course modules) labelled with their names.

An arrow from activity A to activity B is drawn if the availability of B depends in any way from the completion state of activity A. 
All other availability conditions are disregarded.
Since the representation is targeted to teachers, all activities are displayed, also the ones that are non visible or hidden but available.

As tool for laying out the graph we use the `d3-force` library from `d3.js` https://d3js.org/, which is packaged as third party component in the plugin itself.

The user can drag and drop the nodes. Nodes that have been moved once will not be affected by the automatic displaying function anymore, but can still be dragged further at any time. A page reload will display the graph automatically anew.

A block added to a course provides two buttons linking to the graphical representation of the dependencies: a simplified one, where nodes are only activities and arrows express any kind of dependency on the completion of the source, and an exhaustive one including most of the details in the form of trees of logical expressions.