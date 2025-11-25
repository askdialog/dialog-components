export interface SimplifiedProductVariant {
  id: string;
  displayName?: string;
  inventoryQuantity?: number;
  price: string;
  currencyCode: string;
  compareAtPrice?: string | null;
  url?: string;
  selectedOptions?: {
    name: string;
    value: string;
  }[];
  image?: {
    url?: string;
  } | null;
}

export interface SimplifiedProductOption {
  values: string[];
  id: string;
  name: string;
  position: number;
}

export interface SimplifiedProduct {
  id: string;
  title: string;
  handle: string;
  descriptionHtml?: string;
  url?: string;
  totalInventory: number;
  featuredImage?: {
    url?: string;
  } | null;
  variants: SimplifiedProductVariant[];
  options?: SimplifiedProductOption[];
}
