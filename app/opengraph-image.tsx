import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SMSOK — บริการส่ง SMS Marketing & OTP API สำหรับธุรกิจ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0b1118 0%, #10161c 50%, #061019 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Accent glow */}
        <div
          style={{
            position: "absolute",
            top: "-120px",
            right: "-120px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,226,181,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(71,121,255,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Logo circle */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "20px",
            background: "#00E2B5",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#0b1118",
            }}
          />
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "56px",
            fontWeight: 800,
            color: "#F2F4F5",
            letterSpacing: "-1px",
            marginBottom: "12px",
          }}
        >
          SMSOK
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "24px",
            color: "#949FA8",
            maxWidth: "600px",
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          บริการส่ง SMS Marketing & OTP API
        </div>
        <div
          style={{
            fontSize: "20px",
            color: "#6b7280",
            marginTop: "8px",
          }}
        >
          สำหรับธุรกิจไทย · ราคาเริ่มต้น 0.15 บาท
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "4px",
            background: "linear-gradient(90deg, transparent, #00E2B5, #4779FF, transparent)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
