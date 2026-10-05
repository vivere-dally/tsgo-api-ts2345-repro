// Runs the tsgo CLI in batch mode N times; prints the count of runs that report TS2345.
import { spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const runs = Number(process.argv[2] ?? process.env.PROBE_RUNS ?? 25)
const tsc = path.join(here, 'node_modules', '.bin', 'tsc')

let wrong = 0
for (let run = 1; run <= runs; run++) {
  const out = spawnSync(tsc, ['-p', 'tsconfig.app.json', '--pretty', 'false'], { cwd: here, encoding: 'utf8' })
  const text = `${out.stdout}${out.stderr}`
  const has2345 = text.includes('TS2345')
  const errorLines = text.split('\n').filter((line) => /error TS\d+/.test(line))
  if (has2345) {
    wrong++
    console.log(`${run}: TS2345 ${errorLines.find((l) => l.includes('TS2345'))?.trim().slice(0, 160)}`)
  } else if (errorLines.length > 0) {
    console.log(`${run}: other ${errorLines[0].trim().slice(0, 120)}`)
  } else {
    console.log(`${run}: clean (exit ${out.status})`)
  }
}
console.log(`\n${runs} batch runs: ${wrong} with TS2345, ${runs - wrong} clean`)
