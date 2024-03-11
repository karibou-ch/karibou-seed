import { EventEmitter, Injectable } from '@angular/core';
import { i18n } from '../common';

declare var MediaRecorder: any;

@Injectable({
  providedIn: 'root'
})
export class KngAudioRecorderService {

  public recorderError = new EventEmitter<ErrorCase>();

  // tslint:disable-next-line
  private _recorderState = RecorderState.INITIALIZING;
  private _recordTime = 0;
  private _avgVolume = 0;
  private _stopCallback = (()=>{});

  constructor(
    private $i18n:i18n
  ) {
  }

  private recorder: any;


  private static guc() {
    return navigator.mediaDevices.getUserMedia({audio: true});
  }


  
  get recordTime(){
    if (!this._recordTime){
      return 0;
    }
    return parseFloat(((Date.now() - this._recordTime)/1000).toFixed(2));
  }

  async preload(){
    await import('mic-recorder-to-mp3');
  }

  createAudioMeter(stream) {

    const LIMIT = 9;
    let autoStop = 0;
    // Create a new volume meter and connect it.
    const microphone = this.recorder.context.createMediaStreamSource(stream);

    // Set up Web Audio API to process data from the media stream (microphone).
    const meter = this.recorder.context.createScriptProcessor(8192,1,1);
    meter.onaudioprocess = (event)=> {
      const buf = event.inputBuffer.getChannelData(0);
      const detected = this.detectAudioVolume(buf);
      if(detected) {
        autoStop = 0; 
        return
      }

      autoStop++;
      if(autoStop>LIMIT) {
        meter.disconnect();
        meter.onaudioprocess = null;
        this._stopCallback();
      }

    };
  
    // this will have no effect, since we don't copy the input to the output,
    // but works around a current Chrome bug.
    meter.connect(this.recorder.context.destination);  
    microphone.connect(meter);  
  }

  detectAudioVolume(floats32:Float32Array) {
    const analysis = {
      sum:0,
      max:0
    }
    floats32.forEach(amplitude => {
      analysis.sum += (amplitude * amplitude);      
      analysis.max = Math.max(analysis.max,amplitude);
    })

    this._avgVolume = Math.sqrt(analysis.sum / floats32.length)/2 + this._avgVolume/2;
    if((this._avgVolume<=0.01))console.log('---- silence',this._avgVolume.toFixed(3))
    return this._avgVolume>0.01;
  }
  //
  // ensure that recorded mp3 contains audio
  // - https://stackoverflow.com/questions/71103807/detect-silence-in-audio-recording
  // - https://stackoverflow.com/questions/61050582/can-you-attach-an-audiocontext-analyser-to-an-html-audio-node-with-a-src-already
  async detectSound(content) {

    const AudioCtx = (window.AudioContext || (<any>window).webkitAudioContext);
    const audioCtx:AudioContext = new AudioCtx();

    const blobUrl = (content.blob)?URL.createObjectURL(content.blob):content.url;
    const blob = (content.url)? await  fetch(content.url):content.blob;
    const audioBuffer = await audioCtx.decodeAudioData(await blob.arrayBuffer());

    const floats32 = audioBuffer.getChannelData(0);

    return this.detectAudioVolume(floats32);
  }

  async isAudioGranted() {
    if(!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
      return false
    }
    // const permission = await navigator.permissions.query({ name: 'microphone' });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    } catch (err) {
      // Errors when accessing the device
      return false
    }    
    return true;
  }


  
  async startRecording(stopCallback?) {    
    if (this._recorderState === RecorderState.RECORDING) {
      this.recorderError.emit(ErrorCase.ALREADY_RECORDING);
    }

    try{
      this._stopCallback = stopCallback || (() => {});
      this._recordTime = Date.now();
      this._recorderState = RecorderState.RECORDING;  
  
      const module = await import('mic-recorder-to-mp3');
      this.recorder = new module.default({
        startRecordingAt:0,
        encodeAfterRecordCheck:true
      });
  
      const stream = await this.recorder.start();
      this._recorderState = RecorderState.RECORDING;  
      this.createAudioMeter(stream);
    }catch(err){
      console.log('---- DBG audio-record',err);
      alert(this.$i18n.label().audio_error)
    }
  }


  async stopRecording(outputFormat: OutputFormat) {
    this._recordTime = 0;
    if(this._recorderState == RecorderState.STOPPING) {
      return;
    }
    this._recorderState = RecorderState.STOPPING;
    try{
      const [buffer, blob]:[Int8Array,any] = await this.recorder.stop().getMp3();

      return blob;
    }catch(err) {
      this.clear();
      this.recorderError.emit(ErrorCase.USER_CONSENT_FAILED);
    }
  }

  //
  // convert audio data to base64
  blobToBase64(blob):Promise<string> {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

  }

  getRecorderState() {
    return this._recorderState;
  }


  private clear() {
    this.recorder = null;
  }
}


export enum OutputFormat {
  WEBM_BLOB_URL,
  WEBM_BLOB,
}

export enum ErrorCase {
  USER_CONSENT_FAILED,
  RECORDER_TIMEOUT,
  ALREADY_RECORDING
}

export enum RecorderState {
  INITIALIZING,
  INITIALIZED,
  RECORDING,
  PAUSED,
  STOPPING,
  STOPPED
}
