const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const Joi = require('joi');

const db = require("./db");
const collection = "todo";
const app = express();

const schema = Joi.object().keys({
    todo: Joi.string().required()
});

app.use(bodyParser.json());

//Server static
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Read Server Side 
app.get('/getTodos', (req, res) => {
    db.getDB().collection(collection).find({}).toArray((err, documents) => {
        if(err) {
            console.log(err);
        } else {
            console.log(documents);
            res.json(documents);
        }
    });
});

// Update Server Side 
app.put('/:id', (req, res) => {
    const todoID = req.params.id;
    const userInput = req.body;

    db.getDB().collection(collection).findOneAndUpdate({_id: db.getPrimaryKey(todoID)}, {$set: {todo : userInput.todo}}, {returnOriginal : false}, (err, result) => {
        if (err) {
            console.log(err);
            //should also respond to the user 
        }
        else {
            console.log(result);
            res.json(result);
        }
    });
});

//Create Server Side
app.post('/', (req, res, next) => {
    const userInput = req.body;

    Joi.validate(userInput, schema, (err, result) => {
        if (err) {
            const error = new Error("Invalid Input");
            error.status = 400;
            next(error);
        }
        else {
            db.getDB().collection(collection).insertOne(userInput, (err,result) => {
                if(err) {
                    //console.log(err);
                    const error = new Error("Failed to insert document in DB.");
                    error.status = 400;
                    next(error);
                }
                else {
                    res.json({result : result, document : result.ops[0], msg : "Successfully inserted Todo", error : null});
                }
            });
        }
    })
});

//Delete Server Side
app.delete('/:id', (req, res) => {
    const todoID = req.params.id;
    db.getDB().collection(collection).findOneAndDelete({_id : db.getPrimaryKey(todoID)}, (err, result) => {
        if (err) {
            console.log(err);
            //send warning back to the user
        }
        else {
            res.json(result);
        }
    });
});


//Middleware
app.use((err, req, res, next) => {
    res.status(err.status).json({
        error : {
            message : err.message
        }
    });
})


db.connect((err) => {
    if(err) {
        console.log('unable to connect to database');
        process.exit(1);
    }
    else {
        app.listen(3000, () => {
            console.log('Connected to Database on port 3000');
        });
    }
})