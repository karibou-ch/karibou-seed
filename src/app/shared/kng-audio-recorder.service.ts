import { EventEmitter, Injectable } from '@angular/core';
import { RecordRTCPromisesHandler } from "recordrtc";


export interface RecordedAudioOutput {
  blob: Blob;
  title: string;
}


export enum ErrorCase {
  USER_CONSENT_FAILED,
  RECORDER_TIMEOUT,
  ALREADY_RECORDING
}

export enum RecorderState {
  RECORDING = "RECORDING",
  SILENCE = "SILENCE",
  PAUSED = "PAUSED",
  STOPPED = "STOPPED"
}


@Injectable({
  providedIn: 'root'
})
export class KngAudioRecorderService {

  public recorderError = new EventEmitter<ErrorCase>();
  public recorderState = new EventEmitter<RecorderState>();

  // tslint:disable-next-line
  private _recorderState:RecorderState;
  private _recordTime = 0;
  private _avgVolume = 0;
  private _recordTimeout:any = 0;

  private stream;
  private recorder: any;


  constructor(
  ) {
    this._recorderState = RecorderState.STOPPED;
  }
  
  get state() {
    return this._recorderState;
  }

  get recordTime(){
    if (!this._recordTime){
      return 0;
    }
    return parseFloat(((Date.now() - this._recordTime)/1000).toFixed(2));
  }


  closeAudioStream() {
    if (!this.stream || !this.stream.active) {
      return;
    }

    if(this.recorder) {
      this.recorder.stopRecording();
    }

    this.stream.getTracks().forEach(function(track) {
      track.stop();
      console.log('---- audio stream closed');
    });

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

    // try {
    //   const stream = await navigator.mediaDevices.getUserMedia({audio: true});
    // } catch (err) {
    //   // Errors when accessing the device
    //   return false
    // }    
    return true;
  }

  async getAudioStream() {
    if (!this.stream || !this.stream.active) {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err) {
        //
        // permission not allowed
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          return alert("Vous avez refusé l'accès au microphone. Veuillez aller dans les paramètres - en haut à gauche - de votre navigateur pour l'activer manuellement.");          
        }        
        console.error("Error accessing audio stream:", err);
        throw err;
      }
    }
    return this.stream;
  }
  
  async startRecording(options:any = {}) {    
    if (this._recorderState == RecorderState.RECORDING) {
      this.recorderError.emit(ErrorCase.ALREADY_RECORDING);
      return;
    }

    try{
      this._recordTime = Date.now();
      this._recorderState = RecorderState.RECORDING;  
  
      // const module = await import('mic-recorder-to-mp3');
      // this.recorder = new module.default({
      //   startRecordingAt:0,
      //   encodeAfterRecordCheck:true
      // });
      this.stream = await this.getAudioStream();

      const media = window['MediaRecorder'];
      let mimeType:any = 'audio/webm';
      if (media.isTypeSupported('audio/webm; codecs=opus')) { //opus as preferred codec
        mimeType='audio/webm; codecs=opus';
      } else if (media.isTypeSupported('audio/webm; codec=opus')) { //opus as preferred codec
        mimeType='audio/webm; codec=opus';
      } else  if (media.isTypeSupported('audio/webm')) {
        mimeType='audio/webm';
      } else if (media.isTypeSupported('audio/mp4;codec=mp3')) { //mp4 for IOS
        mimeType='audio/mp4; codec=mp3';
      } else if (media.isTypeSupported('audio/mp4')) { //mp4 for IOS
        mimeType='audio/mp4';
      } else {
        console.error("no suitable mimetype found for this device");
      }

      // DBG stuffs for live 
      // window.MIMETYPE='audio/mpeg; codecs="mp3"'
      mimeType = window['MIMETYPE']|| mimeType;
      const rtcpOpts:any = {
        type: 'audio',
        debugger:false,
        mimeType,
        numberOfAudioChannels: 1,
      }

      //
      // needs chunks of audio
      if(options.timeSlice) {
        rtcpOpts.timeSlice = options.timeSlice;
        rtcpOpts.ondataavailable = async function(blob) {
          const base64 = await this.blobToBase64(blob);
          options.onChunk({blob,base64});
        }
      }
      //
      // https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/recordrtc/index.d.ts
      this.recorder = new RecordRTCPromisesHandler(this.stream,rtcpOpts);      
    
      //
      // use hark for silence detection,
      // github.com/otalk/hark
      // www.webrtc-experiment.com/hark.js
      await this.recorder.startRecording();

      this.recorderState.emit(this._recorderState);

      if(options.timeout) {
        this._recordTimeout = setTimeout(()=> {
          this.recorderState.emit(RecorderState.SILENCE);
        },options.timeout);
      }
      if(options.stopOnSilence) {
        this.stopOnSilence(this.stream);
      }

    }catch(err){
      console.log('---- DBG audio-record',err);
      this.clear();
      throw err;
    }
  }


  //
  // INFO: check browser security "worker-src blob: *;"
  async stopRecording() {
    clearTimeout(this._recordTimeout);    
    this._recordTime = 0;
    this._recordTimeout = 0;
    let url,blob,base64;
    if(this._recorderState == RecorderState.STOPPED) {
      return {blob, base64};
    }
    try{
      this._recorderState = RecorderState.STOPPED;
      // this.stream.getAudioTracks().forEach((track: any) => track.stop());
      url = await this.recorder.stopRecording();
      blob = await this.recorder.getBlob();
      base64= await this.recorder.getDataURL();
      return {blob, base64};
    }catch(err:any){
      this.recorderError.emit(err);
    }finally{
      this.recorderState.emit(this._recorderState);
      this.clear();
      return {blob, base64};
    }
  }


  stopOnSilence(stream, options?) {
    options = options || {};
    const AudioCtx = (window.AudioContext || (<any>window).webkitAudioContext);
    const audioContext00:AudioContext = new AudioCtx();

    const maxVolume = function(analyser, fftBins) {
      var maxVolume = -Infinity;
      analyser.getFloatFrequencyData(fftBins);

      for (var i = 4, ii = fftBins.length; i < ii; i++) {
          if (fftBins[i] > maxVolume && fftBins[i] < 0) {
              maxVolume = fftBins[i];
          }
      }

      return maxVolume;
    }

    const smoothing = (options.smoothing || 0.1),
          threshold = options.threshold||-50,
          rate = 200,
          history = 12;

    let analyser = audioContext00.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = smoothing;



    // Create a new volume meter and connect it.
    const microphone = audioContext00.createMediaStreamSource(stream);
    microphone.connect(analyser);

    let speaking = false;
    let fftBins = new Float32Array(analyser.fftSize);
    const speakingHistory = new Array(history).fill(0);



    // Set up Web Audio API to process data from the media stream (microphone).
    const process = ()=>{
      if(this.state == RecorderState.STOPPED) {
        return;
      }

      const volume = maxVolume(analyser,fftBins);
      let history = 0;
      if (volume > threshold) {
          // trigger quickly, short history
          for (var i = speakingHistory.length - 3; i < speakingHistory.length; i++) {
              history += speakingHistory[i];
          }
          if (history >= 2) {
              speaking = true;
              console.log('speaking');
          }
      } else if (volume < threshold && speaking) {
          for (var j = 0; j < speakingHistory.length; j++) {
              history += speakingHistory[j];
          }
          if (history === 0) {
              speaking = false;
              microphone.disconnect();
              analyser.disconnect();
              console.log('stopped_speaking');
              this.recorderState.emit(RecorderState.SILENCE);
              return;
          }
      }
      
      speakingHistory.shift();
      speakingHistory.push(((volume > threshold)?1:0));      
      setTimeout(process,rate);
    }
    process();
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


  private clear() {    
    this.recorder = null;
    this._recorderState = RecorderState.STOPPED;
    this.closeAudioStream();
  }

}

