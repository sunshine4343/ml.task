const cloud = require("wx-server-sdk");
cloud.init();
exports.main = async (event, context) => {
  try {
    const { imgUrl } = event;
    const result = await cloud.openapi.ocr.printedText({
      type: "photo",
      imgUrl
    });
    return { ...result, ocrType: "printedText" };
  } catch (err) {
    console.log(err);
    return err;
  }
};
