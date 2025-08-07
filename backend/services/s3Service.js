const { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getDecryptedAwsConfig } = require('../config/awsConfig');
const dynamoDBService = require('../services/dynamoDBService');
const sharp = require('sharp');
const awsConfig = getDecryptedAwsConfig();
const s3Client = new S3Client(awsConfig);

const uploadImageFaceSetup = async (file, filename, name) => {
    const fileExists = await dynamoDBService.getImageFaceSetup(name);
    if (fileExists.length > 0) {
        return { IsExists: true };
    }
    const uploadParams = {
        Bucket: process.env.S3_BUCKET,
        Key: `face-setup/${filename}`,
        Body: file.buffer,
    };
    await s3Client.send(new PutObjectCommand(uploadParams));
    await dynamoDBService.saveFaceSetup(uploadParams.Key, name)
    return { IsExists: false, Key: uploadParams.Key };
}

const deleteFaceSetup = async (name) => {

}

const getPresignedUrl = async (key) => {
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL sẽ hết hạn sau 1 giờ
    return url;
};

const deleteImage = async (key) => {
    const command = new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
    });
    await s3Client.send(command);
};

const uploadWithRetry = async (params, maxRetries = 5, delay = 500) => {
    let attempt = 0;

    while (attempt < maxRetries) {
        try {
            // Thử gửi yêu cầu tải lên S3
            await s3Client.send(new PutObjectCommand(params));
            return; // Thoát nếu thành công
        } catch (error) {
            if (error.name === 'ProvisionedThroughputExceededException' && attempt < maxRetries - 1) {
                // Tăng gấp đôi thời gian đợi sau mỗi lần thử lại không thành công
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
                attempt++;
            } else {
                throw error; // Ném lỗi nếu đạt giới hạn số lần thử lại hoặc lỗi không liên quan
            }
        }
    }
};

const uploadImagesToS3 = async (files, eventId) => {
    const uploadPromises = files.map(async file => {
        const fileName = file.originalname || file.name
        const dateNow = Date.now();
        const imageKey = `${eventId}/${dateNow}-${fileName}`;
        const thumbnailKey = `image-thumbnails/${eventId}/${dateNow}-${fileName}`;

        const thumbnailBuffer = await sharp(file.buffer)
            .resize({ width: 400 })
            .toBuffer();

        // Tải ảnh gốc lên S3 với retries
        await uploadWithRetry({
            Bucket: process.env.S3_BUCKET,
            Key: imageKey,
            Body: file.buffer,
        });

        // Tải ảnh thumbnail lên S3 với retries
        await uploadWithRetry({
            Bucket: process.env.S3_BUCKET,
            Key: thumbnailKey,
            Body: thumbnailBuffer,
        });

        const imageUrl = await getPresignedUrl(imageKey);
        const thumbnailUrl = await getPresignedUrl(thumbnailKey);

        return { Key: imageKey, Url: imageUrl, ThumbnailKey: thumbnailKey, ThumbnailUrl: thumbnailUrl, Name: fileName };
    });

    return Promise.all(uploadPromises);
};

const uploadImagesSearchToS3 = async (file, eventId) => {
    const uploadParams = {
        Bucket: process.env.S3_BUCKET,
        Key: `search-uploads/${eventId}/${Date.now()}-${file.originalname}`,
        Body: file.buffer,
    };
    await s3Client.send(new PutObjectCommand(uploadParams));
    return { Key: uploadParams.Key };
};

const uploadThumbnailEvent = async (file, eventId) => {
    const thumbnailKey = `thumbnail/${eventId}`
    const thumbnailPreviewKey = `thumbnail/preview/${eventId}`;

    const thumbnailBuffer = await sharp(file.buffer)
        .resize({ width: 400 })
        .toBuffer();

    const uploadParams = {
        Bucket: process.env.S3_BUCKET,
        Key: thumbnailKey,
        Body: file.buffer,
    };

    const uploadPreviewParams = {
        Bucket: process.env.S3_BUCKET,
        Key: thumbnailPreviewKey,
        Body: thumbnailBuffer,
    };
    await s3Client.send(new PutObjectCommand(uploadParams));
    await s3Client.send(new PutObjectCommand(uploadPreviewParams));

    const url = await getPresignedUrl(uploadParams.Key)
    return { Url: url };
};

const getPagedImagesInEventFolder = async (eventId, limit, continuationToken, isGetTotal = false) => {
    const params = {
        Bucket: process.env.S3_BUCKET,
        Prefix: `${eventId}/`,
        MaxKeys: limit,
        ContinuationToken: continuationToken,
    };

    try {
        const command = new ListObjectsV2Command(params);
        const response = await s3Client.send(command);

        // Lấy tổng số ảnh nếu isGetTotal là true
        let totalCount = null;
        if (isGetTotal) {
            totalCount = 0;
            let countToken;
            do {
                const countParams = {
                    Bucket: process.env.S3_BUCKET,
                    Prefix: `${eventId}/`,
                    ContinuationToken: countToken,
                };
                const countCommand = new ListObjectsV2Command(countParams);
                const countResponse = await s3Client.send(countCommand);
                totalCount += countResponse.KeyCount || 0;
                countToken = countResponse.NextContinuationToken;
            } while (countToken);
        }

        const images = await Promise.all(
            (response.Contents || []).map(async (item) => {
                const originalUrl = await getPresignedUrl(item.Key);

                const thumbnailKey = item.Key.replace(`${eventId}/`, `image-thumbnails/${eventId}/`);
                const thumbnailUrl = await getPresignedUrl(thumbnailKey);

                return {
                    originalUrl,
                    thumbnailUrl
                };
            })
        );

        return {
            images,
            nextContinuationToken: response.NextContinuationToken || null,
            totalCount, // Trả về tổng số ảnh nếu isGetTotal là true, ngược lại trả về null
        };
    } catch (error) {
        console.error('Error fetching paged images from S3:', error);
        throw new Error('Could not fetch images');
    }
};


module.exports = {
    getPresignedUrl,
    deleteImage,
    uploadImagesToS3,
    getPagedImagesInEventFolder,
    uploadImagesSearchToS3,
    uploadThumbnailEvent,
    uploadImageFaceSetup,
};