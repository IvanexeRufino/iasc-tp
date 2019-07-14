import { Router } from 'express'
const router = Router();

router.get('/', (req, res) => res.send('Bienvenido a IACS Key-Value DB'));
router.get('/alive', (req, res) => res.send());

export default router;
