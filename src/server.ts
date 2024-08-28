import express, { Request, Response } from 'express';
// import multer from 'multer';
import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import fileUpload, { UploadedFile } from 'express-fileupload';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(fileUpload({
  limits: { fileSize: 100 * 1024 * 1024 },
}))

// Set up Google Cloud Storage
const storage = new Storage();
const bucketName = 'test-mvp-1';
const bucket = storage.bucket(bucketName);

// Set up multer for file uploads
// const upload = multer({
//   storage: multer.memoryStorage(), // Use memory storage to avoid saving files locally
// });

// Image upload endpoint
app.post('/api/upload', async (req: Request, res: Response) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }
  const file = req.files.video as UploadedFile;
  console.log(file);
  const fileName = `${uuidv4()}-${file.name}`;
  const blob = bucket.file(`${fileName}`);

  // Upload the file to GCS
  const blobStream = blob.createWriteStream({
    resumable: false,
  });

  blobStream.on('error', (err) => {
    console.error('Upload error:', err);
    res.status(500).send('Upload to GCS failed.');
  });

  
  blobStream.on('finish', async () => {

    // Make the file publicly accessible
    // await blob.makePublic();
    // Public URL of the uploaded image
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    // Trigger Cloud Function to process the image
    try {
      const processedVideoUrl = await triggerCloudFunction(publicUrl);
      res.json({ message: 'File uploaded and processed successfully.', processedVideoUrl });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).send('Image processing failed.');
    }
  });

  blobStream.end(file.data);
});

// Function to trigger Cloud Function and get the processed image URL
const triggerCloudFunction = async (imageUrl: string): Promise<string> => {
  // Replace with the actual API call to your Cloud Function
  // Here, you can use axios or any other HTTP client to trigger the function
  // For this example, let's assume the function returns the processed image URL
  const processedVideoUrl = imageUrl;
  return processedVideoUrl;
};

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});