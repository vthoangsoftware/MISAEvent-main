const express = require('express');
const app = express();
const cors = require('cors');
// Mở quyền CORS cho tất cả các domain
app.use(cors());

// app.use(cors({
//     origin: 'http://localhost:5173',
// }));

require('dotenv').config();  // Đọc các biến môi trường từ .env
// Import routes
const eventRoutes = require('./routes/eventRoutes');
const imageRoutes = require('./routes/imageRoutes');


// Middleware
app.use(express.json());

// Sử dụng các route
app.use('/api/event', eventRoutes);
app.use('/api/image', imageRoutes);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Khởi động server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});