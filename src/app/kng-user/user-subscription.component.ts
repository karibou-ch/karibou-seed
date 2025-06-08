import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { User } from 'kng2-core';
import { i18n } from '../common';

@Component({
  selector: 'kng-user-subscription',
  templateUrl: './user-subscription.component.html',
  styleUrls: ['./user-subscription.component.scss']
})
export class UserSubscriptionComponent implements OnInit {
  isReady = false;
  user: User;
  config: any;

  i18n: any = {
    fr: {
      title: 'Mon abonnement'
    },
    en: {
      title: 'My subscription'
    }
  };

  constructor(
    private $i18n: i18n,
    private route: ActivatedRoute
  ) {
    const loader = this.route.snapshot.data.loader;
    this.user   = loader[1];
    this.config = loader[0];
  }

  ngOnInit() {
    this.isReady = true;
  }

  get locale() {
    return this.$i18n.locale;
  }
}
