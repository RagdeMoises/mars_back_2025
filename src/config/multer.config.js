const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../../public/uploads'),
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const fileFilter = (filetypes) => (req, file, cb) => {
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
        return cb(null, true);
    }
    cb(`Error: File upload only supports the following filetypes - ${filetypes}`);
};

const uploadExcel = multer({
    storage,
    limits: { fileSize: 100000000 },
    fileFilter: fileFilter(/xlsx/)
}).array('file');

const uploadImage = multer({
    storage,
    limits: { fileSize: 100000000 },
    fileFilter: fileFilter(/jpeg|jpg|png|gif/)
}).array('image');

const uploadImages = multer({
    storage,
    //limits: { fileSize: 100000000 },
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB por archivo
    fileFilter: fileFilter(/jpeg|jpg|png|gif/)
}).array('images'); // <- 'images' plural para coincidir con el frontend

module.exports = {
    uploadExcel,
    uploadImage,
    uploadImages
};