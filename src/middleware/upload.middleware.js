const { uploadExcel, uploadImage, uploadImages } = require('../config/multer.config');

const handleExcelUpload = (req, res, next) => {
    uploadExcel(req, res, (err) => {
        if (err) {
            err.message = 'The file is too large for the service';
            return res.status(400).send(err);
        }
        next();
    });
};

const handleImageUpload = (req, res, next) => {
    uploadImage(req, res, (err) => {
        if (err) {
            err.message = 'The file is too large for the service';
            return res.status(400).send(err);
        }
        next();
    });
};

const handleImagesUpload = (req, res, next) => {
    uploadImages(req, res, (err) => {
        if (err) {
            err.message = 'The file is too large for the service';
            return res.status(400).send(err);
        }
        next();
    });
};

module.exports = {
    handleExcelUpload,
    handleImageUpload,
    handleImagesUpload
};