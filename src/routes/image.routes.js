const { Router } = require('express');
const router = Router();
const imageController = require('../controllers/image.controller');
const { handleImageUpload, handleImagesUpload } = require('../middleware/upload.middleware');


router.get('/image/upload', imageController.renderImageForm);
router.get('/images/upload', imageController.renderImagesForm);
router.post('/image/upload', handleImageUpload, imageController.uploadImage);
router.post('/images/upload', handleImagesUpload, imageController.uploadImages);

module.exports = router;