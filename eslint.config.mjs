import next from "eslint-config-next"

const config = [
  ...next,
  {
    rules: {
      "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    },
  },
]

export default config
