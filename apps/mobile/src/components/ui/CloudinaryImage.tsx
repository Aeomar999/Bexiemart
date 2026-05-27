import React from 'react';
import { Image, ImageProps } from 'expo-image';
import { Cloudinary } from '@cloudinary/url-gen';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';
import { auto } from '@cloudinary/url-gen/qualifiers/format';
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality';

const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'duirkgqop'
  }
});

interface CloudinaryImageProps extends Omit<ImageProps, 'source'> {
  publicId?: string | null;
  width?: number;
  height?: number;
}

export function CloudinaryImage({ publicId, width, height, style, ...props }: CloudinaryImageProps) {
  if (!publicId) return null;

  // Fallback for full URLs
  if (publicId.startsWith('http')) {
    return <Image source={{ uri: publicId }} style={style} {...props} />;
  }

  let img = cld.image(publicId);

  if (width && height) {
    img = img.resize(fill().width(width).height(height));
  } else if (width) {
    img = img.resize(fill().width(width));
  } else if (height) {
    img = img.resize(fill().height(height));
  }

  img = img
    .delivery(format(auto()))
    .delivery(quality(autoQuality()));

  const url = img.toURL();

  return (
    <Image 
      source={{ uri: url }} 
      style={[{ width, height }, style as any]} 
      {...props} 
    />
  );
}
