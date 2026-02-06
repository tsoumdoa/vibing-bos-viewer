import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === "lib") {
    return {
      plugins: [react(), dts({ include: ["src"], insertTypesEntry: true })],
      build: {
        lib: {
          entry: resolve(__dirname, "src/index.ts"),
          name: "Ara3DReactWebGL",
          fileName: (format) => `ara3d-react-webgl.${format}.js`,
          formats: ["es", "umd"],
        },
        rollupOptions: {
          external: [
            "react",
            "react-dom",
            "three",
            "@react-three/fiber",
            "@react-three/drei",
          ],
          output: {
            globals: {
              react: "React",
              "react-dom": "ReactDOM",
              three: "THREE",
              "@react-three/fiber": "ReactThreeFiber",
              "@react-three/drei": "ReactThreeDrei",
            },
          },
        },
      },
    };
  }

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },
  };
});
