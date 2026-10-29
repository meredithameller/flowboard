import { createFakeApi } from './fakeApi'
import type { CardData } from '../types'

let current = createFakeApi()

/** Call at the start of each test to reset the in-memory database. */
export function resetFakeApi(initial: CardData[] = []) {
  current = createFakeApi(initial)
  return current
}

// Delegating module used by vi.mock('../api', ...): always forwards to the current fake.
type Api = ReturnType<typeof createFakeApi>['api']
export const apiModule = {
  fetchCards: (...a: Parameters<Api['fetchCards']>) => current.api.fetchCards(...a),
  createCard: (...a: Parameters<Api['createCard']>) => current.api.createCard(...a),
  updateCard: (...a: Parameters<Api['updateCard']>) => current.api.updateCard(...a),
  moveCardTo: (...a: Parameters<Api['moveCardTo']>) => current.api.moveCardTo(...a),
  removeCard: (...a: Parameters<Api['removeCard']>) => current.api.removeCard(...a),
  restoreCard: (...a: Parameters<Api['restoreCard']>) => current.api.restoreCard(...a),
  subscribeToCards: (...a: Parameters<Api['subscribeToCards']>) => current.api.subscribeToCards(...a),
}
