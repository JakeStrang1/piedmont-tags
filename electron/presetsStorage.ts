import { app } from 'electron'
import path from 'node:path'
import { copyFile, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'

const PRESETS_DIRNAME = 'assets'
const PRESETS_FILENAME = 'presets.json'
const PRESETS_EMPTY_JSON = '[]'
const PRESETS_BACKUP_SUFFIX = '.bak'
const PRESETS_TEMP_SUFFIX = '.tmp'

/**
 * Assumed legacy Windows userData directory names from older builds.
 * Replace/remove these once exact historical folder name(s) are known.
 */
const LEGACY_USERDATA_DIR_CANDIDATES = [
  'piedmont-tags',
  'Piedmont Tags',
  'piedmont_tags',
]

const fileExists = async (filePath: string) => {
  try {
    await readFile(filePath, 'utf8')
    return true
  } catch (error) {
    const err = error as NodeJS.ErrnoException
    if (err.code === 'ENOENT') return false
    throw error
  }
}

const getPresetsFilePath = (isDev: boolean, appRoot: string) => {
  if (isDev) {
    return path.join(appRoot, 'src', PRESETS_DIRNAME, PRESETS_FILENAME)
  }
  const dir = path.join(app.getPath('userData'), PRESETS_DIRNAME)
  return path.join(dir, PRESETS_FILENAME)
}

const ensurePresetsFileExists = async (isDev: boolean, appRoot: string) => {
  const targetPath = getPresetsFilePath(isDev, appRoot)
  await mkdir(path.dirname(targetPath), { recursive: true })

  if (await fileExists(targetPath)) return targetPath

  // Development starts from local empty file.
  if (isDev) {
    await writeFile(targetPath, PRESETS_EMPTY_JSON, 'utf8')
    return targetPath
  }

  // One-time migration support for older userData directory names.
  const appDataPath = app.getPath('appData')
  for (const candidateDirName of LEGACY_USERDATA_DIR_CANDIDATES) {
    const legacyPath = path.join(
      appDataPath,
      candidateDirName,
      PRESETS_DIRNAME,
      PRESETS_FILENAME
    )
    if (!(await fileExists(legacyPath))) continue
    await copyFile(legacyPath, targetPath)
    return targetPath
  }

  await writeFile(targetPath, PRESETS_EMPTY_JSON, 'utf8')
  return targetPath
}

export const readPresetsJson = async (isDev: boolean, appRoot: string) => {
  const filePath = await ensurePresetsFileExists(isDev, appRoot)
  const backupPath = `${filePath}${PRESETS_BACKUP_SUFFIX}`

  try {
    const raw = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // If primary file is corrupt, attempt recovery from backup.
    if (await fileExists(backupPath)) {
      const rawBackup = await readFile(backupPath, 'utf8')
      const parsedBackup = JSON.parse(rawBackup)
      if (Array.isArray(parsedBackup)) {
        await writePresetsJson(parsedBackup, isDev, appRoot)
        return parsedBackup
      }
    }
    await writePresetsJson([], isDev, appRoot)
    return []
  }
}

export const writePresetsJson = async (
  value: unknown,
  isDev: boolean,
  appRoot: string
) => {
  if (!Array.isArray(value)) {
    throw new Error('Presets payload must be an array')
  }

  const filePath = await ensurePresetsFileExists(isDev, appRoot)
  await mkdir(path.dirname(filePath), { recursive: true })

  const backupPath = `${filePath}${PRESETS_BACKUP_SUFFIX}`
  const tempPath = `${filePath}${PRESETS_TEMP_SUFFIX}`
  const payload = JSON.stringify(value, null, 2)

  if (await fileExists(filePath)) {
    await copyFile(filePath, backupPath)
  }

  try {
    await writeFile(tempPath, payload, 'utf8')
    await rename(tempPath, filePath)
  } finally {
    await rm(tempPath, { force: true })
  }
}

