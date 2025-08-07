export  function formatDate(date) {
     if (date == null) {
        return ;
    }
    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) {
        return ;
    }
    const day = String(newDate.getDate()).padStart(2, '0');
    const month = String(newDate.getMonth() + 1).padStart(2, '0');
    const year = newDate.getFullYear();
    return `${day}/${month}/${year}`;
}
