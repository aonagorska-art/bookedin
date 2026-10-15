import { verifiedSources } from '../shared/verified-data'

export const sources = verifiedSources

export function recordSourceCheck(sourceId: string, succeeded: boolean, note: string) {
  return { sourceId, succeeded, note, checkedAt: new Date().toISOString() }
}
