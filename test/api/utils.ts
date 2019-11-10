import _ from 'lodash'
import { RippleAPI } from 'ripple-api'
import assert from 'assert-diff'
const { schemaValidator } = RippleAPI._PRIVATE

export type TestFn = (
  api: RippleAPI,
  address: string
) => void | PromiseLike<void>
export interface TestSuite {
  [key: string]: TestFn
}
export interface TestSuiteData {
  name: string
  tests: [string, TestFn][]
  isMissing: boolean
}

/**
 * Check the response against the expected result. Optionally validate that response
 * against a given schema.
 */
export function assertResult(
  response: any,
  expected: any,
  schemaName?: string
) {
  if (expected.txJSON) {
    assert(response.txJSON)
    assert.deepEqual(
      JSON.parse(response.txJSON),
      JSON.parse(expected.txJSON),
      'checkResult: txJSON must match'
    )
  }
  if (expected.tx_json) {
    assert(response.tx_json)
    assert.deepEqual(
      response.tx_json,
      expected.tx_json,
      'checkResult: tx_json must match'
    )
  }
  assert.deepEqual(
    _.omit(response, ['txJSON', 'tx_json']),
    _.omit(expected, ['txJSON', 'tx_json'])
  )
  if (schemaName) {
    schemaValidator.schemaValidate(schemaName, response)
  }
}

/**
 * Check that the promise rejects with an expected error instance.
 */
export async function assertRejects(
  promise: PromiseLike<any>,
  instanceOf: any
) {
  try {
    await promise
    assert(false, 'Expected an error to be thrown')
  } catch (error) {
    assert(error instanceof instanceOf)
  }
}

export function getAllPublicMethods(api: RippleAPI) {
  return Object.keys(api).filter(key => !key.startsWith('_'))
}

export function loadTestSuite(methodName: string): TestSuiteData | null {
  try {
    const testSuite = require(`./${methodName}`)
    return {
      isMissing: false,
      name: methodName,
      tests: Object.entries(testSuite.default || {}),
    }
  } catch (err) {
    return {
      isMissing: true,
      name: methodName,
      tests: [],
    }
  }
}
