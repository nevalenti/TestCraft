const SvgIcon = ({
  children,
  size,
}: {
  children: React.ReactNode;
  size?: string;
}) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={size ?? "size-4"}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    {children}
  </svg>
);

export default SvgIcon;
