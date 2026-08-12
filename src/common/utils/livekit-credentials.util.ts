// src/common/utils/livekit-credentials.util.ts
import { randomBytes } from 'crypto';

export function generateLiveKitCredentials() {
  return {
    apiKey: `LK${randomBytes(6).toString('hex')}`,
    apiSecret: randomBytes(32).toString('hex'),
  };
}
