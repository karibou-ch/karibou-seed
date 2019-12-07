import { Component, OnInit } from '@angular/core';
import { UserService } from 'kng2-core';
import { i18n } from '../common';

@Component({
  selector: 'app-kng-server-error-found',
  templateUrl: './kng-server-error-found.component.html',
  styleUrls: ['./kng-server-error-found.component.scss']
})
export class KngServerErrorFoundComponent implements OnInit {

  constructor(
    public $i18n: i18n,
    public $user: UserService
  ) {

  }

  ngOnInit() {
    this.$user.me().subscribe(() => {
      // window.location.href='/';
    });
  }

}
