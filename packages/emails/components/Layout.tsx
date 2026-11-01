import { Body, Container, Head, Html, Preview, Text } from "react-email";
import type { ReactNode } from "react";

export function Layout({
  preview,
  children,
}: {
  preview: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: "#f4f4f5",
          fontFamily: "Arial, sans-serif",
          color: "#18181b",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            padding: "32px",
            margin: "32px auto",
            borderRadius: "12px",
          }}
        >
          <Text style={{ fontWeight: "bold", color: "#7c3aed" }}>
            TestCraft
          </Text>
          {children}
          <Text style={{ color: "#71717a", fontSize: "12px" }}>
            You received this email because you subscribed to project
            notifications.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
