import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef(({ className, ...props }, ref) => {
  const [darkMode, setDarkMode] = React.useState(false);

  React.useEffect(() => {
    const checkDarkMode = () => {
      setDarkMode(localStorage.getItem('adminDarkMode') === 'true');
    };
    checkDarkMode();
    const interval = setInterval(checkDarkMode, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <LabelPrimitive.Root 
      ref={ref} 
      className={cn(labelVariants(), darkMode && "text-gray-300", className)} 
      {...props} 
    />
  );
})
Label.displayName = LabelPrimitive.Root.displayName

export { Label }