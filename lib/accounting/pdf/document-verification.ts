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

export function buildDocumentVerificationUrl(verificationCode: string) {
  const baseUrl = getVerifyBaseUrl();
  const encoded = encodeURIComponent(verificationCode);

  if (baseUrl.endsWith("/verify")) {
    return `${baseUrl}/${encoded}`;
  }

  return `${baseUrl}/verify/${encoded}`;
}

export async function buildDocumentVerificationAssets(verificationCode: string) {
  const verificationUrl = buildDocumentVerificationUrl(verificationCode);
  const verificationQrDataUrl = await QRCode.toDataURL(verificationUrl, {
    margin: 0,
    width: 128,
  });

  return {
    verificationUrl,
    verificationQrDataUrl,
  };
}
