import {setGuiMode, GuiMode} from '../gui';
import { gotoStartRigToUSB } from '../ui/routes';
import {pushLog, rig} from '../state.svelte';
import {setReturnMsg} from '../setXK852Status';
import {type CmdType} from '../state.svelte';
import { type Cmd, CMD, toCBOR, deserializeHIDReport, prebuild_cmds } from './cmd';
import * as State from '../state.svelte';

var device: HIDDevice | null = null;

const REPORT_ID = 0;
const VENDOR_ID = 0x1209;
const PRODUCT_ID = 0x001;

let keepOnTask: ReturnType<typeof setTimeout>;

export async function initRigToUsb() {
  navigator.hid.addEventListener('disconnect', handleDisconnect);
  navigator.hid.addEventListener('connect', tryAutoConnectRigToUsb);
  tryAutoConnectRigToUsb()
    .then ((s) => {if (!s) gotoStartRigToUSB()})
}

function handleDisconnect(event: HIDConnectionEvent) {
  if (event.device === device) {
    device = null;
    setGuiMode(GuiMode.SomeError);
    clearTimeout(keepOnTask);
  }
};

export function isConnected():Boolean {
  if (!device) {
    return false;
  }
  if (!device.opened) {
    return false;
  }
  if (device.vendorId === 0 || device.productId === 0) {
    return false;
  }
  return true;
};

function setDevice(d: HIDDevice): void {
  device = d;
  device.addEventListener("inputreport", handleHidInput);
  State.setSendCmdCallback(send_cat);
  keepOnTask = setTimeout(keepOnHandler, 2000);
  setGuiMode(GuiMode.Connected);
};

export async function tryAutoConnectRigToUsb(): Promise<HIDDevice | null> {
  if (!('hid' in navigator)) {
    console.warn("WebHID is not supported in this browser.");
    return null;
  }

  try {
    const allowedDevices: HIDDevice[] = await navigator.hid.getDevices();
    const rig_to_usb = allowedDevices.find(
      (device) => device.vendorId === VENDOR_ID && device.productId === PRODUCT_ID
    );
    if (rig_to_usb) {
      if (!rig_to_usb.opened) {
        await rig_to_usb.open();
      }
      setDevice(rig_to_usb);
      return rig_to_usb;
    }
    console.log("RigToUSB not paired. A manual click is required.");
    return null;
  } catch (error) {
    console.error("Failed to auto-connect to HID device:", error);
    return null;
  }
}

export async function connectRigToUsb() {
  if ("hid" in navigator) {
    const deviceFilter = {
      filters : [
        { vendorId: VENDOR_ID, productId: PRODUCT_ID }
      ]
    };
    const devices = await navigator.hid.requestDevice(deviceFilter);
    if (devices && devices[0]) {
      const rig_to_usb = devices[0];
      await rig_to_usb.open();
      setDevice(rig_to_usb);
    }
  }
}

function handleHidInput(event: HIDInputReportEvent) {
  const { data, device:_d, reportId:_r } = event;
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const report = deserializeHIDReport(bytes);
  if (report.ok()) {
    const msg_string = (new TextDecoder("utf-8")).decode(
      report.value.cat_rx_msg!.subarray(1, -1)
    );
    pushLog(
      { src: 'rig_to_usb:cat_rx_msg'
        , date: new Date()
        , msg: report.value.cat_rx_msg
	, data: msg_string
      });
    setReturnMsg(msg_string);
  } else {
    console.error("Decode Error",bytes);
    console.error("Decode Error",report.error);
  }
};

function send_cat(cmd: CmdType) {
  sendCmd(
    {
      cmd: CMD.SendCat,
      bytes: cmd.xk852serialNative
    })
};

function keepOnHandler() {
  if (rig.keepRadioOn) {
    sendReport(prebuild_cmds.radio_on_10s);
  }
  keepOnTask = setTimeout(keepOnHandler, 2000);
}

export function sendCmd(cmd: Cmd):Boolean {
  return sendReport(toCBOR(cmd))
}

export function sendReport(bytes: Uint8Array):Boolean {
  device!.sendReport(REPORT_ID, bytes)
    .then(() => { return true;} )
  .catch((error) => {
    console.error("HID sendReport failed:", error);
    device = null;
    return false;
  });
  return true;
}
