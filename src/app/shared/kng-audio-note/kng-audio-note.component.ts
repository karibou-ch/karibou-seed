import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { KngAudioRecorderService, OutputFormat, RecorderState } from '../kng-audio-recorder.service';
import {UploadClient} from '@uploadcare/upload-client';

import { i18n } from '../../common';

@Component({
  selector: 'kng-audio-note',
  templateUrl: './kng-audio-note.component.html',
  styleUrls: ['./kng-audio-note.component.scss']
})
export class KngAudioNoteComponent implements OnInit {

  @Output() onCartItemAudioLoading = new EventEmitter<boolean>();
  @Output() onCartItemAudioError = new EventEmitter<Error>();
  @Output() onCartItemAudio = new EventEmitter<string>();

  cartItemAudioLoading: boolean;
  cartItemAudioError: boolean;
  cartItemAudio: string;
  cartItemNote: string;

  @Input() key: string;
  @Input() set src(url: string){
    this.cartItemAudio = url;
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

  }

  ngOnDestroy(): void {

  }

  ngOnInit(): void {
  }

  get audioIsRecording() {
    const state = this.$audio.getRecorderState();
    return state == RecorderState.RECORDING|| state == RecorderState.PAUSED;
  }

  audioToggle() {
    const state = this.$audio.getRecorderState();
    if(state == RecorderState.RECORDING){
      this.$audio.pause();
    }
    if(state == RecorderState.PAUSED){
      this.$audio.resume();
    }
    if(state == RecorderState.STOPPED){
      this.$audio.startRecording();
    }
  }
  audioRecord($event) {
    $event.preventDefault();
    if(this.audioIsRecording) {
      return;
    }
    this.$audio.startRecording();
  }

  audioStopAndSave() {
    if(!this.audioIsRecording||this.$audio.recordTime<1) {
      return;
    }
    const format = OutputFormat.WEBM_BLOB;
    this.$audio.stopRecording(format).then((output) => {
      this.cartItemAudioLoading = true;
      this.onCartItemAudioLoading.emit(true);
      const audio = output as string;
      const client = new UploadClient({ publicKey: this.key});
      client.uploadFile(audio).then(file => {
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
