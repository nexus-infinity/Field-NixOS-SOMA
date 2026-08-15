/**
 * executeAction — PULSE action executor
 * Every resolved action must execute and emit a proof receipt, OR
 * explicitly fail and emit a failure receipt. No silent dead paths.
 *
 * Invariant: Signal → Resolution → State → Execution
 */

import { BleManager, type BleManager as BleManagerType, type Device, type Service } from 'react-native-ble-plx';
import type { ActionVector } from './metatronBleTranslate';
import { observe, flagUnaligned } from './deviceRegistry';

const deviceRegistry = { observe, flagUnaligned };

// ─── Proof receipt ────────────────────────────────────────────────────────────

export type ActionStatus = 'success' | 'failure' | 'deferred';

export interface ActionReceipt {
  deviceId:   string;
  action:     ActionVector;
  status:     ActionStatus;
  timestamp:  string;
  detail?:    string;
}

// Module-level receipt log (append-only, in-memory for now)
const ACTION_LOG: ActionReceipt[] = [];

export function getActionLog(): readonly ActionReceipt[] {
  return ACTION_LOG;
}

function emit(receipt: ActionReceipt): void {
  ACTION_LOG.push(receipt);
  if (__DEV__) {
    console.log(
      `[PULSE·ACTION] ${receipt.action.toUpperCase()} · ${receipt.deviceId} · ${receipt.status}` +
      (receipt.detail ? ` · ${receipt.detail}` : ''),
    );
  }
}

// ─── Executor ─────────────────────────────────────────────────────────────────

export async function executeAction(
  action:  ActionVector,
  device:  Device,
  manager: BleManagerType,
): Promise<ActionReceipt> {
  const base = { deviceId: device.id, action, timestamp: new Date().toISOString() };

  try {
    switch (action) {

      case 'connect': {
        const connected = await manager.connectToDevice(device.id);
        await connected.discoverAllServicesAndCharacteristics();
        const services = await connected.services();
        const serviceUUIDs = services.map((s: Service) => s.uuid);
        await manager.cancelDeviceConnection(device.id);
        const receipt: ActionReceipt = {
          ...base,
          status: 'success',
          detail: `services: ${serviceUUIDs.slice(0, 3).join(', ')}${serviceUUIDs.length > 3 ? '…' : ''}`,
        };
        emit(receipt);
        return receipt;
      }

      case 'log': {
        // Persist device to registry as observed (partial alignment)
        deviceRegistry.observe(device.id, device.name ?? null, device.rssi ?? null);
        const receipt: ActionReceipt = { ...base, status: 'success', detail: 'logged to registry' };
        emit(receipt);
        return receipt;
      }

      case 'observe': {
        // Record latest RSSI snapshot — no connection attempt
        deviceRegistry.observe(device.id, device.name ?? null, device.rssi ?? null);
        const receipt: ActionReceipt = { ...base, status: 'success', detail: `rssi ${device.rssi} dBm` };
        emit(receipt);
        return receipt;
      }

      case 'seek-alignment': {
        // Flag as unaligned in registry — queued for manual identification
        deviceRegistry.flagUnaligned(device.id, device.rssi ?? null);
        const receipt: ActionReceipt = {
          ...base,
          status: 'deferred',
          detail: 'unaligned · queued for identification',
        };
        emit(receipt);
        return receipt;
      }

      default: {
        const receipt: ActionReceipt = { ...base, status: 'failure', detail: 'unknown action vector' };
        emit(receipt);
        return receipt;
      }
    }
  } catch (err) {
    const receipt: ActionReceipt = {
      ...base,
      status: 'failure',
      detail: err instanceof Error ? err.message : String(err),
    };
    emit(receipt);
    return receipt;
  }
}
