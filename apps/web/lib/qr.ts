import "server-only";

import QRCode from "qrcode";

// QR code as an inline SVG, made on our own server (nothing sent to a QR service).
export function qrSvg(text: string) {
  return QRCode.toString(text, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#1f140e", light: "#ffffff" },
  });
}
