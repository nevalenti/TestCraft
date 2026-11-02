import { createContext, useContext } from "react";

interface FieldAttributes {
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
}

export const FormFieldContext = createContext<FieldAttributes>({});

export const useFormFieldAttributes = (
  props: FieldAttributes,
): FieldAttributes => {
  const field = useContext(FormFieldContext);
  const descriptions = [field["aria-describedby"], props["aria-describedby"]]
    .filter(Boolean)
    .join(" ")
    .split(" ")
    .filter(Boolean);
  return {
    id: props.id ?? field.id,
    "aria-describedby": [...new Set(descriptions)].join(" ") || undefined,
    "aria-invalid": field["aria-invalid"] || props["aria-invalid"],
  };
};
