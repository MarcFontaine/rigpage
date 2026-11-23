import * as State from '../state.svelte';
import {webRTCClient} from '../state.svelte';
import GstWebRTCAPI from 'gstwebrtc-api';
import type {Peer} from 'gstwebrtc-api/types/gstwebrtc-api.js';
import ConsumerSession from 'gstwebrtc-api/types/consumer-session.js';
import {type GstWebRTCConfig} from 'gstwebrtc-api/types/config.js';
import { ConfigVar } from '../config/ConfigVar.svelte';

export const metaName = new ConfigVar(
    { default: 'XK852RigControl-1234567'
    , path: [ 'webrtc', 'meta', 'name' ]
    });

export const metaProducerName = new ConfigVar(
    { default: 'XK852-Halle-ingres'
    , path: [ 'webrtc', 'meta', 'producerName' ]
    });

export const reconnectionTimeout = new ConfigVar(
    { default: 30
    , path: [ 'webrtc', 'reconnectionTimeout' ]
    });

export const signalingServer = new ConfigVar(
    { default: 'wss://bla.blub.com:443/ice'
    , path: [ 'webrtc', 'signalingServer' ]
    });

export const IceServerUrls = new ConfigVar(
    { default: 'turn:ice.server.org:3478'
    , path: [ 'webrtc', 'IceServer','urls' ]
    });

export const IceServerUsername = new ConfigVar(
    { default: 'MyUserName'
    , path: [ 'webrtc', 'IceServer', 'username' ]
    });

//export const IceServerCredential = new PasswordConfig(
export const IceServerCredential = new ConfigVar(
    { default: 'MySecret'
    , path: [ 'webrtc', 'IceServer', 'credential' ]
    });

export const enableSink = new ConfigVar(
    { default: false
    , path: [ 'webrtc', 'sink', 'enable' ]
    });

export const enableSource = new ConfigVar(
    { default: false
    , path: [ 'webrtc', 'source', 'enable' ]
    });

function getConfig() : GstWebRTCConfig
{
return {
    "meta": {
       "name": metaName.value,
       "producerName": metaProducerName.value
     },
     "reconnectionTimeout": reconnectionTimeout.value,
     "signalingServerUrl": signalingServer.value,
     "webrtcConfig": {
        "iceServers": [
           {
              "urls": IceServerUrls.value,
              "username": IceServerUsername.value,
              "credential": IceServerCredential.value
            }
          ]
       }
  }
}

export function initRemoteStreams(api: GstWebRTCAPI) {
  const listener = {
    producerAdded: producerAdded,
    producerRemoved: producerRemoved
  };

  api.registerPeerListener(listener);
  for (const producer of api.getAvailableProducers()) {
    listener.producerAdded(producer);
  }
}

function producerRemoved(producer: Peer) {
  const id = producer.id;
  if (webRTCClient.producers[id]) {
    if (webRTCClient.producers[id].session) {
      webRTCClient.producers[id].session.close();
    };
    delete webRTCClient.producers[id]
  }
};

function producerAdded(producer: Peer) {
  const producerId = producer.id
  webRTCClient.producers[producerId] = {
    producer: producer
    , hasSession: false
    , session: null
    , streaming: false
    , hasRemoteControl: false
    };
};

export function startSession(
    state : State.ProducerState,
    videoElement: HTMLVideoElement,
    session: ConsumerSession) {
  state.session = session;

  session.mungeStereoHack = true;

  session.addEventListener("error", (event: Event) => {
    const custom = event as CustomEvent;
    if (state.session === session) {
      console.error(custom.detail);
    }
  });

  session.addEventListener("closed", () => {
    if (state.session === session) {
      videoElement.pause();
      videoElement.srcObject = null;
      state.hasSession = false;
      state.streaming = false;
      state.hasRemoteControl = false;
      state.session = null;
    }
  });

  session.addEventListener("streamsChanged", () => {
    console.log("streamChanged");
    if (state.session === session) {
      const streams = session.streams;
      if (streams.length > 0) {
	videoElement.srcObject = streams[0];
	videoElement.play().catch(() => {});
      }
    }
    const peerConnection: RTCPeerConnection = session.rtcPeerConnection;
    if (peerConnection) {
      console.log("Native PeerConnection erfolgreich gegriffen.");
      peerConnection.ondatachannel = (dcEvent: RTCDataChannelEvent) => {
        handleIncomingDataChannel(dcEvent.channel);
      };
    }
  });

  session.addEventListener("remoteControllerChanged", () => {
    if (state.session === session) {
      const remoteController = session.remoteController;
      if (remoteController) {
	state.hasRemoteControl = true;
	remoteController.attachVideoElement(videoElement);
	remoteController.addEventListener("info", (event:Event) => {
          const custom = event as CustomEvent;
	  console.log("Received info message from producer: ", custom.detail);
	});
      } else {
	state.hasRemoteControl = false;
      }
    }
  });

  state.hasSession = true;
  session.connect();
};

export function initWebRTC() : GstWebRTCAPI {
  const api: GstWebRTCAPI = new GstWebRTCAPI(getConfig());
  return api;
};
/*
function init_data_channel(session:ConsumerSession) {
  session.addEventListener('peerConnectionCreated', (event: Event) => {
  console.log("peerConnectionCreated");
  const customEvent = event as CustomEvent;
  const peerConnection: RTCPeerConnection = customEvent.detail.peerConnection;
  peerConnection.addEventListener('datachannel', (event: RTCDataChannelEvent) => {
    const dataChannel = event.channel;

    if (dataChannel.label === 'meinEigenerKanal') {
      dataChannel.addEventListener('open', () => {
        console.log("Datenkanal ist bereit!");
      });

      dataChannel.addEventListener('message', (messageEvent: MessageEvent) => {
        const daten: string = messageEvent.data;
        console.log("Eigene Nachricht empfangen:", daten);
      });

      dataChannel.addEventListener('close', () => {
        console.log("Datenkanal geschlossen.");
      });
    }
  });
});
}
 */

function handleIncomingDataChannel(dataChannel: RTCDataChannel) {
  console.log(`Datenkanal erkannt! Label: ${dataChannel.label}`);
  dataChannel.send("test ts to rust");
  dataChannel.send("test ts to rust");
  dataChannel.send("test ts to rust");

  dataChannel.addEventListener('open', () => {
    console.log("Kanal ist OFFEN. Bereit zum Senden!");
  });
  dataChannel.addEventListener('message', (messageEvent: MessageEvent) => {
    if (typeof messageEvent.data === 'string') {
      console.log(`Nachricht erhalten:`, messageEvent.data);
    }
  });
  dataChannel.addEventListener('close', () => {
        console.log("Kanal geschlossen.");
  });
}

/*
function sendMessageToGStreamer(payload: string) {
  // Sicherheitscheck: Ist der Kanal initialisiert und offen?
  if (activeDataChannel && activeDataChannel.readyState === 'open') {
    // Nachricht übermitteln (kann String, ArrayBuffer oder JSON sein)
    activeDataChannel.send(payload);
    console.log("Nachricht gesendet:", payload);
  } else {
    console.warn("Senden fehlgeschlagen: Datenkanal ist nicht offen oder nicht bereit.",
                 activeDataChannel?.readyState);
  }
}
*/
