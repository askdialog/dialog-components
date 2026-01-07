export interface Theme {
  backgroundColor?: string;
  primaryColor?: string;
  ctaTextColor?: string;
  ctaBorderType?: "straight" | "rounded";
  capitalizeCtas?: boolean;
  fontFamily?: string;
  highlightProductName?: boolean;
  title?: {
    fontSize?: string;
    color?: string;
  };
  description?: {
    fontSize?: string;
    color?: string;
  };
  content?: {
    fontSize?: string;
    color?: string;
  };
}
