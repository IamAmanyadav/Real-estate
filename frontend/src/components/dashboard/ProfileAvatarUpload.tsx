"use client";

import { useState, useRef, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera, Loader2 } from "lucide-react";
import { getImageUrl, attachAuthToken } from "@/lib/utils";
import axios from "axios";
import { API_BASE_URL } from "@/lib/constants";

export default function ProfileAvatarUpload({ 
  currentAvatar, 
  name, 
  onUploadSuccess 
}: { 
  currentAvatar?: string | null; 
  name: string;
  onUploadSuccess: (url: string) => void;
}) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (imageSrc: string, pixelCrop: any): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => {
      image.onload = resolve;
    });

    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No 2d context");

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((file) => {
        if (file) resolve(file);
        else reject(new Error("Canvas is empty"));
      }, "image/jpeg");
    });
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      const croppedImageBlob = await createCroppedImage(imageSrc!, croppedAreaPixels);
      const file = new File([croppedImageBlob], "avatar.jpg", { type: "image/jpeg" });
      const formData = new FormData();
      formData.append("file", file);

      let config = await attachAuthToken({
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const { data } = await axios.post(`${API_BASE_URL}/uploads/avatar`, formData, config);
      
      onUploadSuccess(data.url);
      setImageSrc(null);
    } catch (err) {
      console.error("Failed to upload avatar", err);
      alert("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
        {currentAvatar ? (
          <img 
            src={getImageUrl(currentAvatar) || ""} 
            alt={name} 
            className="w-20 h-20 rounded-2xl object-cover shadow-lg shadow-emerald-500/25"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-emerald-500/25">
            {name.charAt(0)}
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Camera className="w-6 h-6 text-white" />
        </div>
      </div>
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        onChange={onFileChange} 
        className="hidden" 
      />

      <Dialog open={!!imageSrc} onOpenChange={(open) => !open && !isUploading && setImageSrc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-64 bg-black/10 rounded-xl overflow-hidden mt-2">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setImageSrc(null)} disabled={isUploading}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Picture
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
