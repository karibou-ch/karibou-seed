import { Component, HostListener, OnInit, OnDestroy, Input, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MdcDialogComponent } from '@angular-mdc/web';

import {
    ProductService,
    Product,
    LoaderService,
    User,
    UserService,
    config
}  from 'kng2-core';
import { window } from 'rxjs/operator/window';


@Component({
    selector: 'kng-product',
    templateUrl: './product.component.html',
    styleUrls: ['./product.component.scss']
})
export class ProductComponent implements OnInit, OnDestroy {

    @Input() sku: number;

    user: User=new User();
    isReady: boolean;
    isDialog: boolean = false;
    config: any;
    product: Product = new Product();
    thumbnail:boolean=false;

    WaitText:boolean=false;
    rootProductPath:string;

    constructor(
        private $route: ActivatedRoute,
        private $loader: LoaderService,
        private $location:Location,
        private $product: ProductService,
        private $router: Router
    ) {
    }

    hasFavorite(product){
        return this.user.hasLike(product)?'favorite':'favorite_border';
    }

    //
    // this component is shared with thumbnail, tiny, and wider product display
    // on init with should now which one is loaded
    ngOnInit() {
        this.$loader.ready().subscribe((loader) => {
            this.isReady = true;
            this.config = loader[0];
            Object.assign(this.user,loader[1]);
            //
            // product action belongs to a shop or a category 
            this.rootProductPath=(this.$route.snapshot.params['shop'])?
                '/shop/'+this.$route.snapshot.params['shop']:'';

            //
            // when display wider 
            if (!this.sku) {
                this.isDialog=true;
                this.sku = this.$route.snapshot.params['sku'];
                document.body.classList.add('mdc-dialog-scroll-lock');        
            }
            
            this.$product.findBySku(this.sku).subscribe(prod => {
                this.product = prod
            })
        });
    }

    ngOnDestroy(){
        if(this.isDialog){
            document.body.classList.remove('mdc-dialog-scroll-lock');
        }
    }

    onEdit(product:Product){

    }

    onClose(closedialog){
        // if(closedialog){
        //     this.dialog.close();
        // }
        setTimeout(()=>{
            this.$location.back()        
        },500)
    }

    getAvailability(product:Product,pos:number){
        if(!product.vendor.available||!product.vendor.available.weekdays){
            return 'radio_button_unchecked';
        }
        return (product.vendor.available.weekdays.indexOf(pos)!==-1)?
            'radio_button_unchecked':'radio_button_checked';
    }

    save(product:Product){

    }
    love(product:Product){
        
    }
}

@Component({
    selector: 'kng-product-thumbnail',
    templateUrl: './product-thumbnail.component.html',
    styleUrls: ['./product-thumbnail.component.scss']
})
export class ProductThumbnailComponent extends ProductComponent {
}

@Component({
    selector: 'kng-product-tiny',
    templateUrl: './product-tiny.component.html',
    styleUrls: ['./product-tiny.component.scss']
})
export class ProductTinyComponent extends ProductComponent {
}

