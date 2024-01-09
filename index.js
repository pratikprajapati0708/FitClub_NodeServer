const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const app = express()
const port = 8080
app.use(cors());
app.use(bodyParser.json());
const mongoose = require('mongoose');

main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/Fitclub');
    console.log('db connected')
    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}
const emailSchema = new mongoose.Schema({
    useremail : String
});
const User = mongoose.model('User', emailSchema); //for setting the Database name 

app.post('/', async(req, res) => {
    let user = new User();  //Model define user
    user.useremail = req.body.useremail;
    const doc = await user.save();
    console.log(doc);
    res.json(doc);
})

//GET METHOD
app.get('/',async(req,res)=>{
    const docs = await User.find({});
    res.json(docs);
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})