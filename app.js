const express = require('express');
const ejs = require('ejs');
const paypal = require('paypal-rest-sdk');
const keys = require('./config/keys')

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': keys.client_id,
    'client_secret': keys.client_secret
});

const app = express();

// EJS middleware
app.set('view engine', 'ejs');


//Index Route
app.get('/', (req, res) => {
    res.render('index');
});

// Pay route
app.post('/pay', (req, res) => {
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://locahlhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "SF Giants Hat",
                    "sku": "001",
                    "price": "20.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "20.00"
            },
            "description": "Hat from the best in the Bay."
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
            for(let i=0; i < payment.links.length; i++){
                if(payment.links[i].rel === 'approval_url'){
                    res.redirect(payment.links[i].href);
                }
            }
        }
    });
});

// Success Route
app.get('/success', (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

    const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": "20.00"
            }
        }]
    };

    paypal.payment.execute(paymentId, execute_payment_json, function(error, payment) {
        if(error){
            console.log(error.response);
            throw error;
        }else{
            console.log(JSON.stringify(payment));
            res.send('Success');
        }
    });

});

// Cancel Route
app.get('/cancel', (req, res) => {
    res.send('Cancel');
});

//Choose the port from the environment or if locally use port 3000
const port = process.env.PORT || 3000;

//Starting server 
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});