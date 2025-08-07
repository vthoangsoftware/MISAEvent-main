import axios from 'axios'

// Cấu hình URL backend API
const API_BASE_URL = import.meta.env.VITE_API_URL
const apiEvent = API_BASE_URL + '/event'
// Tạo collection cho sự kiện
export const createEventCollection = async evntInfo => {
  const response = await axios.post(
    `${apiEvent}/create-event-collection`,
    evntInfo,
  )
  return response.data
}

export const updateEventCollection = async evntInfo => {
  const response = await axios.post(
    `${apiEvent}/update-event-collection`,
    evntInfo,
  )
  return response.data
}

export const uploadThumbnail = async (eventId, thumbnailFile) => {
  const formData = new FormData()
  formData.append('thumbnail', thumbnailFile)

  const response = await axios.post(
    `${apiEvent}/upload-thumbnail/${eventId}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data
}

// Lấy thông tin collection của sự kiện
export const getEventCollection = async eventId => {
  try {
    const savedUsername = localStorage.getItem('username')
    const savedPassword = localStorage.getItem('password')
    let authHeader = null
    if (savedUsername && savedPassword) {
      authHeader = {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${savedUsername}:${savedPassword}`)}`, // Sử dụng Basic Auth
      }
    }

    const response = await axios.get(
      `${apiEvent}/get-event-collection/${eventId}`, {
      headers: authHeader ? authHeader : {},
    }
    )
    return response.data
  } catch (error) {
    console.error('Error fetching event collection:', error)
    throw new Error('Failed to fetch event collection')
  }
}

// Lấy danh sách sự kiện với phân trang
export const getPagedEvents = async (limit, lastEvaluatedKey, searchText, isListAll = true) => {
  try {
    const savedUsername = localStorage.getItem('username')
    const savedPassword = localStorage.getItem('password')
    let authHeader = null
    if (savedUsername && savedPassword) {
      authHeader = {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${savedUsername}:${savedPassword}`)}`, // Sử dụng Basic Auth
      }
    }

    const response = await axios.get(`${apiEvent}/get-paged-events`, {
      params: {
        limit,
        lastEvaluatedKey,
        searchText,
        isListAll
      },
      headers: authHeader ? authHeader : {},
    })
    return response.data
  } catch (error) {
    console.error('Error fetching paged events:', error)
    throw new Error('Failed to fetch paged events')
  }
}

// Lấy danh sách ảnh phân trang trong folder eventId
export const getPagedImagesInEventFolder = async (
  eventId,
  pinCode,
  limit,
  continuationToken = null,
  isGetTotal,
) => {
  try {
    const response = await axios.get(`${apiEvent}/images/paged/${eventId}`, {
      params: {
        limit,
        continuationToken,
        isGetTotal,
      },
      headers: {
        'x-pin-code': pinCode,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching paged images in event folder:', error)
    if (error.response?.data?.message) {
      throw new Error(error.response?.data?.message)
    } else {
      throw new Error('Failed to fetch paged images in event folder')
    }
  }
}

// Xóa collection của sự kiện
export const deleteEventCollection = async (eventId, pinCode) => {
  try {
    const response = await axios.delete(
      `${apiEvent}/delete-event-collection/${eventId}`,
      {
        headers: {
          'x-pin-code': pinCode,
        },
      },
    )
    return response.data
  } catch (error) {
    console.error('Error deleting event collection:', error)
    throw new Error('Failed to delete event collection')
  }
}
