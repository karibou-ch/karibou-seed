import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { i18n } from '../common';
import { Config,
         LoaderService,
         UserService,
         User } from 'kng2-core';
import { Location } from '@angular/common';

import { timer } from 'rxjs';
import { debounce } from 'rxjs/operators';


@Component({
  selector: 'kng-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  config: Config;
  user: User;
  isReady: boolean;

  i18n: any = {
    fr: {
      profile_title: 'Membre depuis le',
      profile_order: 'Commandes',
      profile_reminder: 'Alarme',
      profile_account: 'Compte',
      profile_password: 'mot-de-passe',
    },
    en: {
      profile_title: 'Member since',
      profile_order: 'Orders',
      profile_reminder: 'Reminder',
      profile_account: 'Account',
      profile_password: 'Security'
    }
  };

  constructor(
    public  $i18n: i18n,
    private $loader: LoaderService,
    private $user: UserService,
    private $route: ActivatedRoute,
    private $router: Router,
    private $location: Location,

  ) {
    //
    // initialize loader
    const loader = this.$route.snapshot.data.loader;
    //
    // system ready
    this.isReady = true;
    this.user   = loader[1];
    this.config = loader[0];
  }

  doLogout() {
    this.$user.logout().pipe(debounce(() => timer(300)))
      .subscribe(() => this.$router.navigate(['../'], {relativeTo: this.$route}));
  }

  get locale() {
    return this.$i18n.locale;
  }

  ngOnInit() {
  }

}
