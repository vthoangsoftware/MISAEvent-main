const multer = require("multer");
require("dotenv").config();
const {
  uploadImagesToS3,
  uploadImagesSearchToS3,
  uploadImageFaceSetup,
  getPresignedUrl,
  deleteImage
} = require("../services/s3Service");
const {
  indexFaces,
  detectCustomLabels,
  searchFacesByImage,
  createCollection,
} = require("../services/rekognitionService");
const {
  saveFaceImageToDynamoDB,
  queryByLabel,
  queryByFaceId,
  getAllFaceSetup,
  getImageFaceSetup,
} = require("../services/dynamoDBService");
const { removeDiacritics } = require("../utils/utils");

const {listDriveImages} =  require("../services/googleService");

// Controller cho việc tải nhiều ảnh lên
const uploadImages = async (req, res) => {
  const eventId = req.body.eventId || req.query.eventId;
  try {
    // Upload ảnh lên S3
    const uploadResults = await uploadImagesToS3(req.files, eventId);
    await handleAfterUploadImage(uploadResults, eventId)
    res.json(uploadResults);
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).send("Error uploading images");
  }
};

const uploadImagesByGoogleDrive = async (req, res) =>{
  const driveFolderId = req.body.driveFolderId || req.query.driveFolderId;
  const eventId = req.body.eventId || req.query.eventId;
  try {
    const images = await listDriveImages(driveFolderId);
    // Upload ảnh lên S3
    const uploadResults = await uploadImagesToS3(images, eventId);
    await handleAfterUploadImage(uploadResults, eventId)
    res.json(uploadResults);
  } catch (error) {
    console.error("Error uploading images:", error);
    res.status(500).send("Error uploading images");
  }
}

const retryWithExponentialBackoff = async (fn, maxRetries = 5, delay = 500) => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn(); // Thử gọi hàm và trả về kết quả nếu thành công
    } catch (error) {
      if (attempt >= maxRetries - 1) throw error; // Ném lỗi nếu đã đạt số lần thử tối đa
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt))); // Tăng thời gian chờ giữa các lần thử
      attempt++;
    }
  }
};

const handleAfterUploadImage = async (uploadResults, eventId) => {
  const listFaceImage = [];
  const collectionId = `collection-${eventId}`;
  const MAX_CONCURRENT_REQUESTS = 5; // Giới hạn số lượng yêu cầu đồng thời
  const DELAY_BETWEEN_BATCHES = 200; // 200ms giữa mỗi batch

  // Chia các yêu cầu indexFaces thành các batch
  for (let i = 0; i < uploadResults.length; i += MAX_CONCURRENT_REQUESTS) {
    const batch = uploadResults.slice(i, i + MAX_CONCURRENT_REQUESTS);

    const promises = batch.map(async (result) => {
      const s3Key = result.Key;
      const url = result.Url;

      // Gọi IndexFaces với cơ chế retries
      const indexFacesResponse = await retryWithExponentialBackoff(() => 
        indexFaces(process.env.S3_BUCKET, s3Key, collectionId)
      );

      if (indexFacesResponse.FaceRecords && indexFacesResponse.FaceRecords.length) {
        indexFacesResponse.FaceRecords.forEach(record => {
          const faceId = record.Face?.FaceId;
          if (faceId) {
            listFaceImage.push({ faceId, s3Key, collectionId });
          }
        });
      }

      return { url, s3Key, faceIds: indexFacesResponse.FaceRecords.map(record => record.Face.FaceId) };
    });

    const batchResults = await Promise.all(promises);
    console.log(`Processed batch of ${batchResults.length} images successfully.`);

    await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES)); // Chờ giữa các batch
  }

  await saveFaceImageToDynamoDB(listFaceImage); // Lưu tất cả các items vào DynamoDB sau khi xử lý xong
  return listFaceImage;
};


const decodeFileName = (encodedFileName) => {
  // Prepare base64url encoded string back to base64 standard
  const base64 = encodedFileName.replace(/-/g, '+').replace(/_/g, '/');
  const binaryString = Buffer.from(base64, 'base64').toString('binary');
  const byteArray = Uint8Array.from(binaryString, char => char.charCodeAt(0));
  return new TextDecoder().decode(byteArray);
}


const uploadFileImageFaceSetup = async (req, res) => {
  try {
    const files = req.files;
    const fileExists = [];
    const fileSuccess = [];

    if (files && files.length > 0) {
      const promises = files.map(async (file) => {
        const fileName = decodeFileName(file.originalname);
        const name = fileName.substring(
          0,
          fileName.lastIndexOf(".")
        );
        const result = await uploadImageFaceSetup(file, fileName, name);
        if (result.IsExists) {
          fileExists.push(fileName);
        } else {
          fileSuccess.push(fileName);
        }
        return;
      });
      await Promise.all(promises);
      const result = {
        Success: fileSuccess,
        ErrorExists: fileExists,
      };
      res.json(result);
    }else{
      res.json([]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading images");
  }
};

const getListAllFaceSetup = async (req, res) => {
  try {
    const allFaceSetup = await getAllFaceSetup();
    res.json(allFaceSetup);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error get face");
  }
};

const searchImageByNameFaceSetup = async (req, res) => {
  try {
    const eventId = req.body.eventId || req.query.eventId;
    const collectionId = `collection-${eventId}`;

    const name = req.body.name;
    const items = await getImageFaceSetup(name);
    const faceSetup = items[0];

    const searchResult = await searchFacesByImage(
      collectionId,
      process.env.S3_BUCKET,
      faceSetup.S3Path
    );
    const faceMatches = searchResult.FaceMatches.map(
      (match) => match.Face.FaceId
    );

    const dynamoResults = await Promise.all(
      faceMatches.map((faceId) => {
        return queryByFaceId(faceId, collectionId);
      })
    );

    const promises = dynamoResults.map(async (item) => {
      if(item){
        const url = await getPresignedUrl(item.S3Path); 
        const thumbnailKey = item.S3Path.replace(`${eventId}/`, `image-thumbnails/${eventId}/`);
        const thumbnailUrl = await getPresignedUrl(thumbnailKey);
        return {
          originalUrl : url,
          thumbnailUrl
        };
      }
    });

    let results = await Promise.all(promises);
    results = results.filter(item => item != null)
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error get face");
  }
};

// Controller cho việc tìm kiếm bằng ảnh tải lên
const searchByImage = async (req, res) => {
  const eventId = req.body.eventId || req.query.eventId;
  const collectionId = `collection-${eventId}`;

  try {
    const uploadResult = await uploadImagesSearchToS3(req.file, eventId);
    const s3Key = uploadResult.Key;

    const searchResult = await searchFacesByImage(
      collectionId,
      process.env.S3_BUCKET,
      s3Key
    );
    const faceMatches = searchResult.FaceMatches.map(
      (match) => match.Face.FaceId
    );

    const dynamoResults = await Promise.all(
      faceMatches.map((faceId) => {
        return queryByFaceId(faceId, collectionId);
      })
    );

    const promises = dynamoResults.map(async (item) => {
      if(item){
        const url = await getPresignedUrl(item.S3Path);
        const thumbnailKey = item.S3Path.replace(`${eventId}/`, `image-thumbnails/${eventId}/`);
        const thumbnailUrl = await getPresignedUrl(thumbnailKey);
        return {
          originalUrl : url,
          thumbnailUrl
        };
      }
    });

    let results = await Promise.all(promises);
    results = results.filter(item => item != null)
    res.json(results);
  } catch (error) {
    switch (error.name) {
      // trường hợp tìm bằng ảnh không có mặt
      case 'InvalidParameterException':
        res.json([])
        break;
      default:
        console.error(error);
        res.status(500).send("Error searching by image");
        break;
    }
  }
};

// Controller cho việc tìm kiếm bằng label
const searchByLabel = async (req, res) => {
  const eventId = req.body.eventId || req.query.eventId;
  const collectionId = `collection-${eventId}`;
  try {
    const label = req.query.label;
    const dynamoResults = await queryByLabel(label, collectionId);
    res.json(dynamoResults);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error searching by label");
  }
};


const deleteImageByKey = async (req, res) => {
  const s3Key = req.body.key || req.query.key;
  try {
    await deleteImage(s3Key);
    res.json(true)
  } catch (error) {
    console.error(error);
    res.status(500).send("Delete Imaga Fail");
  }
};

module.exports = {
  uploadImages,
  uploadImagesByGoogleDrive,
  searchByImage,
  searchByLabel,
  uploadFileImageFaceSetup,
  getListAllFaceSetup,
  searchImageByNameFaceSetup,
  deleteImageByKey
};
