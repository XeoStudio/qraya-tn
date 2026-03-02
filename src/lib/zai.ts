import ZAI from 'z-ai-web-dev-sdk'
import { writeFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

// Z-AI SDK Configuration
// The SDK looks for config in this order:
// 1. Current directory: ./.z-ai-config
// 2. Home directory: ~/.z-ai-config
// 3. System directory: /etc/.z-ai-config

let zaiInstance: ZAI | null = null

// Default config for local development (will be overridden by env vars if set)
const DEFAULT_CONFIG = {
  baseUrl: 'http://172.25.136.193:8080/v1',
  apiKey: 'Z.ai',
  chatId: 'chat-0107dd16-d77a-40b8-a1f7-9b40e746292c',
  userId: '266a0ddb-01f7-41f4-859d-2016d60de0fc'
}

export async function getZAI(): Promise<ZAI> {
  if (zaiInstance) {
    return zaiInstance
  }

  // Check if we're in a deployed environment (Vercel, etc.)
  // In that case, we need environment variables
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1'

  if (isProduction) {
    // In production, we MUST have environment variables
    const baseUrl = process.env.ZAI_BASE_URL
    const apiKey = process.env.ZAI_API_KEY

    if (!baseUrl || !apiKey) {
      console.error('Z-AI: Missing ZAI_BASE_URL or ZAI_API_KEY environment variables')
      throw new Error('Z-AI configuration missing. Please set ZAI_BASE_URL and ZAI_API_KEY environment variables in your deployment platform.')
    }

    // Create config file in temp directory for SDK to find
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
      // Ignore write errors
    }
  } else {
    // In development, check if config exists, if not create one with defaults
    const configPaths = [
      join(process.cwd(), '.z-ai-config'),
      join(require('os').homedir(), '.z-ai-config'),
      '/etc/.z-ai-config'
    ]

    const configExists = configPaths.some(p => {
      try {
        return existsSync(p)
      } catch {
        return false
      }
    })

    if (!configExists) {
      // Create config in current directory for development
      try {
        writeFileSync(
          join(process.cwd(), '.z-ai-config'),
          JSON.stringify(DEFAULT_CONFIG, null, 2)
        )
      } catch {
        // Ignore write errors
      }
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
