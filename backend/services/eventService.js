const { text } = require('express');
const dynamoDBService = require('../services/dynamoDBService');
const rekognitionService = require('../services/rekognitionService');
const s3Service = require('../services/s3Service');
const { S3Client } = require('@aws-sdk/client-s3');

// Hàm tạo collection cho sự kiện
const createEventCollection = async (eventInfo) => {
    const collectionId = `collection-${eventInfo.EventId}`; // Tạo collectionId từ eventId
    await rekognitionService.createCollection(collectionId); // Tạo collection trong Rekognition
    await dynamoDBService.saveEventInfo(eventInfo); // Lưu thông tin vào DynamoDB

    return eventInfo;
};

const updateEventInfo = async (eventInfo) => {
    return await dynamoDBService.updateEventInfo(eventInfo)
}


const uploadThumbnailEvent = async (file, eventId) => {
    return await s3Service.uploadThumbnailEvent(file, eventId)
};

// Hàm lấy danh sách sự kiện với phân trang
const getPagedEvents = async (limit, lastEvaluatedKey, searchText, isAdmin, username) => {
    const dynamoResult = await dynamoDBService.getPagedEvents(limit, lastEvaluatedKey, searchText, isAdmin, username);
    const promises = dynamoResult.items.map(async item => {
        const key = `thumbnail/${item.EventId}`;
        const previewKey = `thumbnail/preview/${item.EventId}`;
        item.EventThumbnail = await s3Service.getPresignedUrl(key)
        item.EventPreviewThumbnail = await s3Service.getPresignedUrl(previewKey)
    })
    await Promise.all(promises);
    return dynamoResult;
};


// Hàm lấy thông tin collection cho sự kiện
const getEventCollection = async (eventId, isAdmin) => {
    const event = await dynamoDBService.getEventInfo(eventId);
    event.HasPinCode = !!event.PinCode
    if (!isAdmin) {
        event.PinCode = undefined;
    }
    const key = `thumbnail/${eventId}`;
    event.EventThumbnail = await s3Service.getPresignedUrl(key);
    return event;
};

// Hàm xóa collection cho sự kiện
const deleteEventCollection = async (eventId) => {
    const collectionId = `collection-${eventId}`; // Tạo collectionId từ eventId
    await rekognitionService.deleteCollection(collectionId)
    await dynamoDBService.deleteEventInfo(eventId);
    await s3Service.deleteImage(eventId);
    await s3Service.deleteImage(`image-thumbnails/${eventId}`);
};

// Hàm lấy danh sách ảnh phân trang trong folder sự kiện
const getPagedImagesInEventFolder = async (eventId, limit, continuationToken, isGetTotal) => {
    return await s3Service.getPagedImagesInEventFolder(eventId, limit, continuationToken, isGetTotal);
};

module.exports = {
    createEventCollection,
    getEventCollection,
    deleteEventCollection,
    getPagedEvents,
    getPagedImagesInEventFolder,
    uploadThumbnailEvent,
    updateEventInfo
};