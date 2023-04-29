import { EventEmitter, Injectable } from '@angular/core';

declare var MediaRecorder: any;

@Injectable({
  providedIn: 'root'
})
export class KngAudioRecorderService {

  public recorderError = new EventEmitter<ErrorCase>();

  // tslint:disable-next-line
  private _recorderState = RecorderState.INITIALIZING;
  private _recordTime = 0;

  constructor() {
  }

  private recorder: any;


  private static guc() {
    return navigator.mediaDevices.getUserMedia({audio: true});
  }

  
  get recordTime(){
    if (!this._recordTime){
      return 0;
    }
    return ((Date.now() - this._recordTime)/1000)|0;
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

    let analysis = {
      sum:0,
      max:0
    }
    floats32.forEach(amplitude => {
      analysis.sum += (amplitude * amplitude);      
      analysis.max = Math.max(analysis.max,amplitude);
    })

    const volume = Math.sqrt(analysis.sum / floats32.length);

    console.log('---- detectSound',volume,analysis)
    return volume>0.01;
  }

  
  async startRecording() {
    if (this._recorderState === RecorderState.RECORDING) {
      this.recorderError.emit(ErrorCase.ALREADY_RECORDING);
    }

    this._recordTime = Date.now();
    this._recorderState = RecorderState.INITIALIZED;

    const module = await import('mic-recorder-to-mp3');
    this.recorder = new module.default({
      startRecordingAt:0,
      bitRate: 190
    });

    await this.recorder.start();
    this._recorderState = RecorderState.RECORDING;
  }


  async stopRecording(outputFormat: OutputFormat) {
    this._recorderState = RecorderState.STOPPING;
    this._recordTime = 0;
    try{
      const [buffer, blob]:[Int8Array,any] = await this.recorder.stop().getMp3();

      return blob;
    }catch(err) {
      this.clear();
      this.recorderError.emit(ErrorCase.USER_CONSENT_FAILED);
    }
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
