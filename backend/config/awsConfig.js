require('dotenv').config(); 
const { getAndEncodeSecrets } = require('../utils/secrets'); 
const { encode, decode } = require('../utils/encryption');

const encryptionKey = process.env.ENCRYPTION_KEY; // Khóa mã hóa từ biến môi trường

// Hàm lấy và mã hóa secrets
const initializeAwsConfig = async () => {
    try {
        const { accessKeyId, secretAccessKey } = await getAndEncodeSecrets(); 
        
        const { iv, encryptedData } = encode(secretAccessKey, encryptionKey); // Mã hóa secretAccessKey

        return { 
            accessKeyId: accessKeyId,
            secretAccessKey: encryptedData, 
            iv: iv, 
            region: process.env.AWS_REGION || 'ap-southeast-1',
        };
    } catch (error) {
        console.error('Error initializing AWS config:', error);
        throw new Error('Unable to initialize AWS config');
    }
};

// Khởi tạo cấu hình AWS
let awsConfigPromise = initializeAwsConfig();

// Hàm giải mã trước khi sử dụng
const getDecryptedAwsConfig = async () => {
    const awsConfig = await awsConfigPromise; 
    const decryptedSecretKey = decode(awsConfig.secretAccessKey, encryptionKey, awsConfig.iv);
    return {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: decryptedSecretKey,
        region: awsConfig.region,
    };
};


module.exports = { getDecryptedAwsConfig };