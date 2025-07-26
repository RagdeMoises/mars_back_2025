const { Router } = require('express');
const router = Router();
const excelController = require('../controllers/excel.controller');
const { handleExcelUpload } = require('../middleware/upload.middleware');

router.get('/api/productos', excelController.getProducts);
router.get('/data/upload', excelController.renderExcelForm);
router.post('/data/upload', handleExcelUpload, excelController.uploadExcel);
router.get('/api/productos/paginated', excelController.getPaginatedProducts);
router.post('/api/send-cart', excelController.enviarCorreo);
router.get('/api/categorias', excelController.getCategorias);
router.get('/api/novedades', excelController.getNovedades);
router.get('/api/ofertas', excelController.getOfertas);

module.exports = router;