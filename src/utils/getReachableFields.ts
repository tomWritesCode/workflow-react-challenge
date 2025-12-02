/**
 * Utility function for field name autocomplete in Conditional nodes.
 *
 * Building a new util function for graph traversal to identify valid, reachable nodes
 * upstream of the conditional node. We have a pattern for the graph traversal in the
 * validation file.
 * This ensures users only see field names that would actually be available
 * at runtime when the Conditional node evaluates.
 */
