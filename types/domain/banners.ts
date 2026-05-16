export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  imagePublicId?: string | null;
  altText: string;
  subtitle: string;
  linkUrl?: string | null;
  ctaLabel: string;
  order: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateBannerInput {
  title: string;
  imageUrl: string;
  imagePublicId?: string | null;
  altText?: string;
  subtitle?: string;
  linkUrl?: string;
  ctaLabel?: string;
  order?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

export interface UpdateBannerInput {
  title?: string;
  imageUrl?: string;
  imagePublicId?: string | null;
  altText?: string;
  subtitle?: string;
  linkUrl?: string;
  ctaLabel?: string;
  order?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}
