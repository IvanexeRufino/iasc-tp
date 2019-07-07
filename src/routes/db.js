import { Router } from 'express'
const router = Router();

var SkipList = require("dsjslib/lib/SkipList");//.SkipList;
var list = new SkipList();

router.get('/', async(req,res) => {

    console.log(JSON.stringify(req.query));
    let resp = {};
    if(req.query.method === "equal"){
        resp = handleGetEqual(req.query);
    }
    else if(req.query.method === "gt"){
        resp = handleComparison(req.query,(a,b)=>{return a>b;})
    }
    else if(req.query.method === "lt"){
        resp = handleComparison(req.query,(a,b)=>{return a<b;})
    }else{
        resp = {error: -1, message: 'Invalid query param. Must be: ?key=unaKey;method=equal/gt/lt'};
    }

    res.json(resp);
});

//No valida existencia, solo inserta y si existe sobreescribe
router.put('/', async(req,res) => {
    list.put(req.query.key,req.query.value);
    res.json({result: "OK"});
});

function handleGetEqual(body){
    let resp = list.get(body.key);
    if(resp != null){
        return resp;
    }else{
        return {
            error: -1,
            message: "Could not find the key supplied"
        };
    }
}

function handleComparison(body,res,comp){
    let set = list.entrySet();
    let resp = [];
    set.forEach(e => {
        if(comp(e.key,body.key)){
            resp.push(e);
        }
    });

    return resp;
}

export default router;