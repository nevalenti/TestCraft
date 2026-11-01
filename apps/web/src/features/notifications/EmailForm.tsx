import { zodResolver } from "@hookform/resolvers/zod";
import { NotificationEvent } from "@testcraft/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/form/FormActions";
import { FormField } from "@/components/ui/form/FormField";
import { FormInput } from "@/components/ui/form/FormInput";
import { EventCheckboxes } from "@/features/notifications/EventCheckboxes";
import { AVAILABLE_EVENTS } from "@/features/notifications/notificationEvents";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Must be a valid email"),
  events: z
    .array(z.nativeEnum(NotificationEvent))
    .min(1, "Select at least one event"),
});

type FormValues = z.infer<typeof schema>;

interface EmailFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const EmailForm = ({
  onSubmit,
  onCancel,
  isLoading,
}: EmailFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", events: AVAILABLE_EVENTS },
  });
  const events = watch("events");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Email address"
        htmlFor="email-subscription-address"
        error={errors.email?.message}
      >
        <FormInput
          id="email-subscription-address"
          type="email"
          placeholder="alerts@example.com"
          hasError={!!errors.email}
          autoFocus
          {...register("email")}
        />
      </FormField>
      <FormField label="Events" error={errors.events?.message}>
        <EventCheckboxes
          selected={events}
          onChange={(next) => setValue("events", next)}
        />
      </FormField>
      <FormActions
        onCancel={onCancel}
        isLoading={isLoading}
        label="Add Email"
      />
    </form>
  );
};
