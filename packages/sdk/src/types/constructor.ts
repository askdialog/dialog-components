import { SimplifiedProduct } from "./product";
import { Theme } from "./theme";

export interface DialogConstructor {
  apiKey: string;
  locale: string;
  callbacks: {
    addToCart: ({
      productId,
      quantity,
      price,
      variantId,
      currency,
    }: {
      productId: string;
      quantity: number;
      price?: string;
      variantId?: string;
      currency?: string;
    }) => Promise<void>;
    getProduct: (
      productId: string,
      variantId?: string,
    ) => Promise<SimplifiedProduct>;
  };
  theme?: Partial<Theme>;
  userId?: string;
}
