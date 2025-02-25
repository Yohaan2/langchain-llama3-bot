import multer from "multer";
import path from "path";
import crypto from "crypto";
import { Request, Response } from "express";

const uploadPath = process.env.STORAGE_PATH || './src/uploads/';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
     // Crear hash MD5 del nombre del archivo original
    const hash = crypto.createHash('md5')
    .update(file.originalname + Date.now())
    .digest('hex')
    
    // Mantener la extensión original del archivo
    const ext = path.extname(file.originalname);

    cb(null, hash + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // console.log(file)
  const allowedExtensions = ['application/pdf', 'application/xls', 'application/xlsx', 'application/csv', 'application/doc', 'application/docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png']
  const imagesExtensions = ['image/jpeg', 'image/png']
  const allowedTypes: Record<string, string[]> = {
    images: allowedExtensions,
    annexes: allowedExtensions,
    photographicSupport: imagesExtensions,
    file: allowedExtensions
  };

  // Verificar el campo del archivo para aplicar las validaciones correspondientes
  const allowedMimes = allowedTypes[file.fieldname] || [];
  
  if (!allowedMimes.includes(file.mimetype)) {
    cb(new Error(`Tipo de archivo no permitido para ${file.fieldname}`));
    return;
  }

  cb(null, true);
};

export const uploadMulter = multer({ storage, fileFilter });