const express = require('express');
const eventController = require('../controllers/eventController');
const checkEventPinCode = require('../middleware/authMiddleware');
const multer = require('multer');
const upload = multer();
const router = express.Router();

// Route để tạo collection cho sự kiện
router.post('/create-event-collection', eventController.createEventCollection);

router.post('/update-event-collection', eventController.updateEventInfo);

// Route để tải thumbnail cho sự kiện
router.post('/upload-thumbnail/:eventId', upload.single('thumbnail'), eventController.uploadThumbnail);

// Route để lấy thông tin collection của sự kiện
router.get('/get-event-collection/:eventId', eventController.getEventCollection);

// Route để lấy danh sách sự kiện với phân trang
router.get('/get-paged-events', eventController.getPagedEvents);

// Route để lấy danh sách ảnh phân trang trong folder eventId
router.get('/images/paged/:eventId', checkEventPinCode, eventController.getPagedImagesInEventFolder);

// Route để xóa collection của sự kiện
router.delete('/delete-event-collection/:eventId', checkEventPinCode, eventController.deleteEventCollection);
// Route Health Check
router.get('/healthcheck', (req, res) => {
    console.log('Health check endpoint hit');
    
    res.status(200).json({ message: 'Service is up and running' });
});
module.exports = router;