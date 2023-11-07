import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { i18n } from '../common';
import { Config,
         LoaderService,
         UserService,
         User, 
         Order} from 'kng2-core';
import { Location } from '@angular/common';

import { debounceTime } from 'rxjs/operators';


@Component({
  selector: 'kng-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  config: Config;
  user: User;
  isReady: boolean;
  order:Order;
  menuAction:string;

  i18n: any = {
    fr: {
      profile_title: 'Membre depuis le',
      profile_order: 'Commandes',
      profile_invoices: 'Factures',
      profile_reminder: 'Notification',
      profile_account: 'Compte',
      profile_password: 'Sécurité',
    },
    en: {
      profile_title: 'Member since',
      profile_order: 'Orders',
      profile_invoices: 'Bills',
      profile_reminder: 'Reminder',
      profile_account: 'Account',
      profile_password: 'Security'
    }
  };

  constructor(
    public  $i18n: i18n,
    private $user: UserService,
    private $route: ActivatedRoute,
    private $router: Router
  ) {
    //
    // initialize loader
    const loader = this.$route.snapshot.data.loader;
    console.log('--',this.$route.snapshot.data)
    //
    // system ready
    this.isReady = true;
    this.user   = loader[1];
    this.config = loader[0];
    this.order = loader[2];
    this.menuAction = 'orders';
  }

  doLogout() {
    this.$user.logout().pipe(debounceTime(600))
      .subscribe(() => this.$router.navigate(['../'], {relativeTo: this.$route}));
  }

  get locale() {
    return this.$i18n.locale;
  }

  get hasInvoiceMethod() {
    return this.user.payments.some(payment => payment.issuer == 'invoice');
  }

  ngOnInit() {
  }

}
