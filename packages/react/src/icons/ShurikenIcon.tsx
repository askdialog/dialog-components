import type { FC } from "react";

// Exact path of the design system's ShurikenIcon, fitted to a 12×12 viewBox.
const SHURIKEN_PATH =
  "M5.3217 0.588255C5.63241 -0.196084 6.36759 -0.196085 6.6783 0.588254C6.98901 1.37259 7.68193 2.82807 8.42693 3.57307C9.17193 4.31807 10.6274 5.01099 11.4117 5.3217C12.1961 5.63241 12.1961 6.36759 11.4117 6.6783C10.6274 6.98901 9.17193 7.68193 8.42693 8.42693C7.68193 9.17193 6.98901 10.6274 6.6783 11.4117C6.36759 12.1961 5.63241 12.1961 5.3217 11.4117C5.01099 10.6274 4.31807 9.17193 3.57307 8.42693C2.82808 7.68193 1.37259 6.98901 0.588255 6.6783C-0.196084 6.36759 -0.196085 5.63241 0.588254 5.3217C1.37259 5.01099 2.82807 4.31807 3.57307 3.57307C4.31807 2.82808 5.01099 1.37259 5.3217 0.588255Z";

interface ShurikenIconProps {
  color?: string;
}

export const ShurikenIcon: FC<ShurikenIconProps> = ({
  color = "currentColor",
}) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d={SHURIKEN_PATH} fill={color} />
  </svg>
);
