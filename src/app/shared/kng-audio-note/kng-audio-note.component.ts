import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { KngAudioRecorderService, RecorderState } from '../kng-audio-recorder.service';
import {UploadClient} from '@uploadcare/upload-client';

import { i18n } from '../../common';
import { AssistantService } from 'kng2-core';

@Component({
  selector: 'kng-audio-note',
  templateUrl: './kng-audio-note.component.html',
  styleUrls: ['./kng-audio-note.component.scss']
})
export class KngAudioNoteComponent implements OnInit {

  private _amount: string;

  @Output() onCartItemAudioLoading = new EventEmitter<boolean>();
  @Output() onCartItemAudioError = new EventEmitter<Error>();
  @Output() onCartItemAudio = new EventEmitter<{src,audio,note?}>();

  cartItemAudioLoading: boolean;
  cartItemAudioError: boolean;
  cartItemAudio: string;
  audioDetected: boolean|undefined;
  audioRecorded: boolean;

  onContextMenu:any;



  @Input() cartItemNote: string;
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
    private $assistant: AssistantService,
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
    // const supportTouchEvent = window.ontouchstart || navigator.maxTouchPoints > 0 || navigator['msMaxTouchPoints'] > 0;
    // const eventName = supportTouchEvent? 'touchend':'mouseup';
    // window.removeEventListener(eventName,this.audioStopAndSave.bind(this));
    this.$audio.closeAudioStream();

  }

  async ngOnInit() {
    //
    // detect end recording

  }

  async checkAudioDetected(url) {
    if(this.audioDetected == undefined && url) {
      this.audioDetected = await this.$audio.detectSound({url});      
    }
  }


  async audioWhisper(base64: string, src: string) {
    const params:any = {body:{audio:base64,whisperOnly:true}};
    params.q = 'whisper';
    this.cartItemNote = '';
    this.$assistant.chat(params).subscribe((content) => {
      this.cartItemNote += content.text;
    },(error) => {
      this.onCartItemAudio.emit({src,audio:base64});
    },()=>{
      this.cartItemNote = this.cartItemNote.trim().replace('**traitement...**','');
      this.onCartItemAudio.emit({src,audio:base64,note:this.cartItemNote});
    });

  }


  async audioRecord($event) {
    if(this.audioIsRecording) {
      return this.audioStopAndSave();
    }
    this.cartItemAudioError = !(await this.$audio.isAudioGranted());


    await this.$audio.startRecording({timeout:15000});    

  }

  async audioStopAndSave() {
    if(!this.audioIsRecording) {
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
      const audio = file.cdnUrl.replace('https:', '');
      this.cartItemAudioLoading = false;

      this.cartItemAudio = audio;
      const audioHtml:HTMLAudioElement = document.querySelector('#audio');
      audioHtml.setAttribute('src', this.cartItemAudio);  

      this.audioWhisper(base64, this.cartItemAudio);
    }catch(error){
      this.cartItemAudioLoading = false;
      this.cartItemAudioError = true;
      this.onCartItemAudioLoading.emit(false);
      this.onCartItemAudioError.emit(error);
    }
  }  

  onClear() {
    this.cartItemAudio = null;
    this.cartItemNote = null;
    this.onCartItemAudio.emit({src:'',audio:this.cartItemAudio,note:this.cartItemNote});

  }

}
