import axios from 'axios'

// Cấu hình URL backend API
const API_BASE_URL = import.meta.env.VITE_API_URL
const apiImage = API_BASE_URL + '/image'
// Tải nhiều ảnh lên
export const uploadImages = async (eventId, pinCode, files) => {
  const formData = new FormData()

  // Thêm tất cả các file vào formData
  files.forEach(file => {
    formData.append('files', file)
  })

  try {
    const response = await axios.post(
      `${apiImage}/upload-images?eventId=${eventId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-pin-code': pinCode,
        },
      },
    )
    return response.data // Trả về kết quả từ API
  } catch (error) {
    console.error('Error uploading images:', error)
  }
}

export const uploadImagesByDrive = async (eventId, driveFolderId) => {
  try {
    const response = await axios.post(`${apiImage}/upload-images-by-drive`, {
      eventId: eventId,
      driveFolderId: driveFolderId,
    })
    return response.data // Trả về kết quả từ API
  } catch (error) {
    console.error('Error uploading images:', error)
  }
}

export const deleteImageByKey = async (eventId, key, pinCode) => {
  try {
    const response = await axios.post(
      `${apiImage}/delete-image`,
      {
        eventId: eventId,
        key: key,
      },
      {
        headers: {
          'x-pin-code': pinCode,
        },
      },
    )
    return response.data // Trả về kết quả từ API
  } catch (error) {
    console.error('Error uploading images:', error)
  }
}

// Tìm kiếm bằng ảnh tải lên
export const searchByImage = async (eventId, pinCode, file) => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await axios.post(
      `${apiImage}/search-by-image?eventId=${eventId}`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'x-pin-code': pinCode,
        },
      },
    )
    return response.data // Trả về kết quả từ API
  } catch (error) {
    console.error('Error searching by image:', error)
  }
}

// Tìm kiếm bằng  name
export const searchImageByNameFaceSetup = async (eventId, pinCode, name) => {
  const response = await axios.post(
    `${apiImage}/search-by-name`,
    {
      eventId: eventId,
      name: name,
    },
    {
      headers: {
        'x-pin-code': pinCode,
      },
    },
  )
  return response.data // Trả về kết quả từ API
}

// Lưu ý đặt tên file giống name
export const uploadFaceSetup = async files => {
  try {
    const formData = new FormData()
    // Thêm tất cả các file vào formData
    files.forEach(file => {
      formData.append('files', file)
    })

    const response = await axios.post(
      `${apiImage}/upload-face-setup`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )
    return response.data
  } catch (error) {
    console.error('Error uploadFaceSetup:', error)
  }
}

export const getFaceSetup = async () => {
  try {
    const response = await axios.get(`${apiImage}/get-face-setup`)
    return response.data
  } catch (error) {
    console.error('Error getFaceSetup:', error)
  }
}

// Tìm kiếm bằng label
// export const searchByLabel = async (eventId, pinCode, label) => {
//     try {
//         const response = await axios.get(`${API_BASE_URL}/search-by-label`, {
//             params: {
//                 eventId,
//                 pinCode,
//                 label
//             }
//         });
//         return response.data;  // Trả về kết quả từ API
//     } catch (error) {
//         console.error('Error searching by label:', error);
//         throw new Error('Failed to search by label');
//     }
// };
