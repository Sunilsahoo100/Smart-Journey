import { Toaster as Sonner } from "sonner"
import { useTheme } from "@/context/ThemeContext"

const Toaster = ({
  ...props
}) => {
  const { resolvedTheme } = useTheme()

  return (
    (<Sonner
      theme={resolvedTheme}
      position="top-center"
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-xl group-[.toaster]:shadow-lg group-[.toaster]:font-sans",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props} />)
  );
}

export { Toaster }
