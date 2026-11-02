import { Button, Heading, Text } from "react-email";

import { Layout } from "../components/Layout";

export default function RunCompleted({
  runName = "Regression tests",
  runUrl = "https://testcraft.pro/projects/example/runs/example",
}: {
  runName?: string;
  runUrl?: string;
}) {
  return (
    <Layout preview={`Test run ${runName} has completed.`}>
      <Heading as="h1">Test run completed</Heading>
      <Text>
        Test run <b>{runName}</b> has completed.
      </Text>
      <Button
        href={runUrl}
        style={{
          backgroundColor: "#7c3aed",
          color: "#ffffff",
          padding: "12px 20px",
          borderRadius: "6px",
        }}
      >
        View test run
      </Button>
    </Layout>
  );
}
