import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const bucketName = process.env.CLOUDFLARE_BUCKET_NAME || "";

const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "";

// Opcional: se você tiver um domínio público pro R2 (recomendado p/ público)
// Ex: https://cdn.portaldoaluno.santos-tech.com
const publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || "").replace(/\/+$/, "");

function assertEnv() {
  if (!accountId) throw new Error("CLOUDFLARE_ACCOUNT_ID não definido");
  if (!bucketName) throw new Error("CLOUDFLARE_BUCKET_NAME não definido");
  if (!accessKeyId) throw new Error("CLOUDFLARE_ACCESS_KEY_ID não definido");
  if (!secretAccessKey) throw new Error("CLOUDFLARE_SECRET_ACCESS_KEY não definido");
}

assertEnv();

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
  // IMPORTANTÍSSIMO pro R2 + presign + compatibilidade
  forcePathStyle: true,
});

export type UploadFile = {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
};

function extFromName(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function buildKey(folder: string, originalname: string) {
  const safeFolder = (folder || "materiais").replace(/^\/+|\/+$/g, "");
  const ext = extFromName(originalname);
  const id = uuidv4();
  return ext ? `${safeFolder}/${id}.${ext}` : `${safeFolder}/${id}`;
}

/**
 * Upload para R2
 * Retorna:
 * - key: caminho dentro do bucket
 * - publicUrl: se R2_PUBLIC_BASE_URL estiver setado (p/ conteúdo público)
 */
export async function uploadToR2(file: UploadFile, folder: string = "materiais") {
  if (!file?.buffer?.length) throw new Error("Arquivo vazio");

  const key = buildKey(folder, file.originalname);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const publicUrl = publicBaseUrl ? `${publicBaseUrl}/${key}` : null;

  return { key, publicUrl };
}

/**
 * Gera Signed URL (GET) para baixar/abrir o arquivo por X segundos
 */
export async function getSignedGetUrl(key: string, expiresInSeconds: number = 300) {
  if (!key) throw new Error("key obrigatória");

  const cmd = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, cmd, { expiresIn: expiresInSeconds });
  return url;
}

/**
 * Deleta do R2 usando a key
 */
export async function deleteFromR2ByKey(key: string): Promise<void> {
  if (!key) return;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

/**
 * Se você só tem URL salva no banco e quer deletar:
 * - se for URL do teu domínio público, extrai o path
 * - se for URL do endpoint, também extrai
 */
export async function deleteFromR2(fileUrlOrKey: string): Promise<void> {
  try {
    if (!fileUrlOrKey) return;

    // Se já parece ser key (não tem http)
    if (!fileUrlOrKey.startsWith("http")) {
      await deleteFromR2ByKey(fileUrlOrKey);
      return;
    }

    const url = new URL(fileUrlOrKey);
    const key = url.pathname.replace(/^\/+/, "");
    if (!key) return;

    await deleteFromR2ByKey(key);
  } catch (err) {
    console.error("Erro ao deletar no R2:", err);
    // aqui você decide: ou joga erro, ou ignora como fazia antes
  }
}
