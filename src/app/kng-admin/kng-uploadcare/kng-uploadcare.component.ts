import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { config } from 'kng2-core';
import { MdcDialog, MdcDialogRef, MdcSnackbar } from '@angular-mdc/web';

interface UploadcareFile {
  uuid: string;
  original_filename: string;
  size: number;
  mime_type: string;
  is_image: boolean;
  datetime_uploaded: string;
}

//
// Fullscreen popup that lists the project Uploadcare files.
// The secret key never reaches the browser: everything is proxied by karibou-api.
@Component({
  selector: 'kng-uploadcare',
  templateUrl: './kng-uploadcare.component.html',
  styleUrls: ['./kng-uploadcare.component.scss']
})
export class KngUploadcareComponent implements OnInit {
  private headers: HttpHeaders;

  files: UploadcareFile[] = [];
  search = '';
  loading = false;
  total = 0;
  error: string;

  constructor(
    private $http: HttpClient,
    public $dlgRef: MdcDialogRef<KngUploadcareComponent>,
    private $snack: MdcSnackbar
  ) {
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'ngsw-bypass': 'true'
    });
  }

  ngOnInit() {
    this.load();
  }

  get filtered(): UploadcareFile[] {
    const q = (this.search || '').trim().toLowerCase();
    if (!q) {
      return this.files;
    }
    return this.files.filter(f =>
      (f.original_filename || '').toLowerCase().includes(q) ||
      (f.uuid || '').toLowerCase().includes(q)
    );
  }

  load() {
    this.loading = true;
    this.error = null;
    this.$http.get<any>(config.API_SERVER + '/v1/uploadcare/files', {
      params: { limit: '100', ordering: '-datetime_uploaded' },
      headers: this.headers,
      withCredentials: true
    }).subscribe(
      result => {
        this.files = (result && result.results) || [];
        this.total = (result && result.total) || this.files.length;
        this.loading = false;
      },
      err => {
        this.error = (err && err.error && err.error.error) || 'Impossible de charger les images';
        this.loading = false;
        this.$snack.open(this.error, 'OK');
      }
    );
  }

  onDelete(file: UploadcareFile) {
    const ok = window.confirm('Supprimer définitivement "' + (file.original_filename || file.uuid) + '" ?');
    if (!ok) {
      return;
    }
    this.$http.delete(config.API_SERVER + '/v1/uploadcare/files/' + file.uuid, {
      headers: this.headers,
      withCredentials: true
    }).subscribe(
      () => {
        this.files = this.files.filter(f => f.uuid !== file.uuid);
        this.total = Math.max(0, this.total - 1);
        this.$snack.open('Image supprimée', 'OK');
      },
      err => {
        const msg = (err && err.error && err.error.error) || 'La suppression a échoué';
        this.$snack.open(msg, 'OK');
      }
    );
  }

  select(file: UploadcareFile) {
    this.$dlgRef.close(this.cdnUrl(file));
  }

  cdnUrl(file: UploadcareFile): string {
    return 'https://ucarecdn.com/' + file.uuid + '/';
  }

  thumb(file: UploadcareFile): string {
    return 'https://ucarecdn.com/' + file.uuid + '/-/scale_crop/160x160/center/-/quality/lighter/';
  }

  humanSize(bytes: number): string {
    if (!bytes && bytes !== 0) {
      return '';
    }
    if (bytes < 1024) {
      return bytes + ' B';
    }
    const units = ['KB', 'MB', 'GB'];
    let size = bytes / 1024;
    let i = 0;
    while (size >= 1024 && i < units.length - 1) {
      size /= 1024;
      i++;
    }
    return size.toFixed(1) + ' ' + units[i];
  }

  close() {
    this.$dlgRef.close();
  }
}

//
// Thin admin page (route `media`) that opens the gallery as a fullscreen popup.
@Component({
  selector: 'kng-media',
  template: `
    <div class="kng-media-launcher">
      <h3>Bibliothèque d'images</h3>
      <p>Parcourez, recherchez et supprimez les images hébergées sur Uploadcare.</p>
      <button raised mdc-button class="primary" (click)="open()">
        <span class="material-symbols-outlined">photo_library</span>
        <span mdcButtonLabel>Ouvrir la galerie</span>
      </button>
    </div>
  `
})
export class KngMediaComponent {
  constructor(public $dlg: MdcDialog) {}

  open() {
    this.$dlg.open(KngUploadcareComponent, {
      escapeToClose: true,
      clickOutsideToClose: false,
      autoFocus: false
    });
  }
}
