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
            CreatedBy: eventInfo.CreatedBy
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
        UpdateExpression: 'SET CollectionId = :collectionId, EventName = :eventName, EventTime = :eventTime, EventDescription = :eventDescription, PinCode = :pinCode, UpdatedDate = :updatedDate',
        ExpressionAttributeValues: {
            ':collectionId': eventInfo.CollectionId,
            ':eventName': eventInfo.EventName,
            ':eventTime': eventInfo.EventTime,
            ':eventDescription': eventInfo.EventDescription,
            ':pinCode': eventInfo.PinCode || '',
            ':updatedDate': new Date().toISOString(), // Thời gian cập nhật
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
    const params = {
        TableName: 'misa-event',
        Limit: limit,
        ProjectionExpression: '#EventName, #EventDescription, #EventTime, #EventThumbnail, #EventId, #CreatedBy', // Liệt kê các trường bạn muốn lấy
        ExpressionAttributeNames: {
            '#EventName': 'EventName',
            '#EventDescription': 'EventDescription',
            '#EventTime': 'EventTime',
            '#EventThumbnail': 'EventThumbnail',
            '#EventId': 'EventId',
            '#CreatedBy': 'CreatedBy'
        }
    };

    // Nếu là admin, thêm trường PinCode vào ProjectionExpression
    if (isAdmin) {
        params.ProjectionExpression += ', #PinCode'; // Thêm trường PinCode
        params.ExpressionAttributeNames['#PinCode'] = 'PinCode'; // Định nghĩa tên trường PinCode
    }

    // Nếu có lastEvaluatedKey, thêm vào params
    if (lastEvaluatedKey) {
        params.ExclusiveStartKey = lastEvaluatedKey;
    }

    try {
        const response = await dynamoDbClient.send(new ScanCommand(params));

        // Nếu có searchText, lọc kết quả ở phía ứng dụng
        let items = response.Items || [];

        if (username) {
            items = items.filter(item => item.CreatedBy === username);
        }

        if (items.length) {
            // Sắp xếp theo EventTime giảm dần
            items.sort((a, b) => new Date(b.EventTime) - new Date(a.EventTime));
        }
        if (searchText) {
            const lowerCaseSearchText = removeDiacritics(searchText);
            items = items.filter(item =>
                removeDiacritics(item.EventName).includes(lowerCaseSearchText) ||
                removeDiacritics(item.EventDescription).includes(lowerCaseSearchText)
            );
        }

        return {
            items,
            lastEvaluatedKey: response.LastEvaluatedKey || null, // Trả về khóa cuối cùng nếu có
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