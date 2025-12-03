# Implementation Overview

This implementation completes both required parts and a planning strategy around how I would tackle the optional piece if not limited by time.

## Key Technical Decisions

1. Validation architecture

- Modularity for validation functions based on each node type feeding into an overall workflow validation based on each individual node.
- Helper functions for human readability for things like `isEmpty()` or `isValidUrl()`
- Graph traversal to make sure flows are reachable from the start node + no orphan nodes can exist.
- Addition of structure validation that a start node connected to an end node can not be considered valid.

1. Auto-Save Implementation

- Reference to ISO 8601 timestamp format was put in based on the other note of working with DB timestamps and being able to compare a locally stored workflow to something found on the database in a future iteration. In a production environment with backend persistence, the restore dialog would compare the localStorage timestamp with a server timestamp to detect version conflicts and inform the user if a newer version exists elsewhere. This is a common pattern I've seen in collaborative editing tools and would be worth discussing with product/design.
- Dialog and save status use dayjs and the relativeTime plugin for giving the user a reference to when the save happened.

Bonus conditional autocomplete.

**Technical approach**  
Building a new util function for graph traversal to identify valid, reachable nodes upstream of the conditional node. We have a pattern for the graph traversal in the validation file.

Autocomplete component
Radix-ui does not have a native solution for an autocomplete component but Shadcn which is a component library built on top of Radix-ui does have a Combobox component which is a composition of other components to give the functionality which would be the basis for inspiration of how to work with Radix to achieve the desired outcome.

If we were working on keeping everything as close to Radix-ui as possible I would be making a component that used the TextField component as well as a dropdown style component showing the available results which is still keyboard navigable.
