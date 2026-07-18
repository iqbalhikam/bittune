export interface BLEPacket {
  command: string;
  value: number;
}

/**
 * Encodes a command character and numeric value into a 2-byte Uint8Array.
 */
export function encodePacket(command: string, value: number): Uint8Array {
  const code = command.charCodeAt(0);
  const clampedValue = Math.max(0, Math.min(255, Math.round(value)));
  return new Uint8Array([code, clampedValue]);
}

/**
 * Decodes a 2-byte Uint8Array into a BLEPacket object.
 */
export function decodePacket(data: DataView | Uint8Array): BLEPacket | null {
  if (data.byteLength < 2) return null;
  
  const buffer = data instanceof Uint8Array ? data : new Uint8Array(data.buffer);
  const command = String.fromCharCode(buffer[0]);
  const value = buffer[1];
  
  return { command, value };
}
