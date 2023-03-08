import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { KngAudioRecorderService, OutputFormat, RecorderState } from '../kng-audio-recorder.service';
import {UploadClient, base} from '@uploadcare/upload-client';

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

  onContextMenu:any;

  @Input() filename:string;
  @Input() set amount(value: number){
    this._amount = (value).toFixed(2); 
  };
  @Input() key: string;
  @Input() set src(url: string){
    this.cartItemAudio = url;
  }

  get amount(){
    return parseFloat(this._amount);
  }

  constructor(
    private $audio: KngAudioRecorderService,
    public $i18n: i18n,
  ) { 

    this.$audio.recorderError.subscribe(error => {
      //
      // record error , display user message
      this.cartItemAudioError = true;
    })
    this.onContextMenu = window.oncontextmenu;
    //
    // avoid context menu on full application (but only needed on audio record)
    window.oncontextmenu = function(event) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    };    

  }

  ngOnDestroy(): void {
    window.oncontextmenu = this.onContextMenu;

  }

  ngOnInit(): void {
  }

  get audioIsRecording() {
    const state = this.$audio.getRecorderState();
    return state == RecorderState.RECORDING|| state == RecorderState.PAUSED;
  }
  audioRecord($event) {
    $event.preventDefault();
    if(this.audioIsRecording) {
      return;
    }
    this.$audio.startRecording();
  }

  async audioStopAndSave() {
    if(!this.audioIsRecording||this.$audio.recordTime<1) {
      return;
    }
    const format = OutputFormat.WEBM_BLOB;
    this.$audio.stopRecording(format).then((output) => {
      console.log('---DBG stop',output)
      this.cartItemAudioLoading = true;
      this.onCartItemAudioLoading.emit(true);
      //const audio = output as string;
      const client = new UploadClient({ publicKey: this.key});
      const options:any = {};
      this.filename && (options.fileName = this.filename);
      client.uploadFile(output,options).then(file => {
        this.onCartItemAudioLoading.emit(false);
        const url = file.cdnUrl.replace('https:', '');
        this.cartItemAudioLoading = false;
        this.cartItemAudio = url;
        this.onCartItemAudio.emit(url);
        document.querySelector('#audio').setAttribute('src', this.cartItemAudio);
      }).catch(error=>{
        this.cartItemAudioError = true;
        this.cartItemAudioLoading = false;
        this.onCartItemAudioLoading.emit(false);
        this.onCartItemAudioError.emit(error);
      });
    }).catch(error => {
      this.cartItemAudioLoading = false;
      this.cartItemAudioError = true;
      this.onCartItemAudioError.emit(error);
    });
  }  
}
