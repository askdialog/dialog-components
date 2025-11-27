import { useEffect, type FC, type ReactNode } from "react";
import { type Theme } from "@askdialog/dialog-sdk";

interface ThemeProviderProps {
  theme: Theme;
  children: ReactNode;
}

const camelCaseToKebabCase = (label: string): string => {
  return label.replace(/([A-Z])/g, "-$1").toLowerCase();
};

const applyTheme = (theme: Theme): void => {
  if (!theme) return;

  const body = document.body;

  Object.keys(theme).forEach((key) => {
    const themeKey = key as keyof Theme;
    const kebabCaseKey = camelCaseToKebabCase(key);

    if (theme[themeKey] !== undefined) {
      if (typeof theme[themeKey] === "object") {
        Object.keys(theme[themeKey] as Record<string, unknown>).forEach(
          (childKey) => {
            const themeChildKey = childKey as keyof Theme[typeof themeKey];
            if (themeChildKey !== undefined) {
              const kebabCaseChildKey = camelCaseToKebabCase(childKey);
              const themeValue = theme[themeKey] as Record<string, string>;

              body.style.setProperty(
                `--dialog-theme-${kebabCaseKey}-${kebabCaseChildKey}`,
                themeValue[themeChildKey]?.toString(),
              );
            }
          },
        );
        return;
      }

      if (themeKey === "ctaBorderType") {
        const borderRadius = theme[themeKey] === "rounded" ? "24px" : "0";
        body.style.setProperty(`--dialog-theme-${kebabCaseKey}`, borderRadius);
        return;
      }

      body.style.setProperty(
        `--dialog-theme-${kebabCaseKey}`,
        (theme[themeKey] as string | number | boolean).toString(),
      );
    }
  });
};

export const ThemeProvider: FC<ThemeProviderProps> = ({ theme, children }) => {
  useEffect(() => {
    if (theme) {
      applyTheme(theme);
    }
  }, [theme]);

  return <>{children}</>;
};
