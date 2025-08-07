const eventService = require('../services/eventService');

const createEventCollection = async (req, res) => {
    const paramEvent = req.body; // Lấy thông tin từ payload
    const eventInfo = {
        EventId: paramEvent.EventId,
        CollectionId: `collection-${paramEvent.EventId}`,
        EventName: paramEvent.EventName,
        EventTime: paramEvent.EventTime,
        EventThumbnail: paramEvent.EventThumbnail,
        EventDescription: paramEvent.EventDescription,
        PinCode: paramEvent.PinCode,
        CreatedBy: paramEvent.CreatedBy
    }
    try {
        const result = await eventService.createEventCollection(eventInfo);
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating event collection');
    }
};

const updateEventInfo = async (req, res) => {
    const paramEvent = req.body; // Lấy thông tin từ payload
    const eventInfo = {
        EventId: paramEvent.EventId,
        CollectionId: `collection-${paramEvent.EventId}`,
        EventName: paramEvent.EventName,
        EventTime: paramEvent.EventTime,
        EventDescription: paramEvent.EventDescription,
        PinCode: paramEvent.PinCode
    }
    try {
        const result = await eventService.updateEventInfo(eventInfo);
        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating event collection');
    }
};

const searchEvent = async (req, res) => {
    const { searchText } = req.params;
    try {
        const result = await eventService.searchEvent(searchText);
        res.json(result);
    } catch (error) {

    }
}

const uploadThumbnail = async (req, res) => {
    const { eventId } = req.params;
    const file = req.file; // Lấy file thumbnail từ request

    // Kiểm tra nếu file không tồn tại
    if (!file) {
        return res.status(400).send('Thumbnail is required');
    }

    try {
        const thumbnailResult = await eventService.uploadThumbnailEvent(file, eventId);
        res.status(201).json(thumbnailResult); // Trả về Key của thumbnail
    } catch (error) {
        console.error(error);
        res.status(500).send('Error uploading thumbnail');
    }
};

const getPagedEvents = async (req, res) => {
    const { limit = 10, lastEvaluatedKey, searchText, isListAll } = req.query; // Lấy tham số limit từ query

    try {
        let isAdmin = false;
        let username = null;
        let password = null;
        const isListAll = req.query.isListAll === 'true';
        const authHeader = req.headers['authorization'];

        if (authHeader && !isListAll) {
            const base64Credentials = authHeader.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
            [username, password] = credentials.split(':');
            if (
                (username === 'admin' && password === 'Misa@123') ||
                (username === 'admin_tct' && password === '12345678@Abc')
            ) {
                isAdmin = true
            }
        }

        const parsedLastEvaluatedKey = lastEvaluatedKey ? lastEvaluatedKey : undefined; // Phân tích lastEvaluatedKey
        const result = await eventService.getPagedEvents(Number(limit), parsedLastEvaluatedKey, searchText, isAdmin, username);

        res.json(result); // Trả về danh sách sự kiện
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving paged events');
    }
};


const getPagedImagesInEventFolder = async (req, res) => {
    const { eventId } = req.params; // Lấy eventId từ params
    const { limit = 10, continuationToken, isGetTotal } = req.query; // Lấy limit và continuationToken từ query

    try {
        const result = await eventService.getPagedImagesInEventFolder(eventId, Number(limit), continuationToken, isGetTotal);
        res.json(result); // Trả về danh sách đường dẫn ảnh và token tiếp theo
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving paged images');
    }
};


const getEventCollection = async (req, res) => {
    const { eventId } = req.params; // Lấy eventId từ params
    try {
        let isAdmin = false;
        const authHeader = req.headers['authorization'];

        if (authHeader) {
            const base64Credentials = authHeader.split(' ')[1];
            const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
            const [username, password] = credentials.split(':');
            if (
                (username === 'admin' && password === 'Misa@123') ||
                (username === 'admin_tct' && password === '12345678@Abc')
            ) {
                isAdmin = true
            }
        }
        const collectionInfo = await eventService.getEventCollection(eventId, isAdmin);
        if (!collectionInfo) {
            return res.status(404).send('Collection not found');
        }
        res.json(collectionInfo);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error retrieving event collection');
    }
};

const deleteEventCollection = async (req, res) => {
    const { eventId } = req.params; // Lấy eventId từ params
    try {
        await eventService.deleteEventCollection(eventId);
        res.status(204).send(); // Thành công và không có nội dung trả về
    } catch (error) {
        console.error(error);
        res.status(500).send('Error deleting event collection');
    }
};

module.exports = {
    createEventCollection,
    getEventCollection,
    deleteEventCollection,
    getPagedEvents,
    getPagedImagesInEventFolder,
    uploadThumbnail,
    updateEventInfo
};