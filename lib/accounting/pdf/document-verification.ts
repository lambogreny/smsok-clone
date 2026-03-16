import QRCode from "qrcode";
import { getDocumentVerificationBaseUrl } from "@/lib/env";

function getVerifyBaseUrl() {
  return getDocumentVerificationBaseUrl();
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
