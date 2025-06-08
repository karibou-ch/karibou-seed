import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { User, UserService } from 'kng2-core';
import { KngNavigationStateService } from '../navigation.service';
import { i18n } from '../i18n.service';

@Component({
  selector: 'kng-wallet',
  templateUrl: './kng-wallet.component.html',
  styleUrls: ['./kng-wallet.component.scss']
})
export class KngWalletComponent implements OnChanges {
  @Input() user: User;
  balance = 0;
  applyCode: string;
  i18n: any = i18n;
  locale = 'fr';
  llabel: any = i18n[this.locale]?.wallet || { title_code: 'Code', title_wallet: 'Portefeuille' };

  constructor(
    private $user: UserService,
    private navState: KngNavigationStateService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.user && changes.user.currentValue) {
      this.balance = this.user.balance || 0;
    }
  }

  onRedeem(){
    if (!this.applyCode) {
      return;
    }
    this.$user.applyCode(this.applyCode).subscribe(user => {
      this.user = user;
      this.balance = user.balance || 0;
      this.applyCode = "";
    },err => {
      alert(err.error||err.message)
    })
  }
}
