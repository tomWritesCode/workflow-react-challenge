/**
 * AutoComplete Component
 *
 * Radix-ui does not have a native solution for an autocomplete component but Shadcn which
 * is a component library built on top of Radix-ui does have a Combobox component
 * (http://ui.shadcn.com/docs/components/combobox) which is a composition of other components
 * to give the functionality which would be the basis for inspiration of how to work with
 * Radix to achieve the desired outcome.
 *
 * If we were working on keeping everything as close to Radix-ui as possible I would be
 * making a component that used the TextField component as well as the DropdownMenu.
 *
 * This would give us the accessibility must haves with TextField having proper ARIA labels
 * as well as the DropdownMenu component having keyboard support.
 *
 * This component while containing some complexity could be reused and is a valid example
 * of effort to reward for a common use case throughout applications like this.
 */
