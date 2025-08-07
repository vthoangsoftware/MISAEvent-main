const dynamoDbService = require('../services/dynamoDBService'); 


const checkEventPinCode = async (req, res, next) => {
    // Lấy eventId từ URL hoặc từ body
    const eventId = req.params.eventId || req.body.eventId || req.query.eventId || req.eventId;
    
    // Lấy pinCode từ headers
    const pinFromHeader = req.headers['x-pin-code']; 

    if (!eventId) {
        return res.status(400).json({ message: 'Event ID is required.' });
    }

   

    try {
        // Lấy thông tin sự kiện từ DynamoDB dựa vào eventId
        const eventInfo = await dynamoDbService.getEventInfo(eventId);
        const serverPin = eventInfo.PinCode;

        if(!serverPin){
            return next(); // Không có mã pin
        }
        
        if (!pinFromHeader) {
            return res.status(400).json({ message: 'PIN code is required in headers.' });
        }

        if (!eventInfo) {
            return res.status(404).json({ message: 'Event not found.' });
        }

        // Lấy mã PIN của sự kiện từ cơ sở dữ liệu

        // Kiểm tra mã PIN
        if (pinFromHeader === serverPin) {
            return next(); // Mã PIN khớp, tiếp tục xử lý
        } else {
            return res.status(403).json({ message: 'Invalid PIN code.' }); // Mã PIN không khớp
        }
    } catch (error) {
        console.error(`Error checking pin for event ${eventId}:`, error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};


module.exports = checkEventPinCode;