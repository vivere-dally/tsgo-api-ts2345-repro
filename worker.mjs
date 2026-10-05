// One fresh process: build the API once, ask for semantic diagnostics once, print JSON, exit.
import { API } from '@typescript/native/unstable/sync'
import path from 'node:path'

const cwd = process.cwd()
const config = path.resolve(cwd, process.argv[2] ?? 'tsconfig.app.json')
const api = new API({ cwd })
try {
  const snapshot = api.updateSnapshot({ openProjects: [config] })
  const project = snapshot.getProject(config)
  if (project === undefined) {
    console.log(JSON.stringify({ ok: false, reason: 'project missing' }))
  } else {
    const diags = project.program.getSemanticDiagnostics()
    const errors = diags.filter((d) => d.category === 1)
    console.log(JSON.stringify({ ok: true, errors: errors.map((d) => ({ code: d.code, text: String(d.text ?? d.messageText ?? '').split('\n')[0].slice(0, 200) })) }))
  }
} catch (error) {
  console.log(JSON.stringify({ ok: false, reason: String(error).slice(0, 300) }))
} finally {
  api.close()
}
