namespace TestCraft.Domain.Exceptions;

public static class DomainErrorCodes
{
    public const string RequiredField = "REQUIRED_FIELD";

    public const string UnknownRunStatus = "UNKNOWN_RUN_STATUS";
    public const string InvalidRunStatusTransition = "INVALID_RUN_STATUS_TRANSITION";
    public const string RunNotModifiable = "RUN_NOT_MODIFIABLE";

    public const string InvalidImportJobStatusTransition = "INVALID_IMPORT_JOB_STATUS_TRANSITION";
    public const string InvalidNotificationDeliveryStatusTransition =
        "INVALID_NOTIFICATION_DELIVERY_STATUS_TRANSITION";

    public const string InvalidJUnitXml = "INVALID_JUNIT_XML";

    public const string ProjectNameTaken = "PROJECT_NAME_TAKEN";

    public const string StepsNotFound = "STEPS_NOT_FOUND";

    public const string UserNotAuthenticated = "USER_NOT_AUTHENTICATED";
    public const string MissingSubjectClaim = "MISSING_SUBJECT_CLAIM";

    public const string UserNotFound = "USER_NOT_FOUND";
    public const string AlreadyProjectOwner = "ALREADY_PROJECT_OWNER";
    public const string MemberAlreadyExists = "MEMBER_ALREADY_EXISTS";
}
