const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({ storage: storage }).array("files", 15);

module.exports = upload;
