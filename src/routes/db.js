import { Router } from 'express'
const router = Router();


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
    const { key } = req.params;
    res.json(key);
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
});

export default router;