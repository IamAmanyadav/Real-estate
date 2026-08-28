import os
from dotenv import load_dotenv

load_dotenv()

import cloudinary
import cloudinary.uploader

cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
)

try:
    print("Uploading test image...")
    # create a dummy text file to act as an image for cloudinary testing
    with open("test_dummy.txt", "w") as f:
        f.write("dummy content")
        
    res = cloudinary.uploader.upload(
        "test_dummy.txt",
        folder="real_estate/properties",
        resource_type="raw"
    )
    print("Upload successful!")
    print("URL:", res.get("secure_url"))
except Exception as e:
    print("Error:", e)
finally:
    if os.path.exists("test_dummy.txt"):
        os.remove("test_dummy.txt")
