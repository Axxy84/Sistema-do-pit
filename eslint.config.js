import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";

export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: pluginReact,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "no-console": "warn", // Esta regra geral ainda existe, mas será sobrescrita abaixo
    },
  },
  {
    files: ["backend/**/*.{js,mjs,cjs}"],
    rules: {
      "no-console": "off", // Já fizemos isso para o backend
    },
  },
  // **ESTA É A SEÇÃO CRÍTICA QUE VOCÊ VAI AJUSTAR AGORA**
  {
    files: ["src/**/*.{jsx,js,ts,tsx}"], // Alvo: arquivos JSX/JS/TS/TSX dentro da pasta 'src'
    rules: {
      "no-console": "off", // <--- ADICIONE/MODIFIQUE ESTA LINHA AQUI!
    },
  },
  // Para o vite.config.js, como é um arquivo único, podemos adicionar uma entrada específica
  // ou decidir removê-lo manualmente (muitas vezes é o melhor para configs como essa)
  {
    files: ["vite.config.js"],
    rules: {
      "no-console": "off", // <--- ADICIONE ESTA PARA O VITE.CONFIG.JS
    },
  },
];