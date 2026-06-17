import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

let confirmResolve: ((result: boolean) => void) | null = null;

export const confirmDialog = (message = "Are you sure?") => {
    const container = document.createElement("div");
    document.body.appendChild(container);

    return new Promise<boolean>((resolve) => {
        confirmResolve = resolve;
        const root = createRoot(container);
        root.render(<ConfirmDialog message={message} container={container} root={root} />);
    });
};

const ConfirmDialog = ({ message, container, root }:any) => {
    const [open, setOpen] = useState(true);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setAnimate(true), 10);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = (result: boolean) => {
        setAnimate(false);
        setTimeout(() => {
            setOpen(false);
            if (confirmResolve) confirmResolve(result);
            root.unmount();
            document.body.removeChild(container);
        }, 200);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]">
            <div
                className={`bg-white rounded-lg p-5 w-80 shadow-lg text-center transform transition-all duration-200
                    ${animate ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}
            >
                <p className="text-gray-700 mb-4">{message}</p>
                <div className="flex justify-center gap-3">
                    <button
                        onClick={() => handleClose(false)}
                        className="px-4 py-1 rounded bg-gray-200 cursor-pointer hover:bg-gray-300 text-gray-800"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleClose(true)}
                        className="px-4 py-1 rounded bg-red-500 cursor-pointer hover:bg-red-600 text-white"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};
