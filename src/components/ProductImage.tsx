import Image from "next/image";
import { productImageSrc } from "@/lib/productImage";

type ProductImageProps = {
  name: string;
  imageUrl?: string | null;
  size?: "card" | "row";
};

export function ProductImage({
  name,
  imageUrl,
  size = "card",
}: ProductImageProps) {
  const src = productImageSrc(name, imageUrl);
  if (!src) return null;

  if (size === "row") {
    return (
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white">
        <Image
          src={src}
          alt=""
          fill
          sizes="80px"
          className="object-contain p-1.5"
        />
      </div>
    );
  }

  return (
    <div className="relative mb-5 aspect-square overflow-hidden rounded-2xl bg-white">
      <Image
        src={src}
        alt={name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-contain p-4"
      />
    </div>
  );
}
