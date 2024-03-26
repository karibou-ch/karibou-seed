import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { KngAudioRecorderService, RecorderState } from '../kng-audio-recorder.service';
import {UploadClient} from '@uploadcare/upload-client';

import { i18n } from '../../common';

@Component({
  selector: 'kng-audio-note',
  templateUrl: './kng-audio-note.component.html',
  styleUrls: ['./kng-audio-note.component.scss']
})
export class KngAudioNoteComponent implements OnInit {

  private _amount: string;

  @Output() onCartItemAudioLoading = new EventEmitter<boolean>();
  @Output() onCartItemAudioError = new EventEmitter<Error>();
  @Output() onCartItemAudio = new EventEmitter<string>();

  cartItemAudioLoading: boolean;
  cartItemAudioError: boolean;
  cartItemAudio: string;
  cartItemNote: string;
  audioDetected: boolean|undefined;
  audioRecorded: boolean;

  onContextMenu:any;



  @Input() filename:string;
  @Input() set amount(value: number){
    this._amount = (value).toFixed(2); 
  };
  @Input() key: string;
  @Input() set src(url: string){
    this.cartItemAudio = url;
    if(url) {
     this.checkAudioDetected(url);
    }
  }



  constructor(
    private $audio: KngAudioRecorderService,
    public $i18n: i18n,
  ) { 
    this.audioDetected = undefined;
    this.$audio.recorderError.subscribe(error => {
      //
      // record error , display user message
      this.cartItemAudioError = true;
    })

  }

  get amount(){
    return parseFloat(this._amount);
  }  
  get audioIsRecording() {
    const state = this.$audio.state;
    return state == RecorderState.RECORDING|| state == RecorderState.PAUSED;
  }

  get hasNoAudio() {
    return (this.audioDetected == undefined)
  }
  
  get label() {
    return this.$i18n.label();
  }


  ngOnDestroy() {
    const supportTouchEvent = window.ontouchstart || navigator.maxTouchPoints > 0 || navigator['msMaxTouchPoints'] > 0;
    const eventName = supportTouchEvent? 'touchend':'mouseup';
    window.removeEventListener(eventName,this.audioStopAndSave.bind(this));
  }

  async ngOnInit() {
    //
    // detect end recording
    const supportTouchEvent = window.ontouchstart || navigator.maxTouchPoints > 0 || navigator['msMaxTouchPoints'] > 0;
    const eventName = supportTouchEvent? 'touchend':'mouseup';
    window.addEventListener(eventName,this.audioStopAndSave.bind(this));


  }

  async checkAudioDetected(url) {
    if(this.audioDetected == undefined && url) {
      this.audioDetected = await this.$audio.detectSound({url});      
    }
  }


  async audioRecord($event) {
    if(this.audioIsRecording) {
      return;
    }
    this.cartItemAudioError = !(await this.$audio.isAudioGranted());


    await this.$audio.startRecording(15000);    

  }

  async audioStopAndSave() {
    if(!this.audioIsRecording||this.$audio.recordTime<1) {
      return;
    }
    try{

      const {blob, base64} = await this.$audio.stopRecording();
      this.cartItemAudioLoading = true;
      this.onCartItemAudioLoading.emit(true);

      //
      // detect sound on audio
      this.audioDetected = await this.$audio.detectSound({blob});

      //
      // should exit 
      if(!this.audioDetected){
        this.cartItemAudioLoading = false;
        this.onCartItemAudioLoading.emit(false);
        return;
      }

      //const audio = blob as string;
      const client = new UploadClient({ publicKey: this.key});
      const options:any = {};
      this.filename && (options.fileName = this.filename);      

      //
      // upload file if audio is ok
      const file = await client.uploadFile((blob as any),options);
      this.onCartItemAudioLoading.emit(false);
      const url = file.cdnUrl.replace('https:', '');
      this.cartItemAudioLoading = false;

      this.cartItemAudio = url;
      const audio:HTMLAudioElement = document.querySelector('#audio');
      audio.setAttribute('src', this.cartItemAudio);  

      this.onCartItemAudio.emit(url);

    }catch(error){
      this.cartItemAudioLoading = false;
      this.cartItemAudioError = true;
      this.onCartItemAudioLoading.emit(false);
      this.onCartItemAudioError.emit(error);
    }
  }  
}
