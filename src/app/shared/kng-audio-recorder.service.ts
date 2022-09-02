import { EventEmitter, Injectable } from '@angular/core';

declare var MediaRecorder: any;

@Injectable({
  providedIn: 'root'
})
export class KngAudioRecorderService {

  private _isSafari: boolean = false;
  private chunks: Array<any> = [];
  protected recorderEnded = new EventEmitter();
  public recorderError = new EventEmitter<ErrorCase>();
  // tslint:disable-next-line
  private _recorderState = RecorderState.INITIALIZING;
  private _recordTime = 0;

  constructor() {
    this._isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  }

  private recorder: any;


  private static guc() {
    return navigator.mediaDevices.getUserMedia({audio: true});
  }

  get isIOS(){
    return this._isSafari;
  }

  get recordTime(){
    if (!this._recordTime){
      return 0;
    }
    return ((Date.now() - this._recordTime)/1000)|0;
  }

  getUserContent() {
    return KngAudioRecorderService.guc();
  }

  startRecording() {
    if (this._recorderState === RecorderState.RECORDING) {
      this.recorderError.emit(ErrorCase.ALREADY_RECORDING);
    }
    if (this._recorderState === RecorderState.PAUSED) {
      this._recordTime = Date.now();
      this.resume();
      return;
    }
    this._recorderState = RecorderState.INITIALIZING;
    KngAudioRecorderService.guc().then((mediaStream) => {
      // record iOS = audio/mp4;codec=vp9
      // record Chrome/FF = audio/webm;codec=vp9
      this._recordTime = Date.now();
      this.recorder = new MediaRecorder(mediaStream);
      this._recorderState = RecorderState.INITIALIZED;
      this.addListeners();
      this.recorder.start();
      this._recorderState = RecorderState.RECORDING;
    });
  }

  pause() {
    if (this._recorderState === RecorderState.RECORDING) {
      this.recorder.pause();
      this._recorderState = RecorderState.PAUSED;
    }
  }

  resume() {
    if (this._recorderState === RecorderState.PAUSED) {
      this._recorderState = RecorderState.RECORDING;
      this.recorder.resume();
    }
  }

  stopRecording(outputFormat: OutputFormat) {
    this._recorderState = RecorderState.STOPPING;
    this._recordTime = 0;

    return new Promise((resolve, reject) => {
      this.recorderEnded.subscribe((blob) => {
        this._recorderState = RecorderState.STOPPED;
        if (outputFormat === OutputFormat.WEBM_BLOB) {
          resolve(blob);
        }
        if (outputFormat === OutputFormat.WEBM_BLOB_URL) {
          const audioURL = URL.createObjectURL(blob);
          resolve(audioURL);
        }
      }, _ => {
        this.recorderError.emit(ErrorCase.RECORDER_TIMEOUT);
        reject(ErrorCase.RECORDER_TIMEOUT);
      });
      this.recorder.stop();
    }).catch(() => {
      this.recorderError.emit(ErrorCase.USER_CONSENT_FAILED);
    });
  }

  getRecorderState() {
    return this._recorderState;
  }

  private addListeners() {
    this.recorder.ondataavailable = this.appendToChunks;
    this.recorder.onstop = this.recordingStopped;
  }

  private appendToChunks = (event: any) => {
    this.chunks.push(event.data);
  };
  private recordingStopped = (event: any) => {
    const blob = new Blob(this.chunks, {type: this.isIOS?'audio/mp4;codec=vp9':'audio/webm;codec=vp9'});
    this.chunks = [];
    this.recorderEnded.emit(blob);
    this.clear();
  };

  private clear() {
    this.recorder = null;
    this.chunks = [];
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
