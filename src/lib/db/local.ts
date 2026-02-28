import Database from 'better-sqlite3'
import * as fs from 'fs'
import * as path from 'path'

let db: Database.Database | null = null

function findSQLiteFile(): string | null {
  const dir = './.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
  if (!fs.existsSync(dir)) {
    return null
  }
  
  const files = fs.readdirSync(dir)
  const sqliteFile = files.find(f => f.endsWith('.sqlite'))
  
  if (sqliteFile) {
    return path.join(dir, sqliteFile)
  }
  
  return null
}

export function getLocalDB(): Database.Database {
  if (!db) {
    const dbPath = findSQLiteFile()
    if (!dbPath) {
      throw new Error('Local database not found')
    }
    db = new Database(dbPath)
  }
  return db
}

interface D1PreparedStatement {
  first: <T>() => Promise<T | undefined>
  all: () => Promise<{ results: unknown[] }>
  run: () => Promise<{ changes: number; lastInsertRowid: number }>
  bind: (...params: unknown[]) => D1PreparedStatement
}

interface D1Database {
  prepare: (sql: string) => D1PreparedStatement
}

export function createDBInterface(): D1Database {
  const localDb = getLocalDB()
  
  return {
    prepare: (sql: string): D1PreparedStatement => {
      const stmt = localDb.prepare(sql)
      let boundParams: unknown[] = []
      
      const createBoundMethods = (params: unknown[]) => ({
        first: async <T>(): Promise<T | undefined> => {
          const s = localDb.prepare(sql)
          return s.get(...params) as T | undefined
        },
        all: async (): Promise<{ results: unknown[] }> => {
          const s = localDb.prepare(sql)
          return { results: s.all(...params) }
        },
        run: async (): Promise<{ changes: number; lastInsertRowid: number }> => {
          const s = localDb.prepare(sql)
          const result = s.run(...params)
          return { 
            changes: result.changes, 
            lastInsertRowid: Number(result.lastInsertRowid) 
          }
        },
        bind: (...newParams: unknown[]): D1PreparedStatement => {
          return createBoundMethods([...params, ...newParams])
        }
      })
      
      return {
        bind: function (...params: unknown[]): D1PreparedStatement {
          boundParams = params
          return createBoundMethods(params)
        },
        first: async <T>(): Promise<T | undefined> => {
          return stmt.get() as T | undefined
        },
        all: async (): Promise<{ results: unknown[] }> => {
          return { results: stmt.all() }
        },
        run: async (): Promise<{ changes: number; lastInsertRowid: number }> => {
          const result = stmt.run()
          return { 
            changes: result.changes, 
            lastInsertRowid: Number(result.lastInsertRowid) 
          }
        }
      }
    }
  }
}
