#
# Karibou marketplace
landing, account, profile
/
/cart/:name
/validate/:uid/:mail
/me
  /login
  /login-or-register
  /login-or-address
  /login-or-payment
  /orders
  /reminder
  /email
  /password

#
# Karibou markets
View and select markets

/store/:store

##
## use market
/store/:store
            /
            /cart/:name ()
            /content/:slug
            /shops
            /shop/:slug
            /:group (home,grocery,drink,cellar,selection,wellness)
                  /products/:sku/:title
                  /category/:category/:child

//
//
// DEPRECATED redirects
products/:sku/:title
products/:sku
shop/:slug
account/login
account/orders
account/reminder
