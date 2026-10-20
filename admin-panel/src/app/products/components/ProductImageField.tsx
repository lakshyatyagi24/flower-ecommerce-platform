import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { IMAGE_URL_ERROR } from "@/lib/image-url";
import { isImageInvalid, isLegacyInlineImage } from "../product-form";

type ProductImageFieldProps = {
  image: string;
  uploading: boolean;
  onImageChange: (value: string) => void;
  onFile: (file: File | null) => void;
};

export function ProductImageField({ image, uploading, onImageChange, onFile }: ProductImageFieldProps) {
  return (
    <div>
      <Label>Product image</Label>
      <div className="space-y-2 mt-1">
        <Input
          placeholder="Image URL (https://…) or upload below"
          value={image}
          onChange={(e) => onImageChange(e.target.value)}
        />
        {isImageInvalid(image) && <p className="text-xs text-red-600">{IMAGE_URL_ERROR}</p>}
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          disabled={uploading}
          onChange={(e) => {
            onFile(e.target.files?.[0] || null);
            e.target.value = "";
          }}
        />
        {uploading && (
          <p className="text-xs text-muted-foreground flex items-center">
            <Loader2 className="mr-2 h-3 w-3 animate-spin" /> Uploading image…
          </p>
        )}
        {image && <div className="w-32 h-32 rounded border overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />}
        {isLegacyInlineImage(image) && (
          <p className="text-xs text-amber-600">Legacy inline image. It will be left unchanged unless you upload a new one or paste a URL.</p>
        )}
        <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or AVIF, up to 5 MB. Uploaded to Cloudinary.</p>
      </div>
    </div>
  );
}
