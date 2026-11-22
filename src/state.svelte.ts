import * as Type from './types';
import GstWebRTCAPI from 'gstwebrtc-api';
import { ConfigVar, uiOption} from './config/ConfigVar.svelte';

const emptyLogs : Array<any> = [] //Todo: limit size

export const log = $state(
  { objs:   emptyLogs
  , errors: emptyLogs
  });

export function pushError(obj: any):void {
  obj.isError = true;
  obj.isErrorConfirmed = false;
  log.errors.push(obj)
  pushLog(obj);
};

export function pushLog(obj: any):void {
  if (!obj.date) obj.date = new Date();
  log.objs.push(obj)
};

export const gui = $state(
  { frequency:
    { value: 1500000
    , time: Date.now ()
    },
    bfo:
    { value: 0
    , time: Date.now ()
    }
  });

export const rig = $state(
  { returnMsg: "no Message"
  , time: Date.now ()
  , frequency: 1500000
  , bfo: 0
  , power: null as (Type.XK852Power | null)
  , mode: null as (Type.XK852Mode | null)
  , keepRadioOn: false
  , keepTxOn: false
  });

export const webRTC = $state(
  { api: null as (GstWebRTCAPI | null)
  });

export const webRTCCapture = $state(
  { enable: false
  , enableVideo: false
  , session: null
  , starting: false
  , hasSession: false
  , mediaElement: null as (HTMLVideoElement | null)
  , clientId: null
  , consumers: {}
  });

export const webRTCClient = $state(
  { enable: false
  , enableVideo: false
  , showAllProducers: false
  , autoStartProducers: []
  , producers: ({} as Record<string, ProducerState>)
  });


import ConsumerSession from 'gstwebrtc-api/types/consumer-session.js';
import type {Peer} from 'gstwebrtc-api/types/gstwebrtc-api.js';
export type ProducerState = {
    session : ConsumerSession | null
  , producer: Peer
  , hasSession: Boolean
  , streaming: Boolean
  , hasRemoteControl: Boolean
};

export type CmdType =
  { xk852String: string  // string without line breaks
  , xk852serialNative: Uint8Array
  , rigctld: string
  , timeout: number
  };

export const espHomeEvent = $state(
  { data: ""
  , powerForward: 0
  , powerReverse: 0
  });

export function sendCmdCallbackError(_cmd: any) {
  pushError(
    { src: 'CAT'
    , date: new Date()
    , msg: 'Tranceiver not connected.'
    });
};

export var sendCmdCallback = sendCmdCallbackError;

export function setSendCmdCallback(fn: any) {
  sendCmdCallback = fn;
}

export const demoMode = new ConfigVar(
    { default: false
    , path: [ 'cat', 'demoMode' ]
    });

export const rigSyncInterval = new ConfigVar(
    { default: 20
    , path: [ 'cat', 'remoteSyncInterval' ]
    });

export const expertMode = uiOption(true, 'expertMode');
export const mobileMode = uiOption(false,  'mobileMode')
export const screen1 = uiOption('RigControl', 'screen1')
export const screen2 = uiOption('Debug', 'screen2');
export const screen3 = uiOption('Settings', 'screen3');
export const screen4 = uiOption('Empty', 'screen4');
export const showOnOffButton = uiOption(false,  'onOffButton')
export const showSearchBar = uiOption(true, 'searchBar');
export const showNavigationBar = uiOption(true, 'navigationBar');
export const showPTT = uiOption(true, 'PttButton');
export const showAntennaTuner = uiOption(true, 'AntennaTunerButton');

export const smartPTT = new ConfigVar(
    { default: true
    , path: [ 'cat', 'smartPTT' ]
    });

export const rig_to_usb_enable = new ConfigVar(
    { default: false
    , path: [ 'cat', 'rig_to_usb' ]
    });

export const webserial_enable = new ConfigVar(
    { default: false
    , path: [ 'cat', 'webserial' ]
    });

export const rigctld_enable = new ConfigVar(
    { default: false
    , path: [ 'cat', 'rigctld' ]
    });

export const rigctld_wss = new ConfigVar(
    { default: ''
    , path: [ 'cat', 'rigctld_WSS' ]
    });

export const profileName = new ConfigVar(
    { default: 'DefaultProfile'
    , path: [ 'config', 'name' ]
    });

export const enableCatchAllErrors = new ConfigVar(
    { default: false
    , path: [ 'config' ,'catchAllErrors' ]
    });

export function initCatchAllErrors() {
  if (enableCatchAllErrors.value) {
    window.addEventListener('error', (event) => {
       const { message } = event;
       const stack = event.error?.stack;
       const str = `[JS ERROR] ${message} ${stack}`;
       const msg = {
         src : "catchAllErrors",
	 msg : str
       };
       console.log("catchAllErrors:", str);
       pushError(msg);
    }, true);
    window.addEventListener('unhandledrejection', (event) => {
      console.log("Promise Rejected:", event.reason);
      const msg = {
	src : "Promise Rejected",
	msg : event.toString()
      };
      pushError(msg);
      event.preventDefault();
    });
    console.log("CatchAllErrors handler installed");
  }
};
