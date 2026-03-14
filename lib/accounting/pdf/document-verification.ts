import QRCode from "qrcode";

const DEFAULT_VERIFY_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://smsok.9phum.me";

function getVerifyBaseUrl() {
  const baseUrl =
    process.env.DOCUMENT_VERIFY_BASE_URL ||
    process.env.NEXT_PUBLIC_DOCUMENT_VERIFY_BASE_URL ||
    DEFAULT_VERIFY_BASE_URL;

  return baseUrl.replace(/\/+$/, "");
}

export function buildDocumentVerificationUrl(documentNumber: string) {
  const baseUrl = getVerifyBaseUrl();
  const encodedDocumentNumber = encodeURIComponent(documentNumber);

  if (baseUrl.endsWith("/verify")) {
    return `${baseUrl}/${encodedDocumentNumber}`;
  }

  return `${baseUrl}/verify/${encodedDocumentNumber}`;
}

export async function buildDocumentVerificationAssets(documentNumber: string) {
  const verificationUrl = buildDocumentVerificationUrl(documentNumber);
  const verificationQrDataUrl = await QRCode.toDataURL(verificationUrl, {
    margin: 0,
    width: 128,
  });

  return {
    verificationUrl,
    verificationQrDataUrl,
  };
}
