import React from "react";
import { createRoot } from "react-dom/client";
import "@loci/design-system"; // side-effect: tokens.css
import "./app.css";
import { Spine } from "./spine.js";
import { App } from "./App.js";

async function boot() {
  const spine = new Spine();
  await spine.init();
  spine.applyActivePrefs();
  const root = createRoot(document.getElementById("root")!);
  root.render(
    <React.StrictMode>
      <App spine={spine} />
    </React.StrictMode>
  );
}

void boot();
