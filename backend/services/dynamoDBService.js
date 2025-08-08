const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, QueryCommand, ScanCommand, GetCommand, DeleteCommand, BatchWriteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { getDecryptedAwsConfig } = require('../config/awsConfig');
const { removeDiacritics } = require('../utils/utils');


const awsConfig = getDecryptedAwsConfig();
const dynamoDbClient = new DynamoDBClient(awsConfig);

const getImageFaceSetup = async (name) => {
    const params = {
        TableName: "misa-face-setup",
        KeyConditionExpression: "#name = :nameVal",
        ExpressionAttributeNames: {
            '#name': 'Name'
        },
        ExpressionAttributeValues: {
            ":nameVal": name, // Giá trị cần kiểm tra (filename)
        },
    };
    const result = await dynamoDbClient.send(new QueryCommand(params));
    return result.Items;
}

const saveFaceSetup = async (s3Key, name) => {
    const params = {
        TableName: 'misa-face-setup',
        Item: {
            Name: name,
            S3Path: s3Key,
        },
    };
    await dynamoDbClient.send(new PutCommand(params));
}

const getAllFaceSetup = async () => {
    const params = {
        TableName: 'misa-face-setup',
    };
    const data = await dynamoDbClient.send(new ScanCommand(params));
    return data.Items;
}

// Hàm lưu thông tin event
const saveEventInfo = async (eventInfo) => {
    const params = {
        TableName: 'misa-event',
        Item: {
            EventId: eventInfo.EventId,
            CollectionId: eventInfo.CollectionId,
            EventName: eventInfo.EventName,
            EventTime: eventInfo.EventTime,
            EventThumbnail: eventInfo.EventThumbnail,
            EventDescription: eventInfo.EventDescription,
            PinCode: eventInfo.PinCode,
            CreatedDate: new Date().toISOString(),
            CreatedBy: eventInfo.CreatedBy,
            EventStatus: "ACTIVE"
        },
    };
    await dynamoDbClient.send(new PutCommand(params));
};

const updateEventInfo = async (eventInfo) => {
    const params = {
        TableName: 'misa-event',
        Key: {
            EventId: eventInfo.EventId, // Khóa chính để xác định event cần sửa
        },
        UpdateExpression: 'SET CollectionId = :collectionId, EventName = :eventName, EventTime = :eventTime, EventDescription = :eventDescription, PinCode = :pinCode, UpdatedDate = :updatedDate, EventStatus = :eventStatus',
        ExpressionAttributeValues: {
            ':collectionId': eventInfo.CollectionId,
            ':eventName': eventInfo.EventName,
            ':eventTime': eventInfo.EventTime,
            ':eventDescription': eventInfo.EventDescription,
            ':pinCode': eventInfo.PinCode || '',
            ':updatedDate': new Date().toISOString(), // Thời gian cập nhật
            ':eventStatus': 'ACTIVE', // Đảm bảo EventStatus được preserve
        },
        ReturnValues: 'UPDATED_NEW', // Tùy chọn trả về các giá trị vừa được cập nhật
    };

    try {
        const result = await dynamoDbClient.send(new UpdateCommand(params));
        console.log('Event updated successfully:', result);
        return result.Attributes;
    } catch (error) {
        console.error('Error updating event:', error);
        throw new Error('Could not update event');
    }
};

const getPagedEvents = async (limit, lastEvaluatedKey, searchText, isAdmin, username) => {
    try {
        // Sử dụng Scan và sort ở application level cho kết quả chính xác nhất
        const scanParams = {
            TableName: 'misa-event',
            ProjectionExpression: '#EventName, #EventDescription, #EventTime, #EventThumbnail, #EventId, #CreatedBy, #EventStatus',
            ExpressionAttributeNames: {
                '#EventName': 'EventName',
                '#EventDescription': 'EventDescription',
                '#EventTime': 'EventTime',
                '#EventThumbnail': 'EventThumbnail',
                '#EventId': 'EventId',
                '#CreatedBy': 'CreatedBy',
                '#EventStatus': 'EventStatus'
            }
        };

        // Nếu là admin, thêm trường PinCode
        if (isAdmin) {
            scanParams.ProjectionExpression += ', #PinCode';
            scanParams.ExpressionAttributeNames['#PinCode'] = 'PinCode';
        }

        // Lấy tất cả data để sort chính xác
        let allItems = [];
        let scanResponse;
        do {
            scanResponse = await dynamoDbClient.send(new ScanCommand(scanParams));
            allItems = allItems.concat(scanResponse.Items || []);
            scanParams.ExclusiveStartKey = scanResponse.LastEvaluatedKey;
        } while (scanResponse.LastEvaluatedKey);

        // Filter chỉ các record có EventStatus = 'ACTIVE'
        allItems = allItems.filter(item => item.EventStatus === 'ACTIVE');

        // Filter theo username nếu có
        if (username) {
            allItems = allItems.filter(item => item.CreatedBy === username);
        }

        // Filter theo searchText nếu có
        if (searchText) {
            const lowerCaseSearchText = removeDiacritics(searchText);
            allItems = allItems.filter(item =>
                removeDiacritics(item.EventName).includes(lowerCaseSearchText) ||
                removeDiacritics(item.EventDescription).includes(lowerCaseSearchText)
            );
        }

        // Sort tất cả theo EventTime descending (mới nhất lên đầu)
        allItems.sort((a, b) => new Date(b.EventTime) - new Date(a.EventTime));

        // Implement pagination manually với lastEvaluatedKey
        let startIndex = 0;
        if (lastEvaluatedKey) {
            const keyEventId = typeof lastEvaluatedKey === 'string' ? lastEvaluatedKey : lastEvaluatedKey.EventId;
            const foundIndex = allItems.findIndex(item => item.EventId === keyEventId);
            startIndex = foundIndex >= 0 ? foundIndex + 1 : 0;
        }

        // Lấy items cho page hiện tại
        const items = allItems.slice(startIndex, startIndex + limit);

        // Remove EventStatus field khỏi response (không cần thiết cho client)
        items.forEach(item => delete item.EventStatus);

        // Tạo lastEvaluatedKey cho pagination tiếp theo
        const nextLastEvaluatedKey = items.length === limit && startIndex + limit < allItems.length ? 
            { EventId: items[items.length - 1].EventId } : null;

        return {
            items,
            lastEvaluatedKey: nextLastEvaluatedKey,
        };

    } catch (error) {
        console.error('Error fetching paged events:', error);
        throw new Error('Could not fetch events');
    }
};

// Hàm lấy thông tin collection dựa trên eventId
const getEventInfo = async (eventId) => {
    const params = {
        TableName: 'misa-event',
        Key: {
            EventId: eventId,
        },
    };
    const response = await dynamoDbClient.send(new GetCommand(params));
    return response.Item;
};

// Hàm xóa collection
const deleteEventInfo = async (eventId) => {
    const params = {
        TableName: 'misa-event',
        Key: {
            EventId: eventId,
        },
    };
    await dynamoDbClient.send(new DeleteCommand(params));
};


const saveFaceImageToDynamoDB = async (listFaceImage) => {
    const BATCH_SIZE = 25;
    const DELAY_BETWEEN_BATCHES = 500; // 500 ms chờ giữa các batch
    const MAX_RETRIES = 5; // Số lần thử tối đa
    const RETRY_DELAY_MS = 1000; // Thời gian chờ giữa các lần thử (ms)
    const existingIds = new Set(); // Bộ lưu trữ các Id đã gặp

    let batches = [];

    // Chia items thành các batch nhỏ hơn
    while (listFaceImage.length) {
        const batchItems = listFaceImage.splice(0, BATCH_SIZE).filter(item => {
            const id = item.faceId + item.s3Key;
            if (existingIds.has(id)) {
                console.log(`Skipping duplicate item with Id: ${id}`);
                return false;
            } else {
                existingIds.add(id);
                return true;
            }
        });
        if (batchItems.length > 0) batches.push(batchItems);
    }

    // Gửi từng batch với thời gian chờ giữa các batch
    for (const batch of batches) {
        const params = {
            RequestItems: {
                'misa-event-image': batch.map(item => ({
                    PutRequest: {
                        Item: {
                            Id: item.faceId + item.s3Key,
                            FaceId: item.faceId || item.s3Key, // Trường hợp ảnh không có mặt lấy s3Key làm id
                            S3Path: item.s3Key,
                            CollectionId: item.collectionId,
                        }
                    }
                }))
            }
        };

        let retries = 0; // Biến đếm số lần thử
        while (retries < MAX_RETRIES) {
            try {
                await dynamoDbClient.send(new BatchWriteCommand(params));
                console.log(`Batch written successfully!`);
                break; // Thoát khỏi vòng lặp nếu thành công
            } catch (error) {
                if (error.name === 'ProvisionedThroughputExceededException') {
                    console.error('Provisioned throughput exceeded. Retrying...');
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS)); // Thêm thời gian chờ giữa các lần thử
                }
                else if (error.name === 'TimeoutError'){
                    console.error('Timeout error. Retrying...');
                    retries++;
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS))
                }
                else {
                    console.error('Error writing batch:', error);
                    break;
                }
            }
        }

        // Chờ trước khi gửi batch tiếp theo
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
    }
};

// Hàm query tìm kiếm ảnh theo faceId và collectionId
const queryByFaceId = async (faceId, collectionId) => {
    const params = {
        TableName: 'misa-event-image',
        IndexName: 'FaceId-CollectionId-index',
        KeyConditionExpression: 'CollectionId = :collectionId AND FaceId = :faceId',
        ExpressionAttributeValues: {
            ':collectionId': collectionId,
            ':faceId': faceId
        }
    };
    const result = await dynamoDbClient.send(new QueryCommand(params));
    return result.Items[0];
};

const queryByLabel = async (label, collectionId) => {
    // Chuyển label thành chữ thường và loại bỏ dấu
    const normalizedLabel = removeDiacritics(label.toLowerCase());

    const params = {
        TableName: 'misa-event-image',
        IndexName: 'CollectionId-index',
        KeyConditionExpression: 'CollectionId = :collectionId',
        FilterExpression: 'contains(CustomLabels, :normalizedLabel)',
        ExpressionAttributeValues: {
            ':collectionId': collectionId,
            ':normalizedLabel': normalizedLabel
        }
    };
    const result = await dynamoDbClient.send(new QueryCommand(params));
    return result.Items;
};

module.exports = {
    saveFaceImageToDynamoDB,
    queryByLabel,
    saveEventInfo,
    getEventInfo,
    deleteEventInfo,
    getPagedEvents,
    queryByFaceId,
    getImageFaceSetup,
    saveFaceSetup,
    getAllFaceSetup,
    updateEventInfo
};
