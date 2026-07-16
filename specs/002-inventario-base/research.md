# Research: Inventario base - productos y registro de movimientos de stock

## Decision 1: Use the existing Angular standalone + Ionic feature layout
- Decision: Build the inventory feature as a new feature area under `src/app/features/`, reusing the current standalone component pattern and the existing Angular/Ionic application shell.
- Rationale: The repository already uses Angular 20 standalone components, Ionic 8, and feature-scoped folders. Reusing that structure keeps the feature consistent with the rest of FiApp and avoids introducing module-based or parallel app architecture.
- Alternatives considered: Creating a separate inventory app shell or introducing NgModules. Both were rejected because they would break the current codebase conventions and constitution.

## Decision 2: Keep SQLite as the source of persisted inventory data
- Decision: Model the inventory using the same local SQLite persistence pattern already used for clients and transactions.
- Rationale: FiApp is offline-first and already depends on `@capacitor-community/sqlite`. Using the same persistence layer preserves consistency, reduces integration risk, and allows inventory data to work across web fallback and native builds.
- Alternatives considered: In-memory storage and a remote-only backend. In-memory storage would lose data between sessions; remote-only storage would violate the offline-first direction and add unnecessary availability risk.

## Decision 3: Derive stock exclusively from the movement log
- Decision: Treat the movement log as the only source of truth for inventory quantity and cost calculations.
- Rationale: This aligns with the constitution and the clarified requirements. It avoids drift between a mutable stock field and historical operations, makes audits simpler, and keeps stock calculations deterministic.
- Alternatives considered: Storing a mutable stock field or maintaining a stock cache/projection. Both were rejected because they introduce duplication and consistency risks.

## Decision 4: Store weighable quantities in grams and display them in kilograms
- Decision: Persist `PESO` quantities as integer grams with 1-gram precision, while rendering values to users in kilograms.
- Rationale: Integer grams avoid precision drift in repeated inventory updates and simplify arithmetic for movements, especially when computing deltas and low-stock thresholds.
- Alternatives considered: Decimal kilograms as the stored unit. That approach was rejected because repeated arithmetic on decimal quantities can accumulate rounding issues.

## Decision 5: Block outbound movements that would drive stock negative
- Decision: Reject `VENTA` and `MERMA` movements that exceed the current derived stock.
- Rationale: Inventory should never go below zero in normal operation. Blocking invalid outbound movements prevents silent corruption and keeps the derived stock meaningful.
- Alternatives considered: Allow negative stock and reconcile later. That was rejected because it complicates every consumer of the inventory state and obscures operational errors.

## Decision 6: Represent AJUSTE as a computed correction from physical count
- Decision: Capture the counted physical quantity as input, compare it to the derived stock, and store the resulting delta as an AJUSTE movement along with audit metadata.
- Rationale: This makes counts auditable and preserves the reason for the correction while keeping the movement log the canonical record.
- Alternatives considered: Overwriting stock directly from the count. That was rejected because it breaks the immutable ledger model and makes audit trails weaker.

## Decision 7: Allow nullable actor identity without implementing users now
- Decision: Reserve an optional nullable `actor_id` field on movements for future identity tracking, but do not implement users or roles in this feature.
- Rationale: This preserves a path for future auditability without expanding the current scope into authentication or authorization work.
- Alternatives considered: Adding full user management now. That was rejected as out of scope and unnecessary for the inventory MVP.

## Decision 8: Exclude product transformation/desposte from this version
- Decision: Do not model transformation flows that split one product into sub-products.
- Rationale: Transformation introduces a separate manufacturing-style domain that would expand scope, data modeling, and test surface significantly.
- Alternatives considered: Implementing transformation alongside inventory. That was rejected to preserve a focused first release.
