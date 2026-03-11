import { writeFileSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'

import { join, relative, resolve } from 'pathe'
import { findWorkspaceDir } from 'pkg-types'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { build, loadNuxt } from 'nuxt'

describe('builder:watch', { sequential: true }, async () => {
  const tmpDir = join(await findWorkspaceDir(), '.test/builder-watch')
  beforeEach(async () => {
    await rm(tmpDir, { recursive: true, force: true })
    await mkdir(join(tmpDir, 'project/node_modules'), { recursive: true })
  })
  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })
  const watcherStrategies = ['chokidar', 'chokidar-granular', 'parcel'] as const
  it.each(watcherStrategies)('should restart Nuxt when a file is added with %s strategy', async (watcher) => {
    const rootDir = join(tmpDir, 'project')
    const nuxt = await loadNuxt({
      cwd: rootDir,
      ready: true,
      overrides: {
        experimental: { watcher },
        dev: true,
        watch: ['test', join(rootDir, 'other'), resolve(rootDir, '../higher')],
      },
    })
    let restarts = 0
    const events: string[] = []

    nuxt.hook('restart', () => { restarts++ })
    nuxt.hook('builder:watch', (event, path) => {
      if (event === 'add') {
        events.push(relative(rootDir, path))
      }
    })

    await build(nuxt)

    const watchPromise = new Promise(resolve => nuxt.hooks.hookOnce('builder:watch', resolve))
    writeFileSync(resolve(rootDir, '../higher'), 'something')
    writeFileSync(join(rootDir, 'test'), 'something')
    writeFileSync(join(rootDir, 'other'), 'something')
    await watchPromise

    await nuxt.close()

    expect.soft(restarts).toBe(3)
    expect.soft(events.sort()).toStrictEqual([
      '../higher',
      'other',
      'test',
    ])
  })

  it.each(watcherStrategies)('should watch external component dirs registered via addComponentsDir with %s strategy', async (watcher) => {
    const rootDir = join(tmpDir, 'project')
    const externalComponentsDir = join(tmpDir, 'external-pkg/components')
    await mkdir(externalComponentsDir, { recursive: true })

    const nuxt = await loadNuxt({
      cwd: rootDir,
      ready: true,
      overrides: {
        experimental: { watcher },
        dev: true,
        modules: [
          function (this: unknown, _options: unknown, nuxt: any) {
            nuxt.hook('components:dirs', (dirs: Array<{ path: string }>) => {
              dirs.push({ path: externalComponentsDir })
            })
          },
        ],
      },
    })

    const events: string[] = []
    nuxt.hook('builder:watch', (event, path) => {
      if (event === 'add') {
        events.push(path)
      }
    })

    await build(nuxt)

    const watchPromise = new Promise(resolve => nuxt.hooks.hookOnce('builder:watch', resolve))
    writeFileSync(join(externalComponentsDir, 'MyExternalComponent.vue'), '<template><div /></template>')
    await watchPromise

    await nuxt.close()

    expect.soft(events.some(e => e.includes('MyExternalComponent.vue'))).toBe(true)
  })
})
