import { useEffect, useRef } from "react";

export function ConfirmModal({
  text,
  yesText,
  noText = "Нет",
  showNoText,
  closeOnBackdrop = true,
  onResult,
}) {
  const dialogRef = useRef(null);

  useEffect(() => {
    // фокус на кнопку «Да» при открытии
    dialogRef.current?.querySelector(".btn-yes")?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") onResult(false);
      if (e.key === "Enter") onResult(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onResult]);

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true">
        <div
          className="modal-dialog modal-dialog-centered"
          ref={dialogRef}
          onClick={(e) => {
            if (closeOnBackdrop && e.target === e.currentTarget) onResult(false);
          }}
        >
          <div className="modal-content shadow">
            <div className="modal-header">
              <h5 className="modal-title">Подтверждение</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Закрыть"
                onClick={() => onResult(false)}
              />
            </div>

            <div className="modal-body">
              <p className="mb-0">{text}</p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary btn-no"
                onClick={() => onResult(false)}
                hidden={!showNoText}
              >
                {noText}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-yes"
                onClick={() => onResult(true)}
              >
                {yesText}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* затемнение фона — отдельный элемент, как в Bootstrap */}
      <div className="modal-backdrop fade show" />
    </>
  );
}
