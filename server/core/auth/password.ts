import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const SCRYPT_COST = 16_384
const SCRYPT_BLOCK_SIZE = 8
const SCRYPT_PARALLELIZATION = 1
const SCRYPT_KEY_LENGTH = 64

const deriveKey = (password: string, salt: Buffer) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_COST,
    r: SCRYPT_BLOCK_SIZE,
    p: SCRYPT_PARALLELIZATION,
  }, (error, key) => {
    if (error) reject(error)
    else resolve(key as Buffer)
  })
})

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16)
  const key = await deriveKey(password, salt)

  return [
    'scrypt',
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION,
    salt.toString('base64url'),
    key.toString('base64url'),
  ].join('$')
}

export const verifyPassword = async (password: string, passwordHash: string) => {
  const [algorithm, cost, blockSize, parallelization, saltValue, keyValue, ...extra] = passwordHash.split('$')
  if (
    algorithm !== 'scrypt'
    || Number(cost) !== SCRYPT_COST
    || Number(blockSize) !== SCRYPT_BLOCK_SIZE
    || Number(parallelization) !== SCRYPT_PARALLELIZATION
    || !saltValue
    || !keyValue
    || extra.length
  ) return false

  try {
    const expectedKey = Buffer.from(keyValue, 'base64url')
    if (expectedKey.length !== SCRYPT_KEY_LENGTH) return false

    const actualKey = await deriveKey(password, Buffer.from(saltValue, 'base64url'))
    return timingSafeEqual(actualKey, expectedKey)
  }
  catch {
    return false
  }
}
