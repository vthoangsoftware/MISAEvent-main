const {
  RekognitionClient,
  IndexFacesCommand,
  DetectCustomLabelsCommand,
  SearchFacesByImageCommand,
  CreateCollectionCommand,
  DeleteCollectionCommand,
} = require("@aws-sdk/client-rekognition");

const { getDecryptedAwsConfig } = require("../config/awsConfig");
const awsConfig = getDecryptedAwsConfig();
require("dotenv").config();

const rekognitionClient = new RekognitionClient(awsConfig);

const createCollection = async (collectionId) => {
  const command = new CreateCollectionCommand({ CollectionId: collectionId });
  const response = await rekognitionClient.send(command);
  return response;
};

const indexFaces = async (s3Bucket, s3Key, collectionId) => {
  const params = {
    CollectionId: collectionId,
    Image: {
      S3Object: {
        Bucket: s3Bucket,
        Name: s3Key,
      },
    },
  };
  return await rekognitionClient.send(new IndexFacesCommand(params));
};

// Hàm xóa Collection
const deleteCollection = async (collectionId) => {
  const params = {
    CollectionId: collectionId,
  };
  const command = new DeleteCollectionCommand(params);
  const response = await rekognitionClient.send(command);
  console.log(`Collection ${collectionId} deleted successfully.`);
  return response;
};

const detectCustomLabels = async (s3Bucket, s3Key) => {
  const params = {
    ProjectVersionArn: process.env.PROJECT_VERSION_ARRN,
    Image: {
      S3Object: {
        Bucket: s3Bucket,
        Name: s3Key,
      },
    },
  };
  return await rekognitionClient.send(new DetectCustomLabelsCommand(params));
};

const searchFacesByImage = async (collectionId, s3Bucket, s3Key) => {
  const params = {
    CollectionId: collectionId,
    Image: {
      S3Object: {
        Bucket: s3Bucket,
        Name: s3Key,
      },
    },
    MaxFaces: process.env.MaxFaceMatch || 100,
    FaceMatchThreshold: 90, // Độ tin cậy default 80,
  };
  return await rekognitionClient.send(new SearchFacesByImageCommand(params));
};

module.exports = {
  indexFaces,
  detectCustomLabels,
  searchFacesByImage,
  createCollection,
  deleteCollection,
};
