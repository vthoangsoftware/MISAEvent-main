self.onmessage = async event => {
  const { files } = event.data;
  const compressedFiles = []; // Mảng lưu trữ các file nén
  const maxFileSize = 1.5 * 1024 * 1024; // Kích thước tối đa cho file nén (1.5MB)
  const maxAttempts = 10; // Số lần tối đa để nén
  const maxHeight = 1024;
  const maxWidth = 2048;
  const delay = ms => new Promise(resolve => setTimeout(resolve, ms)); // Hàm chờ

  for (const file of files) {
    let compressedBlob;
    let attempts = 0; // Biến để đếm số lần nén

    // Đọc dữ liệu ảnh từ file
    const imgBitmap = await createImageBitmap(file);

    // Kiểm tra nếu file nhỏ hơn maxFileSize và không cần nén
    if (file.size <= maxFileSize && imgBitmap.width <= maxWidth && imgBitmap.height <= maxHeight) {
      self.postMessage({
        originalFile: file,
      });
      continue;
    }

    while (attempts < maxAttempts) {
      try {
        // Đảm bảo bạn await khi gọi compressImage
        compressedBlob = await compressImage(imgBitmap, attempts, maxWidth, maxHeight, file);

        // Kiểm tra kích thước nén
        if (compressedBlob && compressedBlob.size <= maxFileSize) {
          // Chuyển compressedBlob thành File với tên file gốc
          const compressedFile = new File([compressedBlob], file.name, {
            type: file.type,
          });

          // Thêm vào mảng compressedFiles
          compressedFiles.push(compressedFile);
          self.postMessage({
            compressedFile: compressedFile,
          });

          self.postMessage({
            progress: {
              completed: compressedFiles.length,
              total: files.length,
            },
          });

          if (compressedFiles.length === files.length) {
            // Gửi tất cả file nén về main thread sau khi nén xong
            self.postMessage({ compressedFiles });
          }
          break;
        }

        // Tăng số lần nén và chờ một thời gian ngắn trước lần nén tiếp theo
        attempts++;
        await delay(50); // Thời gian chờ giữa các lần nén (50ms)
      } catch (error) {
        // Gửi thông báo lỗi nếu có
        self.postMessage({ error: `Error compressing file ${file.name}: ${error.message}` });
        break; // Thoát nếu có lỗi
      }
    }

    // Nếu không nén thành công sau các lần thử
    if (!compressedBlob || compressedBlob.size > maxFileSize) {
      self.postMessage({
        error: `File ${file.name} exceeds 2MB after maximum compression attempts.`,
      });
    }
  }
}

async function compressImage(imgBitmap, attempts, maxWidth, maxHeight, file) {
  // Tính toán lại kích thước dựa trên kích thước tối thiểu
  const scaleFactor = Math.max(
    maxWidth / imgBitmap.width,
    maxHeight / imgBitmap.height
  );

  const newWidth = Math.round(imgBitmap.width * scaleFactor);
  const newHeight = Math.round(imgBitmap.height * scaleFactor);

  // Tạo canvas để nén ảnh
  const resultCanvas = new OffscreenCanvas(newWidth, newHeight);
  const resultContext = resultCanvas.getContext('2d');

  // Vẽ lại ảnh lên canvas với kích thước mới
  resultContext.drawImage(
    imgBitmap,
    0,
    0,
    newWidth,
    newHeight,
  );

  // Chuyển đổi canvas nén sang blob
  const compressedBlob = await resultCanvas.convertToBlob({
    type: file.type,  // Sử dụng file.type thay vì imgBitmap.type
    quality: Math.max(0.8, (1 - 0.05 * attempts)),
  });

  return compressedBlob;
}
