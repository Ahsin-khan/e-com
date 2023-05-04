const express = require('express');
require('./db/config');
const cors = require('cors');
const User = require('./db/User')
const app = express();
const Product = require('./db/Product');
const Jwt = require('jsonwebtoken');
const jwtKey = "e-comm";

app.use(express.json());
app.use(cors());

//Register or Signup
app.post("/register", async(req, resp)=>{
    let user = new User(req.body);     //User = schema we required above
    let result = await(user.save());   //const/let both can be used for var
    result = result.toObject()
    delete result.password;
    Jwt.sign({result}, jwtKey, {expiresIn: "2h" }, (err, token)=>{
        if(err){
            resp.send({ result : "something went wrong" });
        }
            resp.send({result, auth: token });
    })
});

//Login or Signin
app.post("/login", async(req, resp)=>{

    if(req.body.email && req.body.password){
        let user =await User.findOne(req.body).select("-password");
        if(user){
            Jwt.sign({user}, jwtKey, {expiresIn: "2h" }, (err, token)=>{
                if(err){
                    resp.send({ result : "something went wrong" });
                }
                    resp.send({user, auth: token });
            })
        }else{
            resp.send({result:'No user found'})    
        }
    }else{
        resp.send({result:'No user found'})
    }

})

// add product
app.post("/add-product", verifyToken ,async (req, resp)=>{
    let product = new Product(req.body);
    let result = await product.save();
    resp.send(result);
})

// get products
app.get("/products", verifyToken ,async (req, resp)=>{
    let result = await Product.find();
    if(result.length > 0){
        resp.send(result);
    }else{
        resp.send({result: "No product found"});
    }
})

//delete product
app.delete("/product/:id", verifyToken ,async (req, resp)=>{
    const result =await Product.deleteOne({_id: req.params.id})
    resp.send(result);
})

//getting single record for update
app.get("/product/:id", verifyToken ,async(req, resp)=>{
    let result = await Product.findOne({_id: req.params.id});
    if(result){
        resp.send(result);
    }else{
        resp.send({result: "No record found"});
    }
})

app.put("/product/:id", verifyToken, async(req, resp)=>{
    let result = await Product.updateOne(
        {_id:req.params.id},
        {
            $set : req.body
        }
    )
        resp.send(result); 
});


app.get("/search/:key", verifyToken ,async (req, resp)=>{
    let result = await Product.find({
        "$or":[
            {name: {$regex: req.params.key}},
            {company: {$regex: req.params.key}},
            {category: {$regex: req.params.key}}
        ]
    });
    resp.send(result);
});

//it will be called in search method we can see
function verifyToken(req, resp, next){         //next means if everything goes well then proceed (next)    
    let token = req.headers['authorization']; // taking token from header in postman
    if(token){                                //if we have token  
        token = token.split(' ')[1];            //split token from bearer keyword and take the value on 1st index which is token
        console.warn('middleware called in if', token);     //showing token in console 
        Jwt.verify(token, jwtKey, (error, valid)=>{         //verifying token and key described above
            if(error){                                      //if any error
                resp.status(401).send({result: 'Please add valid token'})  //print this
            }else{                                           //else        
                next();                                      //proceed next i.e keep working in search api    
            }
        })
    }else{
        resp.status(403).send({result: 'please add token with headers'});
    }
}



app.listen(5000)