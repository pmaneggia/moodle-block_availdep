# Block availability_dependencies

When a teacher develops a course with dependencies completion -> availability between activities, it could be useful to have a graphical representation of these dependencies.

Add this block to a course to display these dependencies graphically.

The generated representation is a graph whose nodes are the activities (course modules) labelled with their names.

An arrow from activity A to activity B is drawn if there is an availability condition on B that depends on the completion of activity A. All other availability conditions will be disregarded.

We use three type of arrows: solid, dotted and dashdotted with the following meaning:

`A ---> C <--- B` (solid arrows) means: C is available when A **and** B have been completed (no distinction between completed and completed with or without having passed).

`A ....> C >.... B` (dotted arrows) means: C is available when A **or** B have been completed (no distinction between completed and completed with or without having passed).

`A -.-> C <-.- B` (dashdotted arrows) means: C is available when the *and* or *or* operator are negated (participant must not have completed A *and* B or partecipant must not have completed either of A **or** B).

Moodle allows also to express that activity C is available when activity A has not been completed. In this case we use the dashdotted arrow `A -.-> C` as well.

The dashdotted arrow is therefore used to indicate any other case that is different from the basic ones which use a (non negated) and (participant musst have completed all of the activities) or or (participant must have completed at least one of the activities) conjunction.

This simplification is done to make the graphical representation more compact and readable while retaining a lot of information.

Displaying such a graph is not an easy task.  Therefore we use the `d3-force` library from `d3.js` https://d3js.org/, which is packaged as third party component in the plugin itself.

The user can drag and drop the nodes. Nodes that have been moved once will not be affected by the automatic displaying function anymore, but can still be dragged further at any time. A page reload will display the graph automatically anew.

A block added to a course produces a small graphical representation of the dependencies and a button linking to a larger page view of the graph.

Features still to be implemented:

* Include a download to pdf function
* Customise colours and arrow styles via settings
