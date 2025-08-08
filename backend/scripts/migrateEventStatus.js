const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { getDecryptedAwsConfig } = require('../config/awsConfig');

const awsConfig = getDecryptedAwsConfig();
const dynamoDbClient = new DynamoDBClient(awsConfig);

const migrateEventStatus = async () => {
    console.log('Starting migration to add EventStatus field to existing records...');
    
    let scanParams = {
        TableName: 'misa-event',
        ProjectionExpression: 'EventId',
        FilterExpression: 'attribute_not_exists(EventStatus)' // Chỉ lấy records chưa có EventStatus
    };

    let itemsProcessed = 0;
    let itemsUpdated = 0;

    try {
        let scanResult;
        do {
            scanResult = await dynamoDbClient.send(new ScanCommand(scanParams));
            const items = scanResult.Items || [];
            
            console.log(`Found ${items.length} items to update in this batch...`);

            // Update từng item
            for (const item of items) {
                try {
                    const updateParams = {
                        TableName: 'misa-event',
                        Key: {
                            EventId: item.EventId
                        },
                        UpdateExpression: 'SET EventStatus = :eventStatus',
                        ExpressionAttributeValues: {
                            ':eventStatus': 'ACTIVE'
                        },
                        ConditionExpression: 'attribute_exists(EventId)' // Đảm bảo record tồn tại
                    };

                    await dynamoDbClient.send(new UpdateCommand(updateParams));
                    itemsUpdated++;
                    console.log(`✓ Updated EventId: ${item.EventId}`);
                } catch (updateError) {
                    console.error(`✗ Failed to update EventId: ${item.EventId}`, updateError.message);
                }
            }

            itemsProcessed += items.length;
            scanParams.ExclusiveStartKey = scanResult.LastEvaluatedKey;

            // Thêm delay nhỏ để tránh throttling
            if (scanResult.LastEvaluatedKey) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

        } while (scanResult.LastEvaluatedKey);

        console.log('\n=== Migration Summary ===');
        console.log(`Total items processed: ${itemsProcessed}`);
        console.log(`Total items updated: ${itemsUpdated}`);
        console.log(`Failed updates: ${itemsProcessed - itemsUpdated}`);
        console.log('Migration completed!');

    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    }
};

// Chạy migration nếu được gọi trực tiếp
if (require.main === module) {
    migrateEventStatus()
        .then(() => {
            console.log('Migration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration script failed:', error);
            process.exit(1);
        });
}

module.exports = { migrateEventStatus };
