require('dotenv').config();

const port = process.env.PORT || 3000;

const express = require('express');
const app = express();

const multer = require('multer');
const inMemoryStorage = multer.memoryStorage();
const uploadStrategy = multer({ storage: inMemoryStorage }).single('file');

const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");
const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accessKey = process.env.AZURE_STORAGE_ACCOUNT_ACCESS_KEY;
const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accessKey
);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

const containerName = 'images';

const uploadBlob = async (blobName, content) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(content, content.length);
  console.log(`Upload block blob "${blobName}" successfully`);
};

const getBlobList = async () => {
  const containerClient = blobServiceClient.getContainerClient(containerName);
  const blobs = containerClient.listBlobsFlat();
  const blobList = [];
  
  for await (const blob of blobs) {
    blobList.push(blob.name);
  }

  return blobList;
}

app.get('/', async (req, res) => {
  const blobList = await getBlobList();
  res.render('index.ejs', { accountName, containerName , blobList });
});

app.post('/upload', uploadStrategy, (req, res) => {
  console.log(req.file);
  const content = req.file.buffer;
  const blobName = new Date().getTime() + '-' + req.file.originalname;
  uploadBlob(blobName, content);
  res.redirect('/');
})

app.listen(port, () => {
  console.log(`app listening on http://localhost:${port}`);
});
