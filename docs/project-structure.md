# Project Structure

Directory layout conventions for the konflux-ui source tree. Use this guide when deciding where to place new files.

## File Organization

| Category                                  | Location                                 | Example                                     |
| ----------------------------------------- | ---------------------------------------- | ------------------------------------------- |
| K8s model definitions                     | `src/models/`                            | `pod.ts`                                    |
| Shared React components                   | `src/shared/components/<ComponentName>/` | with barrel `index.ts`                      |
| Shared hooks                              | `src/shared/hooks/`                      | `useEventListener.ts`                       |
| Shared utilities (generic/infrastructure) | `src/shared/utils/`                      | `json-utils.ts`                             |
| Cross-feature domain utilities            | `src/utils/`                             | `pipeline-utils.ts`, `text-filter-utils.ts` |
| App-level data hooks                      | `src/hooks/`                             | `useApplications.ts`                        |
| Feature-specific code                     | `src/components/<Feature>/`              | co-located with its UI                      |
| Constants                                 | `src/consts/`                            | `security.ts`                               |

New utility functions used by more than one feature domain go in `src/shared/utils/` (generic infrastructure — DOM helpers, JSON processing, error handling) or `src/utils/` (domain-specific — pipeline, component, release logic). When in doubt, prefer `src/utils/`. New K8s model definitions must go in `src/models/`.
