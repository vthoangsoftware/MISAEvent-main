const {google} = require('googleapis');
const sharp = require('sharp');
require("dotenv").config();

const apiKey = process.env.GOOGLE_API_KEY || 'AIzaSyA9rMRfWYnATggopbN_-kkll8oknSP96bU';
const drive = google.drive({ version: "v3", auth: apiKey });
const MAX_SIZE_IMAGE = 1.5 * 1024 * 1024
const IMAGE_WIDTH = 2048
const MAX_CONCURRENT_REQUESTS = 5; // Số lượng yêu cầu tối đa mỗi batch
const DELAY_BETWEEN_BATCHES = 500; // Thời gian nghỉ giữa mỗi batch
const MAX_RETRIES = 3; // Số lần thử lại tối đa

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Hàm lấy các file ảnh từ Google Drive
async function listDriveImages(driveFolderId) {
  try {
    const response = await drive.files.list({
      q: `'${driveFolderId}' in parents and mimeType contains 'image/'`,
      fields: 'files(id, name, mimeType)',
    });

    const files = response.data.files;
    if (files.length) {
      console.log('Files:');

      const results = [];
      for (let i = 0; i < files.length; i += MAX_CONCURRENT_REQUESTS) {
        const batch = files.slice(i, i + MAX_CONCURRENT_REQUESTS);
        const batchPromises = batch.map(async (file) => {
          try {
            let buffer = await downloadFileWithRetries(file.id, MAX_RETRIES);
            buffer = await compressImageUntilBelowLimit(buffer);
            file.buffer = buffer;
            console.log(`${file.name} (${file.id}) - MIME Type: ${file.mimeType}`);
            return file;
          } catch (err) {
            console.error(`Failed to process file ${file.id}:`, err);
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults.filter(Boolean));

        // Thực hiện nghỉ giữa các batch
        await sleep(DELAY_BETWEEN_BATCHES);
      }

      return results;
    } else {
      console.log('No image files found.');
      return [];
    }
  } catch (error) {
    console.error('Error fetching image files:', error);
    throw error;
  }
}

// Hàm tải nội dung file dưới dạng buffer với cơ chế retries
async function downloadFileWithRetries(fileId, retries) {
  let attempts = 0;
  while (attempts < retries) {
    try {
      return await downloadFileAsBuffer(fileId);
    } catch (error) {
      attempts++;
      if (attempts >= retries) throw error;
      console.log(`Retrying download for file ${fileId}, attempt ${attempts}`);
      await sleep(500); // Đợi 500ms trước khi thử lại
    }
  }
}

// Hàm tải nội dung file dưới dạng buffer 
async function downloadFileAsBuffer(fileId) {
  try {
    const response = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    const data = await new Promise((resolve, reject) => {
      const bufferArray = [];
      response.data
        .on('data', chunk => bufferArray.push(chunk))
        .on('end', () => resolve(Buffer.concat(bufferArray)))
        .on('error', reject);
    });

    return data;
  } catch (error) {
    console.error(`Error downloading file ${fileId}:`, error);
    throw error;
  }
}


async function compressImageUntilBelowLimit(buffer, maxSize = MAX_SIZE_IMAGE) {
  let quality = 80; 
  let compressedBuffer = buffer;

  while (compressedBuffer.length > maxSize && quality > 10) {
    compressedBuffer = await sharp(buffer)
      .resize({ width: IMAGE_WIDTH })
      .jpeg({ quality })
      .toBuffer();

    quality -= 10; // Giảm chất lượng dần
    console.log(`Compressed image to quality ${quality} with size: ${compressedBuffer.length / 1024} KB`);
  }

  if (compressedBuffer.length > maxSize) {
    throw new Error('Unable to compress under 1MB with the current settings.');
  }

  return compressedBuffer;
}


module.exports = {listDriveImages, downloadFileAsBuffer};