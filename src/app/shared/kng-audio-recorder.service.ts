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
