const CRED_ID_STORAGE_KEY = 'bm_webauthn_cred_id';
const PIN_STORAGE_KEY = 'bm_privacy_pin';

export async function isPlatformBiometricAvailable(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) {
    return false;
  }
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function registerBiometricPasskey(userEmail: string, pinFallback: string): Promise<{
  mode: 'webauthn' | 'pin';
  message: string;
}> {
  localStorage.setItem(PIN_STORAGE_KEY, pinFallback);

  const available = await isPlatformBiometricAvailable();
  if (!available) {
    return {
      mode: 'pin',
      message: 'Hardware passkey unavailable in embedded preview; Privacy PIN lock enabled.',
    };
  }

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));
    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Nurtura Privacy Vault' },
        user: {
          id: userId,
          name: userEmail,
          displayName: userEmail,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 30000,
      },
    })) as PublicKeyCredential | null;

    if (credential) {
      const encodedId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      localStorage.setItem(CRED_ID_STORAGE_KEY, encodedId);
      return {
        mode: 'webauthn',
        message: 'Device biometric passkey registered with backup Privacy PIN.',
      };
    }
  } catch {
    // Sandboxed iframe or user cancelled hardware prompt — clean fallback to Privacy PIN
  }

  return {
    mode: 'pin',
    message: 'Privacy PIN lock enabled (device biometric prompt restricted in current browser context).',
  };
}

export async function verifyBiometricOrPin(enteredPin?: string): Promise<boolean> {
  const storedPin = localStorage.getItem(PIN_STORAGE_KEY) || '2026';
  if (enteredPin && enteredPin === storedPin) {
    return true;
  }

  const storedCred = localStorage.getItem(CRED_ID_STORAGE_KEY);
  if (storedCred && window.PublicKeyCredential) {
    try {
      const rawId = Uint8Array.from(atob(storedCred), (c) => c.charCodeAt(0));
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ id: rawId, type: 'public-key' }],
          userVerification: 'required',
          timeout: 30000,
        },
      });
      if (assertion) return true;
    } catch {
      return false;
    }
  }

  return false;
}

export function getStoredPinHint(): boolean {
  return Boolean(localStorage.getItem(PIN_STORAGE_KEY));
}
