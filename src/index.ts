/**
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  serial as polyfill, SerialPort as SerialPortPolyfill,
} from 'web-serial-polyfill';

/**
 * Elements of the port selection dropdown extend HTMLOptionElement so that
 * they can reference the SerialPort they represent.
 */
declare class PortOption extends HTMLOptionElement {
  port: SerialPort | SerialPortPolyfill;
}

let portSelector: HTMLSelectElement;
let connectButton: HTMLButtonElement;
let PTT_OFF: HTMLButtonElement;
let PTT_ON: HTMLButtonElement;
let FREQUENCY: HTMLInputElement;

let portCounter = 1;
let port: SerialPort | SerialPortPolyfill | undefined;
let reader: ReadableStreamDefaultReader | ReadableStreamBYOBReader | undefined;

const urlParams = new URLSearchParams(window.location.search);
const usePolyfill = urlParams.has('polyfill');
const bufferSize = 8 * 1024; // 8kB
const encoder = new TextEncoder();

/**
 * Returns the option corresponding to the given SerialPort if one is present
 * in the selection dropdown.
 *
 * @param {SerialPort} port the port to find
 * @return {PortOption}
 */
function findPortOption(port: SerialPort | SerialPortPolyfill):
    PortOption | null {
  for (let i = 0; i < portSelector.options.length; ++i) {
    const option = portSelector.options[i];
    if (option.value === 'prompt') {
      continue;
    }
    const portOption = option as PortOption;
    if (portOption.port === port) {
      return portOption;
    }
  }

  return null;
}

/**
 * Adds the given port to the selection dropdown.
 *
 * @param {SerialPort} port the port to add
 * @return {PortOption}
 */
function addNewPort(port: SerialPort | SerialPortPolyfill): PortOption {
  const portOption = document.createElement('option') as PortOption;
  portOption.textContent = `Port ${portCounter++}`;
  portOption.port = port;
  portSelector.appendChild(portOption);
  return portOption;
}

/**
 * Adds the given port to the selection dropdown, or returns the existing
 * option if one already exists.
 *
 * @param {SerialPort} port the port to add
 * @return {PortOption}
 */
function maybeAddNewPort(port: SerialPort | SerialPortPolyfill): PortOption {
  const portOption = findPortOption(port);
  if (portOption) {
    return portOption;
  }

  return addNewPort(port);
}

/**
 * Sets |port| to the currently selected port. If none is selected then the
 * user is prompted for one.
 */
async function getSelectedPort(): Promise<void> {
  if (portSelector.value == 'prompt') {
    try {
      const serial = usePolyfill ? polyfill : navigator.serial;
      port = await serial.requestPort({});
    } catch (e) {
      return;
    }
    const portOption = maybeAddNewPort(port);
    portOption.selected = true;
  } else {
    const selectedOption = portSelector.selectedOptions[0] as PortOption;
    port = selectedOption.port;
  }
}

/**
 * Show serial input and diagnostics.
 * @param {string} msg  the message to show.
 * @param {void} callback
 * Optional callback that fires when the data was processed.
*/
function dumpSerialOut(msg: string, callback?: () => void): void {
  const element=document.getElementById('serialOut');
  if (element) element.innerText += msg;
  if (callback) callback();
}

/**
 * Resets the UI back to the disconnected state.
 */
function markDisconnected(): void {
  dumpSerialOut('<DISCONNECTED>\n');
  portSelector.disabled = false;
  connectButton.textContent = 'Connect';
  connectButton.disabled = false;
  port = undefined;
}

/**
 * Initiates a connection to the selected port.
 */
async function connectToPort(): Promise<void> {
  await getSelectedPort();
  if (!port) {
    return;
  }
  // TODO: https://wicg.github.io/serial/#setsignals-method
  // TODO: Test with plain old serial adapter not with microham
  const options = {
    baudRate: 9600,
    dataBits: 7,
    parity: 'even' as ParityType,
    stopBits: 1,
    flowControl: <const> 'none',
    bufferSize,
  };
  console.log(options);

  portSelector.disabled = true;
  connectButton.textContent = 'Connecting...';
  connectButton.disabled = true;

  try {
    await port.open(options);
    dumpSerialOut('<CONNECTED>\n');
    connectButton.textContent = 'Disconnect';
    connectButton.disabled = false;
  } catch (e) {
    console.error(e);
    if (e instanceof Error) {
      dumpSerialOut(`<ERROR: ${e.message}>\n`);
    }
    markDisconnected();
    return;
  }

  while (port && port.readable) {
    try {
      reader = port.readable.getReader({mode: 'byob'});

      let buffer = null;
      for (;;) {
        const {value, done} = await (async () => {
          if (!buffer) {
            buffer = new ArrayBuffer(bufferSize);
          }
          const {value, done} =
            await reader.read(new Uint8Array(buffer, 0, bufferSize));
          buffer = value?.buffer;
          return {value, done};
        })();

        if (value) {
          await new Promise<void>((resolve) => {
            const msg = new TextDecoder().decode(value);
            dumpSerialOut(msg, resolve);
          });
        }
        if (done) {
          break;
        }
      }
    } catch (e) {
      console.error(e);
      await new Promise<void>((resolve) => {
        if (e instanceof Error) {
          dumpSerialOut(`<ERROR: ${e.message}>\n`, resolve);
        }
      });
    } finally {
      if (reader) {
        reader.releaseLock();
        reader = undefined;
      }
    }
  }

  if (port) {
    try {
      await port.close();
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        dumpSerialOut(`<ERROR: ${e.message}>`);
      }
    }

    markDisconnected();
  }
}

/**
 * Closes the currently active connection.
 */
async function disconnectFromPort(): Promise<void> {
  // Move |port| into a local variable so that connectToPort() doesn't try to
  // close it on exit.
  const localPort = port;
  port = undefined;

  if (reader) {
    await reader.cancel();
  }

  if (localPort) {
    try {
      await localPort.close();
    } catch (e) {
      console.error(e);
      if (e instanceof Error) {
        dumpSerialOut(`<ERROR: ${e.message}>`);
      }
    }
  }

  markDisconnected();
}

document.addEventListener('DOMContentLoaded', async () => {
  portSelector = document.getElementById('ports') as HTMLSelectElement;

  PTT_OFF = document.getElementById('PTT_OFF') as HTMLButtonElement;
  PTT_OFF.addEventListener('click', setTxOff);

  PTT_ON = document.getElementById('PTT_ON') as HTMLButtonElement;
  PTT_ON.addEventListener('click', setTxOn);

  FREQUENCY = document.getElementById('FREQUENCY') as HTMLInputElement;
  FREQUENCY.addEventListener('change', setFrequency);

  connectButton = document.getElementById('connect') as HTMLButtonElement;
  connectButton.addEventListener('click', () => {
    if (port) {
      disconnectFromPort();
    } else {
      connectToPort();
    }
  });

  const polyfillSwitcher =
      document.getElementById('polyfill_switcher') as HTMLAnchorElement;
  if (usePolyfill) {
    polyfillSwitcher.href = './';
    polyfillSwitcher.textContent = 'Switch to native API';
  } else {
    polyfillSwitcher.href = './?polyfill';
    polyfillSwitcher.textContent = 'Switch to API polyfill';
  }

  const serial = usePolyfill ? polyfill : navigator.serial;
  const ports: (SerialPort | SerialPortPolyfill)[] = await serial.getPorts();
  ports.forEach((port) => addNewPort(port));

  // These events are not supported by the polyfill.
  // https://github.com/google/web-serial-polyfill/issues/20
  if (!usePolyfill) {
    navigator.serial.addEventListener('connect', (event) => {
      // const portOption = addNewPort(event.target as SerialPort);
      addNewPort(event.target as SerialPort);
      // portOption.selected = true;
      connectToPort();
    });
    navigator.serial.addEventListener('disconnect', (event) => {
      const portOption = findPortOption(event.target as SerialPort);
      if (portOption) {
        portOption.remove();
      }
    });
  }

  for (const elem of document.getElementsByClassName('clickCmd') ) {
    elem.addEventListener('click', sendCmd);
  }
});

/**
 * Turn the transmitter off
 */
function setTxOff() {
  document.body.style.background = 'rgb(36, 234, 29)';
}

/**
 * Turn the transmitter On
 */
function setTxOn() {
  document.body.style.background = 'rgb(14, 6, 237)';
}

/**
 * Set the frequency
 @param {any} event the event
 */
function setFrequency(event: any ) {
  const e = event.currentTarget;
  if (e) {
    const f = Math.round(e.value/10); // TODO: check limits
    const fstring = String(f).padStart(7, `0000000` );
    const cmd = `*F${fstring}`;
    sendSerial(toXK852Cmd(cmd));
  }
}

/**
 * Send Data to the serial port
 * @param {Uint8Array} data the command to send
*/
function sendSerial(data: Uint8Array) {
  if (port?.writable == null) {
    console.warn(`unable to find writable port`);
    return;
  }

  const writer = port.writable.getWriter();
  writer.write(data);
  writer.releaseLock();
}

/**
 * Send a Command
* @param {any} event the Event : Todo:use React
*/
function sendCmd(event: any ) {
  const elem = event.currentTarget;
  if (elem) sendSerial(toXK852Cmd(elem.value));
}

/**
 * Format XK852
* @param {string} cmd the command string
* @return {Uint8Array} the XK852 command bytes
*/
function toXK852Cmd(cmd: string): Uint8Array {
  const m = encoder.encode(cmd);
  const msg = new Uint8Array(m.length + 2);
  msg[0] = 10; // begin of message : LF
  msg.set(m, 1);
  msg[m.length + 1] = 13; // begin of message : CR
  return msg;
}
