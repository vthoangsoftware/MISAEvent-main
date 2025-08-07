const express = require('express');
const multer = require('multer');
const imageController = require('../controllers/imageController');

const router = express.Router();
const upload = multer(); // Để xử lý file upload
const checkEventPinCode = require('../middleware/authMiddleware');
// Tải nhiều ảnh lên và xử lý với Rekognition và DynamoDB
router.post('/upload-images', checkEventPinCode, upload.array('files', 1000), imageController.uploadImages);

router.post('/upload-images-by-drive', imageController.uploadImagesByGoogleDrive);

// Tìm kiếm bằng ảnh tải lên
router.post('/search-by-image', checkEventPinCode, upload.single('file'), imageController.searchByImage);

router.post('/search-by-name', checkEventPinCode, imageController.searchImageByNameFaceSetup);

// Tìm kiếm bằng label
router.get('/search-by-label', checkEventPinCode, imageController.searchByLabel);

router.post('/upload-face-setup', upload.array('files', 200), imageController.uploadFileImageFaceSetup);

router.get('/get-face-setup', imageController.getListAllFaceSetup);

router.post('/delete-image', checkEventPinCode, imageController.deleteImageByKey);

// Route Health Check
router.get('/healthcheck', (req, res) => {
    res.status(200).json({ message: 'Service is up and running' });
});

module.exports = router;    