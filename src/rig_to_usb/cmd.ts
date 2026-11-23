import { encode, bool, bytes, arrayLen, u8, uint} from 'cbor-utils'
import { type Result, tryDecode, mapLen } from "cbor-utils";

export const CMD = {
  StartBootLoader: 'StartBootLoader',
  Panic: 'Panic',
  Test:  'Test',
  Reset: 'Reset',
  LED: 'LED',
  LEDBlink: 'LEDBlink',
  RadioOn: 'RadioOn',
  RadioOff: 'RadioOff',
  TxOn: 'TxOn',
  TxOff: 'TxOff',
  MorseSpeed: 'MorseSpeed',
  MorseSend: 'MorseSend',
  MorseAppend: 'MorseAppend',
  SendCat: 'SendCat'
} as const

const tags = {
  StartBootLoader: 0,
  Panic:           1,
  Test:            2,
  Reset:           3,
  LED:             4,
  LEDBlink:        5,
  RadioOn:         6,
  RadioOff:        7,
  TxOn:            8,
  TxOff:           9,
  MorseSpeed:     10,
  MorseSend:      11,
  MorseAppend:    12,
  SendCat:        13,
} as const;

export type Cmd = {
  readonly cmd: typeof CMD[keyof typeof CMD];
  [variableData: string]: any;
};

export function toCBOR(cmd:Cmd):Uint8Array {
  return encode((e) => {
  const tag = tags[cmd.cmd];
  function two() {
    e.encode(arrayLen, 2);
    e.encode(u8, tag);
  }
  function oneNumber(n: number) {
    e.encode(arrayLen, 2);
    e.encode(u8, tag);
    e.encode(uint, n);
  }
  function txt_string(t: string) {
    e.encode(arrayLen, 2);
    e.encode(u8, tag);
    const encoder = new TextEncoder();
    e.encode(bytes, encoder.encode(t));
  }
  function txt_bytes(b: Uint8Array ) {
    e.encode(arrayLen, 2);
    e.encode(u8, tag);
    e.encode(bytes, b);
  }
  switch (cmd.cmd) {
    case 'LED':
      two(); e.encode(bool, cmd.value);
      break;
    case 'LEDBlink':
      oneNumber(cmd.interval);
      break;
    case 'RadioOn':
      oneNumber(cmd.timeout_ms);
      break;
    case 'TxOn':
      oneNumber(cmd.timeout_ms);
      break;
    case 'MorseSpeed':
      oneNumber(cmd.ditlen);
      break;
    case 'MorseSend':
      txt_string(cmd.txt);
      break;
    case 'MorseAppend':
      txt_string(cmd.txt);
      break;
    case 'SendCat':
      txt_bytes(cmd.bytes);
      break;
    default:
      e.encode(arrayLen, 1);
      e.encode(u8, tag)
  };
  }
  )
}

export const prebuild_cmds = {
  start_boot_loader: toCBOR({cmd: CMD.StartBootLoader}),
  panic: toCBOR({cmd: CMD.Panic}),
  test: toCBOR({cmd: CMD.Test}),
  reset: toCBOR({cmd: CMD.Reset}),
  led_on: toCBOR({cmd: CMD.LED, value: true}),
  led_off: toCBOR({cmd: CMD.LED, value: false}),
  led_blink_1s: toCBOR({cmd: CMD.LEDBlink, interval: 1000}),
  radio_on_10s: toCBOR({cmd: CMD.RadioOn, timeout_ms: 10000}),
  radio_off: toCBOR({cmd: CMD.RadioOff}),
  tx_on_4s:  toCBOR({cmd: CMD.TxOn, timeout_ms: 4000}),
  tx_off: toCBOR({cmd: CMD.TxOff}),
  wps_24 : toCBOR({cmd: CMD.MorseSpeed, ditlen: 50 })
};

export interface HIDReport {
  cat_rx_msg?: Uint8Array;
  cat_rx_skipped?: Uint8Array;
  sequence_id?: number;
  is_error?: boolean;
  device_name?: string;
}

export function deserializeHIDReport(cborBytes: Uint8Array): Result<HIDReport, unknown> {
  return tryDecode(cborBytes, (d) => {
    const report: HIDReport = {};
    const length = d.decode(mapLen)!;
    for (let i = 0; i < length; i++) {
      const index = d.decode(u8);
      switch (index) {
        case 0:
          report.cat_rx_msg = d.decode(bytes);
          break;
        case 1:
          report.cat_rx_skipped = d.decode(bytes);
          break;
        default:
          break;
      }
    }
    return report;
    });
}
