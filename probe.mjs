// Runs N fresh node processes; each asks the tsgo API for semantic diagnostics once.
// Prints the count of processes that report TS2345.
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const runs = Number(process.argv[2] ?? process.env.PROBE_RUNS ?? 25)
const config = process.argv[3] ?? 'tsconfig.app.json'

let wrong = 0
let crashed = 0
for (let run = 1; run <= runs; run++) {
  const out = spawnSync(process.execPath, [path.join(here, 'worker.mjs'), config], { cwd: here, encoding: 'utf8' })
  let parsed
  try {
    parsed = JSON.parse(out.stdout.trim().split('\n').at(-1))
  } catch {
    parsed = { ok: false, reason: (out.stderr || out.stdout || 'no output').slice(0, 200) }
  }
  if (!parsed.ok) {
    crashed++
    console.log(`${run}: CRASH ${parsed.reason}`)
    continue
  }
  const ts2345 = parsed.errors.filter((e) => e.code === 2345)
  if (ts2345.length > 0) {
    wrong++
    console.log(`${run}: TS2345 ${ts2345[0].text}`)
  } else if (parsed.errors.length > 0) {
    console.log(`${run}: other ${parsed.errors.map((e) => `TS${e.code}`).join(',')}`)
  } else {
    console.log(`${run}: clean`)
  }
}
console.log(`\n${runs} processes: ${wrong} with TS2345, ${runs - wrong - crashed} clean, ${crashed} crashed`)
