import { createRoot } from "react-dom/client";
import { ConfirmModal } from "./ConfirmModal";

export function ConfirmFunc(text, yesText = "Да", showNoText = true, options = {}) {
  return new Promise((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const handleResult = (result) => {
      root.unmount();
      container.remove();
      resolve(result);
    };

    root.render(
      <ConfirmModal
        text={text}
        yesText={yesText}
        showNoText={showNoText}
        onResult={handleResult}
        {...options}
      />,
    );
  });
}
