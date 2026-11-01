import { zodResolver } from "@hookform/resolvers/zod";
import { AssignableRole } from "@testcraft/types";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { FormActions } from "@/components/ui/form/FormActions";
import { FormField } from "@/components/ui/form/FormField";
import { FormInput } from "@/components/ui/form/FormInput";
import { FormSelect } from "@/components/ui/form/FormSelect";
import { MEMBER_ROLE_LABELS } from "@/features/projectMembers/roles";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Must be a valid email"),
  role: z.nativeEnum(AssignableRole),
});

type FormValues = z.infer<typeof schema>;

interface MemberFormProps {
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isLoading: boolean;
  roles: AssignableRole[];
}

export const MemberForm = ({
  onSubmit,
  onCancel,
  isLoading,
  roles,
}: MemberFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: AssignableRole.Editor },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField
        label="Email address"
        htmlFor="member-email"
        error={errors.email?.message}
      >
        <FormInput
          id="member-email"
          type="email"
          placeholder="teammate@example.com"
          hasError={!!errors.email}
          autoFocus
          {...register("email")}
        />
      </FormField>
      <FormField
        label="Role"
        htmlFor="member-role"
        error={errors.role?.message}
      >
        <FormSelect
          id="member-role"
          className="select-bordered select w-full"
          {...register("role")}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {MEMBER_ROLE_LABELS[role]}
            </option>
          ))}
        </FormSelect>
      </FormField>
      <p className="text-xs text-fg-muted">
        Viewers can read everything. Editors can also change test data. Admins
        can also manage members, API tokens and notifications.
      </p>
      <FormActions onCancel={onCancel} isLoading={isLoading} label="Add" />
    </form>
  );
};
