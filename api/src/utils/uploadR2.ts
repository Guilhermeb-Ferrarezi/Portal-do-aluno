import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

const s3Client = new S3Client({
  region: "auto",
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "",
  },
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
});

const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || "";

/**
 * Upload de arquivo para CloudFlare R2
 * Retorna a URL pública do arquivo
 */
export async function uploadToR2(
  file: {
    originalname: string;
    buffer: Buffer;
    mimetype: string;
  },
  folder: string = "materiais"
): Promise<string> {
  if (!file.buffer || file.buffer.length === 0) {
    throw new Error("Arquivo vazio");
  }

  // Gera nome único para o arquivo
  const fileExtension = file.originalname.split(".").pop() || "";
  const uniqueFilename = `${folder}/${uuidv4()}.${fileExtension}`;

  const uploadParams = {
    Bucket: bucketName,
    Key: uniqueFilename,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3Client.send(new PutObjectCommand(uploadParams));

    // Retorna URL pública (CloudFlare R2 suporta URLs diretas)
    const fileUrl = `https://${bucketName}.b2.${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${uniqueFilename}`;
    return fileUrl;
  } catch (error) {
    throw new Error(`Erro ao fazer upload: ${error}`);
  }
}

/**
 * Deletar arquivo do CloudFlare R2
 */
export async function deleteFromR2(fileUrl: string): Promise<void> {
  try {
    // Extrai o caminho do arquivo da URL
    const urlParts = fileUrl.split(`.r2.cloudflarestorage.com/`);
    if (urlParts.length !== 2) {
      throw new Error("URL inválida");
    }

    const fileKey = urlParts[1];

    const deleteParams = {
      Bucket: bucketName,
      Key: fileKey,
    };

    await s3Client.send(new DeleteObjectCommand(deleteParams));
  } catch (error) {
    console.error(`Erro ao deletar arquivo: ${error}`);
    // Não lança erro aqui para evitar quebrar a deleção do material se R2 falhar
  }
}
