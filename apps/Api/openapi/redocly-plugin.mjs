function EnumDescriptions() {
  return {
    NamedSchemas(schemas, { report, location }) {
      for (const [name, schema] of Object.entries(schemas)) {
        if (!Array.isArray(schema.enum)) {
          continue;
        }

        const descriptions = schema["x-enumDescriptions"] ?? {};
        const missing = schema.enum.filter((value) => !descriptions[value]);
        const unknown = Object.keys(descriptions).filter(
          (value) => !schema.enum.includes(value),
        );

        if (missing.length > 0 || unknown.length > 0) {
          report({
            message: [
              missing.length > 0 &&
                `describe ${missing.join(", ")} in x-enumDescriptions`,
              unknown.length > 0 &&
                `remove ${unknown.join(", ")} from x-enumDescriptions`,
            ]
              .filter(Boolean)
              .join("; "),
            location: location.child([name]),
          });
        }
      }
    },
  };
}

export default function testcraftPlugin() {
  return {
    id: "testcraft",
    rules: {
      oas3: {
        "enum-descriptions": EnumDescriptions,
      },
    },
  };
}
