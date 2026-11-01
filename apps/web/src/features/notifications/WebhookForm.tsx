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
  url: z.string().min(1, "URL is required").url("Must be a valid URL"),
  secret: z.string(),
  events: z
    .array(z.nativeEnum(NotificationEvent))
    .min(1, "Select at least one event"),
});

type FormValues = z.infer<typeof schema>;

interface WebhookFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const WebhookForm = ({
  onSubmit,
  onCancel,
  isLoading,
}: WebhookFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { url: "", secret: "", events: AVAILABLE_EVENTS },
  });
  const events = watch("events");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Webhook URL"
        htmlFor="webhook-url"
        error={errors.url?.message}
      >
        <FormInput
          id="webhook-url"
          placeholder="https://hooks.example.com/testcraft"
          hasError={!!errors.url}
          autoFocus
          {...register("url")}
        />
      </FormField>
      <FormField
        label="Secret (optional)"
        htmlFor="webhook-secret"
        hint="Used to sign requests with HMAC-SHA256 so you can verify they came from TestCraft."
      >
        <FormInput
          id="webhook-secret"
          placeholder="whsec_..."
          {...register("secret")}
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
        label="Add Webhook"
      />
    </form>
  );
};
