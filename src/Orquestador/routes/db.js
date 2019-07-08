import { Router } from 'express'

const router = Router();
var SkipList = require("dsjslib/lib/SkipList");//.SkipList;
var list = new SkipList();

router.get('/:key', async(req,res) => {

    console.log(JSON.stringify(req.query));
    let method = req.query.method;
    let key = req.params.key;
    let resp = {};
    switch(method) {
        case "equal":
            resp = handleGetEqual(key);
            break;
        case "gt":
            resp = handleComparison(key,(a,b)=>{return a>b;});
            break;
        case "lt":
            resp = handleComparison(key,(a,b)=>{return a<b;});
            break;
        default:
            resp = {error: 400, message: 'Bad request, specify a valid method as a queryparam'};
            break;
    }
    res.json(resp);
});

router.post('/:key', async(req,res) => {
    let value = req.body.value;
    let keyToFound = req.params.key;
    let resp = {};

    if(value !== undefined) {
        if(!valueAlreadyExists(keyToFound)) {
            list.put(keyToFound, value);

            resp = {result: "OK"};
        } else {
            resp = {error: 400, message: 'Bad request, Key already exists if you want to edit it use PUT'};
        }
    } else {
        resp = {error: 400, message: 'Bad request, Post a json with value property on it'};
    }

    res.json(resp);
});

router.put('/', async(req,res) => {
    let value = req.body.value;
    let keyToFound = req.params.key;
    let resp = {};

    if(value !== undefined) {
        if(valueAlreadyExists(keyToFound)) {
            list.put(keyToFound,value);

            resp = {result: "OK"};
        } else {
            resp = {error: 400, message: 'Bad request, Key doesnt exist use POST instead'};
        }
    } else {
        resp = {error: 400, message: 'Bad request, Post a json with value property on it'};
    }

    res.json(resp);
});

router.delete('/:key', async(req,res) => {
    let resp = {};
    let keyToFound = req.params.key;

    if(valueAlreadyExists(keyToFound)) {
        list.put(keyToFound,value);

        resp = {result: "OK"};
    } else {
        resp = {error: 400, message: 'Bad request, Key doesnt exist'};
    }

    res.json(resp);
});

function handleGetEqual(key){
    let resp = list.get(key);
    if(resp != null){
        return resp;
    }else{
        return {
            error: 404,
            message: 'Could not find the key supplied'
        };
    }
}

function handleComparison(keyToFound,comp){
    let set = list.entrySet();
    let resp = [];
    set.forEach(e => {
        if(comp(e.key,keyToFound)){
            resp.push(e.key);
        }
    });

    return resp;
}

function valueAlreadyExists(key) {
    return list.get(key) !== undefined;
}

export default router;