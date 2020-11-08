const express = require("express");
const { Storage } = require("@google-cloud/storage");
const multer = require("multer");
const path = require("path");
const uploadMusicsMiddleware = multer({
    storage: multer.diskStorage({
      destination: path.join(__dirname, '../upload/musics'),
      filename: function (req, file, cb) {
        cb(null, `${file.originalname.split(".")[0]}-${Date.now()}.mp3`);
      },
    }),
  }).fields([{ name: "musics", maxCount: 100 }]);

const router = express.Router();

router.post("/", uploadMusicsMiddleware, async (req, res) => {
  try {
    const storage = new Storage({ keyFilename: "key.json" });
    const bucketName = "test";
    const time = new Date();
    const [month, year] = [time.getMonth() + 1, time.getFullYear()];

    const { musics } = req.files;

    let result = [];

    for (let i = 0; i < musics.length; ++i) {
      const file = musics[i];

      const filePath = path.join(
        __dirname,
        "../upload/musics/" + file.filename
      );

      const upload = await storage.bucket(bucketName).upload(filePath, {
        gzip: true,
        resumable: false,
        destination: year + "/" + month + "/" + file.filename,
        metadata: {
          cacheControl: "public, max-age=31536000",
        },
      });
      await storage.bucket(bucketName).file(year + "/" + month + "/" + file.filename).makePublic();

      result.push({ url: upload[0].metadata.mediaLink });
      // delete uploaded file
      fs.unlinkSync(
        path.join(__dirname, "../upload/musics/" + file.filename)
      );
    }
    res.json({ result });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/delete', async(req, res) => {
    const storage = new Storage({ keyFilename: "key.json" });
    const bucketName = "test";

    const {fileName} = req.body;
    await storage.bucket(bucketName).file(fileName).delete();

    res.sendStatus(200);
});
module.exports = router;
