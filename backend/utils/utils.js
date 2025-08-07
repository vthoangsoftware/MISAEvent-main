const removeDiacritics = (str) => {
    if (!str) return;
    // Xóa dấu và chuyển về chữ thường
    return str
        .normalize('NFD') // Chuyển chuỗi thành dạng chuẩn NFD
        .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
        .toLowerCase(); // Chuyển về chữ thường
};
module.exports = { removeDiacritics };