export default [
  // Cloudflare Workers code
  {
    files: ["html/functions/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        Response: "readonly",
        Request: "readonly",
        Headers: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
        crypto: "readonly",
        TextEncoder: "readonly",
        btoa: "readonly",
        atob: "readonly",
        console: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", { "args": "none", "caughtErrors": "none" }]
    }
  },

  // Browser scripts (exclude workers and tools)
  {
    files: ["html/**/*.js"],
    ignores: ["html/functions/**", "html/tools/**"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        fetch: "readonly",
        location: "readonly",
        setTimeout: "readonly",
        localStorage: "readonly",
        Blob: "readonly",
        URL: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", { "args": "none", "caughtErrors": "none" }]
    }
  },

  // Node scripts in tools/
  {
    files: ["html/tools/**/*.js"],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "commonjs",
      globals: {
        require: "readonly",
        module: "readonly",
        process: "readonly",
        console: "readonly"
      }
    },
    rules: {
      "no-undef": "error",
      "no-unused-vars": ["error", { "args": "none", "caughtErrors": "none" }]
    }
  }
];
