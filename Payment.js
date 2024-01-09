const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

//Connecting DB 
const mongoose = require('mongoose');
main().catch(err => console.log(err));
async function main() {
    await mongoose.connect('mongodb+srv://prajapatipratik292:vmaaesjL08vOyfcH@mean-vercel-fitclub.3i7vyse.mongodb.net/?retryWrites=true&w=majority');
    console.log('db connected')
    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

//Generating Schema 
const paymentSchema = new mongoose.Schema({
    razorpay_order_id: {
        type: String,
        required: true,
    },
    razorpay_payment_id: {
        type: String,
        required: true,
    },
    razorpay_signature: {
        type: String,
        required: true,
    },
    msg: {
        type: String,
        required: true,
    },

});

//Generating Model 
const PaymentModel = mongoose.model('PaymentModel', paymentSchema)

//Razorpay order creation EndPoint
app.post("/order", async (req, res) => {
    try {
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_SECRET,
        });

        const options = req.body;
        const order = await razorpay.orders.create(options);

        if (!order) {
            return res.status(500).send("Error");
        }

        res.json(order);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    }
});

// Razorpay order validation and MongoDB storage endpoint
app.post("/order/validate", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

    const sha = crypto.createHmac("sha256", process.env.RAZORPAY_SECRET);
    //order_id + "|" + razorpay_payment_id
    sha.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = sha.digest("hex");
    let msg;
    if (digest === razorpay_signature) {
        // Transaction is legit
        msg = "success";
    } else {
        // Transaction is not legit
        msg = "failure";
    }

    if (digest !== razorpay_signature) {
        return res.status(400).json({ msg: "Transaction is not legit!" });
    }

    try {
        // Creating a new payment document in MongoDB
        const paymentData = {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            msg,
        };

        const newPayment = await PaymentModel.create(paymentData);

        // Responding with success message and payment details
        res.json({
            msg,
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            paymentDocumentId: newPayment._id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Error storing payment data" });
    }
});

app.listen(PORT, () => {
    console.log("listening on PORT", PORT);
})


