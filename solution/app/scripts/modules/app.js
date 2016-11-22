/*
Copyright 2016 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

//jshint esversion: 6

import Cart from 'cart';
import LocalStorage from 'local-storage';
import CartView from 'cart-view';
import ShopView from 'shop-view';
import PaymentView from 'payment-view';
import HeaderController from 'header-controller';
import {products} from 'products';
import {replaceLocationHash} from 'url-tools';

export default class App {

  constructor() {
    this._storage = new LocalStorage();
    this._cart = new Cart(this._storage, this._cartChanged.bind(this));
    this._cartView = new CartView(this._cart);
    this._shopView = new ShopView(this._cart);
    this._paymentView = new PaymentView(this._cart);
    this._header = new HeaderController();
    this._hashChangeListener = this._handleHashChange.bind(this);
  }

  install() {
    window.addEventListener('hashchange', this._hashChangeListener);
    this._shopView.install();
    this._cartView.install();
    this._paymentView.install();
  }

  uninstall() {
    window.removeEventListener('hashchange', this._hashChangeListener);
  }

  // Manage element visibility (hide the cart when store is selected and vice versa)
  set selection(sel) {
    switch(sel) {
      case 'shop':
      case 'cart':
        this._header.selection = sel;
        this._shopView.visible = sel == 'shop';
        this._cartView.visible = sel != 'shop';
        this._paymentView.visible = false;
        break;

      case 'pay':
        this._header.selection = 'cart';
        this._cartView.visible = true;
        this._paymentView.visible = true;
        break;
    }
    // TODO Do we need a case for the confirmation display?
  }

  run() {
    replaceLocationHash('shop'); // Set window.location to end in #shop
    this._cart.load();
    this._shopView.render();
    this._cartView.render();
    this._updateCartCountDisplay();
    this.selection = 'shop';

    // TODO pick up delete icon, possible add icon
  }

  // Pop up a user notification
  showToast(message) {
    var notification = document.getElementById('snackbar');
    // This depends on the MDL script which he unit tests don't have
    if (notification && notification.MaterialSnackbar) {
      notification.MaterialSnackbar.showSnackbar({message: (message)});
    }
  }

  // Handle hashChange, manage history (#store or #cart, maybe #pay)
  _handleHashChange(event) {
    if (!event.newURL) return;
    let index = event.newURL.lastIndexOf('#');
    if (index < 0) return;
    let sel = event.newURL.substr(index+1);
    this.selection = sel;
  }

  _cartChanged(details) {
    if (details.action == 'load') return; // save would be redundant
    if (details.action == 'add' || details.action == 'change') {
      this.showToast('Cart updated');
    }
    this._updateCartCountDisplay();
    this._cart.save();
  }

  _updateCartCountDisplay() {
    this._header.count = this._cart.count;
  }
  // Testing hooks
  set headerController(obj) {
    this._header = obj;
  }

  get cart() {
    return this._cart;
  }

  get storage() {
    return this._storage;
  }

}
