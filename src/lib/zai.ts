import ZAI from 'z-ai-web-dev-sdk'
import { writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// Initialize Z-AI SDK with environment variables
// This is needed for Vercel deployment where .z-ai-config file doesn't exist

let zaiInstance: ZAI | null = null

export async function getZAI(): Promise<ZAI> {
  if (zaiInstance) {
    return zaiInstance
  }

  // Get configuration from environment variables
  const baseUrl = process.env.ZAI_BASE_URL || process.env.NEXT_PUBLIC_ZAI_BASE_URL
  const apiKey = process.env.ZAI_API_KEY || process.env.NEXT_PUBLIC_ZAI_API_KEY

  if (baseUrl && apiKey) {
    // Create config in temp directory for SDK to find
    const config = {
      baseUrl,
      apiKey,
      chatId: process.env.ZAI_CHAT_ID || '',
      userId: process.env.ZAI_USER_ID || ''
    }

    try {
      const configPath = join(tmpdir(), '.z-ai-config')
      writeFileSync(configPath, JSON.stringify(config, null, 2))
    } catch {
      // Ignore write errors - config might already exist or directory might not be writable
    }
  }

  zaiInstance = await ZAI.create()
  return zaiInstance
}

// Reset instance (useful for testing)
export function resetZAI() {
  zaiInstance = null
}

export default ZAI
