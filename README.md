# Repro: tsgo 7.0.2 API server reports TS2345 that batch mode and tsc 6.0.3 do not report

A standalone, minimal project. The API server of `@typescript/native` (typescript) 7.0.2
reports TS2345 for a call that the tsgo CLI accepts in batch mode and that classic
`typescript` 6.0.3 accepts. Whether the server reports it differs between fresh server
processes. Within one process, the answer never changes between queries.

## Versions

- `@typescript/native` 7.0.2 (installed as `npm:typescript@7.0.2`; tsgo, darwin-arm64)
- `typescript6` 6.0.3 (installed as `npm:typescript@^6.0.3`; the classic compiler, for comparison)
- `sigma` 3.0.3, `@sigma/utils` 3.0.0, `graphology` 0.26.0, `graphology-types` 0.24.8
- node v24.21.0, macOS 26.5.1, arm64

## Steps to reproduce

```
npm install
npm run probe        # 25 fresh node processes by default; each starts one tsgo API server
npm run batch        # 25 runs of the tsgo CLI in batch mode by default
```

Give a count as the first argument: `npm run probe -- 40`.

`probe.mjs` spawns N fresh node processes. Each process builds one API
(`new API({ cwd })`, `updateSnapshot`, one `getSemanticDiagnostics()` query),
prints the result, and exits. The runner prints the count of processes that
report TS2345.

## Expected result

The server and the CLI agree: no diagnostics for this project.
`tsc -p tsconfig.app.json` (tsgo 7.0.2) and `typescript6/bin/tsc -p tsconfig.app.json`
(classic 6.0.3) both exit 0 with no output.

## Actual result

- Probe: 209 of 210 fresh processes reported TS2345 on
  `src/widgets/graph-canvas/canvas-setup.ts`, at the `fitViewportToNodes(renderer, [])`
  call (measured over runs of 25, 25, 20, 20, 20, 20, 40, and 60 processes; the worst
  run was 19 of 20).
- Batch: 0 of 30 runs reported anything (plus one batch run of 5 after each reduction
  step; all clean).
- Classic tsc 6.0.3: no errors.
- Within one process, five rounds of the same query gave the same answer each time.

The error:

```
error TS2345: Argument of type 'GraphRenderer' is not assignable to parameter of
type 'Sigma<Attributes, Attributes, Attributes>'.
  The types returned by 'getSettings()' are incompatible between these types.
    Type 'Settings<NodeAttributes, EdgeAttributes, Attributes>' is not assignable to
    type 'Settings<Attributes, Attributes, Attributes>'.
      Type 'Attributes' is missing the following properties from type
      'NodeAttributes': x, y, size, label
```

## What the trigger is

The project has two source files.

1. `src/widgets/graph-canvas/canvas-setup.ts` holds the call that fails,
   `fitViewportToNodes(renderer, [])`, with `renderer: GraphRenderer` and
   `GraphRenderer = Sigma<NodeAttributes, EdgeAttributes>`. It also holds a typed
   constant, `const emptyDrawer: NodeHoverDrawingFunction<NodeAttributes, EdgeAttributes>`,
   which the settings object references.
2. `src/widgets/graph-canvas/graph-canvas.ts` consumes the first file through one call,
   `useSigma({ view, setup: (view) => canvasSetup(() => ({ selection: view() })), onMount })`,
   where `onMount` carries the prop type `(renderer: GraphRenderer) => () => void`.

Each part is necessary. The reduction showed:

- One file does not flip: with the caller merged into `canvas-setup.ts`, 0 of 20
  processes flipped. The project needs the second file.
- Without the `view` callback chain (`setup: (view) => canvasSetup(() => ({ selection: view() }))`),
  0 of 20 flipped.
- Without `onMount` in the `useSigma` call, 0 of 20 flipped. `onMount: undefined` as a
  literal flipped weakly (1 of 20).
- Without the typed `emptyDrawer` constant, the call is genuinely ill-typed: batch mode
  and classic tsc 6.0.3 then also report TS2345. With it, batch mode and classic tsc
  accept the call, and only the API server reports it. The constant changes the outcome
  of the assignability check in the CLI, but not in the server.

The sources do not import `react` or `graphology`. The packages stay in
`package.json` because this project mirrors the app; sigma's own type declarations
import `graphology-types`.

## The other packages

- `typescript6` (`npm:typescript@^6.0.3`) is there only to compare the result with the classic compiler.
- `graphology` and `graphology-types` stay, because `sigma` needs `graphology` as a peer dependency and its type declarations import `graphology-types`.

## A sigma-free control

A source that does not import sigma does not flip: 0 of 20 processes. The bug needs
the type graph of `sigma` and `@sigma/utils`.
