import type { ComponentType } from 'svelte';

import Config from '../config/Download.svelte';
import RigControl from './RigControl.svelte';
import LocalSerial from '../LocalSerial.svelte';
import Settings from '../settings/Settings.svelte';
import Debug from '../debug/Debug.svelte';
import Wheel from '../misc/Wheel.svelte';
import Test from '../misc/Test.svelte';
import Frequency from '../cat/Frequency.svelte';
import Auxiliary from '../aux/Auxiliary.svelte';
import HID from '../hid/HID.svelte';
import FT8 from '../ft8/FT8.svelte';
import RigToUsb from '../rig_to_usb/Test.svelte';

export function elementByName(element : String) : ComponentType {
  switch(element) {
    case 'Config': return Config;
    case 'RigControl': return RigControl;
    case 'Debug': return Debug;
    case 'Settings': return Settings;
    case 'FT8': return FT8;
    case 'Serial': return LocalSerial;
    case 'Frequency': return Frequency;
    case 'HID': return HID;
    case 'Test': return Test;
    case 'Auxiliary': return Auxiliary;
    case 'Wheel': return Wheel;
    case 'RigToUsb': return RigToUsb;
    default : return Debug;
  }
}
