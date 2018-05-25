import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import {
  ProductService,
  Product,
  LoaderService,
  User,
  Category,
  CategoryService,
  config
} from 'kng2-core';

@Component({
  selector: 'kng-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {

  isReady: boolean = false;
  config: any;
  products: Product[] = [];
  password: string;
  user: User;
  category: {
    slug: string;
    categories: Category[];
    current: Category;
    similar: Category[];
  };

  options = {
    available: true,
    status: true
  };

  constructor(
    private $loader: LoaderService,
    private $product: ProductService,
    private $category: CategoryService,
    private $route: ActivatedRoute
  ) {
    this.category = {
      slug: null,
      categories: [],
      current: null,
      similar: []
    }

    let loader = this.$route.snapshot.data.loader;
    this.config = loader[0];
    this.user = loader[1];
    this.category.categories = loader[2];
  }

  ngOnInit() {
    this.isReady = true;
    this.category.slug = this.$route.snapshot.params['category'];

    //
    // this should not happends
    if (!this.category.slug) {
      return;
    }
    this.category.current = this.category.categories.find(cat => cat.slug === this.category.slug);
    this.category.similar = this.category.categories
      .filter(cat => cat.group === this.category.current.group && cat.slug !== this.category.slug)
      .sort(cat => cat.weight);

    this.filterProduct();
  }

  loadProducts() {
    this.$product.select(this.options).subscribe((products: Product[]) => {
      this.products = products.sort();
    });
  }

  filterProduct() {
    this.$product.findByCategory(this.category.slug, this.options).subscribe((products: Product[]) => {
      this.products = products.sort();
    });
  }

  loadLovedProduct() {
    this.$product.findLove().subscribe((products: Product[]) => {
      this.products = products.sort();
    });
  }


}
