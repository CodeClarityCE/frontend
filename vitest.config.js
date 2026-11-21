import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import viteConfig from "./vite.config.ts";
export default mergeConfig(viteConfig, defineConfig({
    test: {
        environment: "jsdom",
        // Chart export reads the token and chart role values from these files
        css: {
            include: [/base_components\/charts\/chart\.css/, /assets\/main\.css/],
        },
        exclude: [...configDefaults.exclude, "e2e/*"],
        root: fileURLToPath(new URL("./", import.meta.url)),
        setupFiles: ["./tests/setup.ts"],
        env: {
            MODE: "test",
            NODE_ENV: "test",
        },
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            exclude: [
                ...(configDefaults.coverage?.exclude || []),
                "tests/**",
                "e2e/**",
                "src/**/*.stories.ts",
                "src/**/*.d.ts",
                "cypress/**",
            ],
        },
        globals: true,
        isolate: true,
        testTimeout: 10000,
        hookTimeout: 10000,
    },
}));
