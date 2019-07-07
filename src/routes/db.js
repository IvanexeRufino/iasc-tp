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

router.put('/', async(req,res) => {
    list.put(req.query.key,req.query.value);
    res.json({result: "OK"});
});

/*
router.get('/', async (req, res) => {
    res.json({
        message: `Ingrese una clave como parametro de ruta.`
    });
});

router.post('/:key', async (req, res) => {    
    const { key } = req.params;
    const { value } = req.query;
    res.json({
        message: `Clave ${key} actualizada con el valor ${value} exitosamente.`
    });
});

router.get('/:key', async (req, res) => {
    const { paramKey } = req.params;
    handleGetEqual({key:paramKey,res});
});

router.delete('/:key', async (req, res) => {
    const { key } = req.params;

    res.json({
        message: `Clave ${key} borrada exitosamente.`
    });
});

router.put('/:key', async (req, res) => {
    const { key } = req.params;
    const { value } = req.query;
    res.json({
        message: `Clave ${key} actualizada con el valor ${value} exitosamente.`
    });
});*/

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