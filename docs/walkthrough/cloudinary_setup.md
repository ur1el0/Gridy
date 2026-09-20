# Cloudinary Media Storage Configuration & Setup Guide

Gridy uses **Cloudinary** to store and serve image attachments uploaded by residents when filing incident reports. This secures fast load times, offloads file traffic from our main servers, and provides automated image compression.

---

## Step 1: Obtain Cloudinary Credentials

1. Go to the [Cloudinary website](https://cloudinary.com/) and register or sign in.
2. Navigate to your **Console Dashboard**.
3. Locate your **Product Environment Credentials**:
   * **Cloud Name**
   * **API Key**
   * **API Secret**

---

## Step 2: Configure Environment Variables

1. Open your `backend/.env` file.
2. Paste the retrieved credentials into the following environment fields:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Step 3: Media Upload Flow

When a resident submits an incident report via the mobile or web application:

1. **Client Action:** Post request payload with `multipart/form-data` formatting to:
   `POST /api/v1/reports/`
2. **Backend Processing:**
   * Receives request variables (`title`, `description`, `location`) and the binary file stream (`image`).
   * Gridy automatically intercepts the binary attachment, compresses the file, and pushes it directly to Cloudinary.
   * On successful response from Cloudinary, the backend stores the secure URL (`image_url`) inside our database tables and returns it to the client.
3. **Response:**
   ```json
   {
     "id": 12,
     "title": "Road Hazard",
     "image_url": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234/report_road_hazard.jpg",
     "status": "PENDING"
   }
   ```
   *(Mobile and Web clients can load and render this `image_url` directly inside their interfaces).*
