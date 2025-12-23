import QRCode from "qrcode";

const generateQR = async (data) => {
  return await QRCode.toDataURL(data);
};

export default generateQR;
