const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage }).array("file", 5);

module.exports = upload;
