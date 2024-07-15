import multer from "multer";

const storage=multer.memoryStorage();


const singleUpload=multer({storage}).single("file");


export default singleUpload;

//this middleware should add beafore upload route 